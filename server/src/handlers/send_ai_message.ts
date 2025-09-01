import { db } from '../db';
import { chatMessagesTable, chatSessionsTable } from '../db/schema';
import { type SendAiMessageInput, type ChatMessage } from '../schema';
import { eq } from 'drizzle-orm';

// Mock puter.ai.chat for now since the actual package might not be available
const mockPuterAI = {
  chat: async (options: any) => {
    const { messages, model } = options;
    const lastMessage = messages[messages.length - 1];
    
    // Simulate AI response based on mode and content
    let response = '';
    
    if (lastMessage.genZMode) {
      response = "yo that's actually fire 🔥 lemme break this down for you real quick... ";
    } else if (lastMessage.copyCodeOnlyMode) {
      response = "```javascript\n// Here's the code you requested\nconsole.log('Hello, World!');\n```";
    } else {
      response = "I understand your message and I'm here to help. ";
    }
    
    // Add context-aware responses
    if (lastMessage.imageFileBase64) {
      response += "I can see the image you've shared. ";
    }
    
    if (lastMessage.pdfFileContent) {
      response += "I've reviewed the PDF content you provided. ";
    }
    
    response += "Let me provide you with a comprehensive response based on your input.";
    
    return {
      choices: [{
        message: {
          content: response
        }
      }]
    };
  }
};

export const sendAiMessage = async (input: SendAiMessageInput): Promise<ChatMessage> => {
  try {
    // 1. Validate the session ID
    const sessionExists = await db.select()
      .from(chatSessionsTable)
      .where(eq(chatSessionsTable.id, input.sessionId))
      .execute();
    
    if (sessionExists.length === 0) {
      throw new Error('Session not found');
    }

    // 2. Create the user message
    let userContent = input.messageContent;
    let contentType: 'text' | 'image' | 'pdf' = 'text';
    let metadata: Record<string, any> | null = null;

    if (input.imageFileBase64) {
      contentType = 'image';
      metadata = { hasImage: true };
    } else if (input.pdfFileContent) {
      contentType = 'pdf';
      metadata = { hasPdf: true };
      // Prepend PDF content as context
      userContent = `PDF Content: ${input.pdfFileContent}\n\nUser Question: ${input.messageContent}`;
    }

    const userMessageResult = await db.insert(chatMessagesTable)
      .values({
        session_id: input.sessionId,
        role: 'user',
        content: userContent,
        content_type: contentType,
        metadata: metadata
      })
      .returning()
      .execute();

    const userMessage = userMessageResult[0];

    // 3. Construct the prompt for puter.ai.chat
    const messages = [{
      role: 'user',
      content: input.messageContent,
      genZMode: input.genZMode || false,
      copyCodeOnlyMode: input.copyCodeOnlyMode || false,
      targetLanguage: input.targetLanguage || 'english',
      imageFileBase64: input.imageFileBase64,
      pdfFileContent: input.pdfFileContent
    }];

    // Add system prompt based on modes
    let systemPrompt = '';
    
    if (input.genZMode) {
      systemPrompt += 'Respond in a casual, Gen Z style with slang and emojis. ';
    }
    
    if (input.copyCodeOnlyMode) {
      systemPrompt += 'Only respond with code, no explanations. ';
    }
    
    if (input.targetLanguage && input.targetLanguage !== 'english') {
      systemPrompt += `Respond in ${input.targetLanguage}. `;
    }

    if (systemPrompt) {
      messages.unshift({
        role: 'system' as any,
        content: systemPrompt,
        genZMode: false,
        copyCodeOnlyMode: false,
        targetLanguage: 'english',
        imageFileBase64: null,
        pdfFileContent: null
      });
    }

    // 4. Call puter.ai.chat (mocked for now)
    const aiResponse = await mockPuterAI.chat({
      model: "google/gemini-2.0-flash-lite-001",
      messages: messages
    });

    const aiContent = aiResponse.choices[0].message.content;

    // 5. Create the assistant message
    const assistantMessageResult = await db.insert(chatMessagesTable)
      .values({
        session_id: input.sessionId,
        role: 'assistant',
        content: aiContent,
        content_type: 'text',
        metadata: null
      })
      .returning()
      .execute();

    const assistantMessage = assistantMessageResult[0];

    // 6. Update the session's updated_at timestamp
    await db.update(chatSessionsTable)
      .set({ updated_at: new Date() })
      .where(eq(chatSessionsTable.id, input.sessionId))
      .execute();

    // 7. Return the created assistant message
    return {
      ...assistantMessage,
      metadata: assistantMessage.metadata as Record<string, any> | null
    };
  } catch (error) {
    console.error('AI message sending failed:', error);
    throw error;
  }
};