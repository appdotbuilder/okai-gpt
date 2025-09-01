import { db } from '../db';
import { chatSessionsTable, chatMessagesTable } from '../db/schema';

export async function clearChatHistory(): Promise<void> {
  try {
    // Delete all chat messages first (due to foreign key constraint)
    await db.delete(chatMessagesTable).execute();
    
    // Then delete all chat sessions
    await db.delete(chatSessionsTable).execute();
  } catch (error) {
    console.error('Failed to clear chat history:', error);
    throw error;
  }
}