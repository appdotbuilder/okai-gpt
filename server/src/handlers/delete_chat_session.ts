import { db } from '../db';
import { chatSessionsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteChatSession(sessionId: string): Promise<void> {
  try {
    // Delete the chat session - cascade delete will handle associated messages
    await db.delete(chatSessionsTable)
      .where(eq(chatSessionsTable.id, sessionId))
      .execute();
  } catch (error) {
    console.error('Chat session deletion failed:', error);
    throw error;
  }
}