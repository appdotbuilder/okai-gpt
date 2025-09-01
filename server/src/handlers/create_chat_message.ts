import { db } from '../db';
import { chatMessagesTable, chatSessionsTable } from '../db/schema';
import { type CreateChatMessageInput, type ChatMessage } from '../schema';
import { eq } from 'drizzle-orm';

export const createChatMessage = async (input: CreateChatMessageInput): Promise<ChatMessage> => {
  try {
    // First, verify the session exists to prevent foreign key constraint violations
    const existingSessions = await db.select()
      .from(chatSessionsTable)
      .where(eq(chatSessionsTable.id, input.session_id))
      .execute();
    
    if (existingSessions.length === 0) {
      throw new Error(`Chat session with id ${input.session_id} does not exist`);
    }

    // Insert the chat message
    const result = await db.insert(chatMessagesTable)
      .values({
        session_id: input.session_id,
        role: input.role,
        content: input.content,
        content_type: input.content_type,
        metadata: input.metadata || null
      })
      .returning()
      .execute();

    const chatMessage = result[0];

    // Update the session's updated_at timestamp
    await db.update(chatSessionsTable)
      .set({ updated_at: new Date() })
      .where(eq(chatSessionsTable.id, input.session_id))
      .execute();

    return {
      ...chatMessage,
      metadata: chatMessage.metadata as Record<string, any> | null
    };
  } catch (error) {
    console.error('Chat message creation failed:', error);
    throw error;
  }
};