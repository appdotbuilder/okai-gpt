import { db } from '../db';
import { chatSessionsTable } from '../db/schema';
import { type ChatSession } from '../schema';
import { desc } from 'drizzle-orm';

export const getChatSessions = async (): Promise<ChatSession[]> => {
  try {
    // Fetch all chat sessions ordered by updated_at descending (most recent first)
    const result = await db.select()
      .from(chatSessionsTable)
      .orderBy(desc(chatSessionsTable.updated_at))
      .execute();

    return result;
  } catch (error) {
    console.error('Chat sessions fetch failed:', error);
    throw error;
  }
};