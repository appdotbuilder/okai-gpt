import { db } from '../db';
import { chatMessagesTable } from '../db/schema';
import { type GetChatMessagesInput, type ChatMessage } from '../schema';
import { eq, asc } from 'drizzle-orm';

export const getChatMessages = async (input: GetChatMessagesInput): Promise<ChatMessage[]> => {
  try {
    // Build query with all required methods upfront to satisfy TypeScript
    const limit = input.limit ?? 1000; // Use high default if not specified
    const offset = input.offset ?? 0;

    const results = await db.select()
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.session_id, input.session_id))
      .orderBy(asc(chatMessagesTable.created_at))
      .limit(limit)
      .offset(offset)
      .execute();

    // Return results with proper type mapping for metadata
    return results.map(row => ({
      ...row,
      metadata: row.metadata as Record<string, any> | null
    }));
  } catch (error) {
    console.error('Failed to fetch chat messages:', error);
    throw error;
  }
};