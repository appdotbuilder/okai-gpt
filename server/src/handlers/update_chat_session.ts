import { db } from '../db';
import { chatSessionsTable } from '../db/schema';
import { type UpdateChatSessionInput, type ChatSession } from '../schema';
import { eq } from 'drizzle-orm';

export const updateChatSession = async (input: UpdateChatSessionInput): Promise<ChatSession> => {
  try {
    // Build the update object with only provided fields
    const updateData: Partial<typeof chatSessionsTable.$inferInsert> = {
      updated_at: new Date() // Always update the timestamp
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }

    if (input.gen_z_mode !== undefined) {
      updateData.gen_z_mode = input.gen_z_mode;
    }

    if (input.copy_code_only_mode !== undefined) {
      updateData.copy_code_only_mode = input.copy_code_only_mode;
    }

    if (input.target_language !== undefined) {
      updateData.target_language = input.target_language;
    }

    // Update the chat session
    const result = await db.update(chatSessionsTable)
      .set(updateData)
      .where(eq(chatSessionsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Chat session with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Chat session update failed:', error);
    throw error;
  }
};