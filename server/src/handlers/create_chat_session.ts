import { db } from '../db';
import { chatSessionsTable } from '../db/schema';
import { type CreateChatSessionInput, type ChatSession } from '../schema';
import { randomUUID } from 'crypto';

export const createChatSession = async (input: CreateChatSessionInput): Promise<ChatSession> => {
  try {
    // Generate session ID if not provided
    const sessionId = input.id || randomUUID();
    
    // Insert chat session record
    const result = await db.insert(chatSessionsTable)
      .values({
        id: sessionId,
        title: input.title ?? null,
        gen_z_mode: input.gen_z_mode ?? false,
        copy_code_only_mode: input.copy_code_only_mode ?? false,
        target_language: input.target_language ?? null
      })
      .returning()
      .execute();

    const session = result[0];
    return session;
  } catch (error) {
    console.error('Chat session creation failed:', error);
    throw error;
  }
};