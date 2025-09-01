import { db } from '../db';
import { generatedVideosTable } from '../db/schema';
import { type UpdateGeneratedVideoInput, type GeneratedVideo } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateVideoStatus(input: UpdateGeneratedVideoInput): Promise<GeneratedVideo> {
  try {
    // Build update object with only provided fields
    const updateData: Partial<typeof generatedVideosTable.$inferInsert> = {};
    
    if (input.video_url !== undefined) {
      updateData.video_url = input.video_url;
    }
    
    if (input.status !== undefined) {
      updateData.status = input.status;
    }
    
    if (input.progress_message !== undefined) {
      updateData.progress_message = input.progress_message;
    }
    
    if (input.completed_at !== undefined) {
      updateData.completed_at = input.completed_at;
    }

    // Update the video record
    const result = await db.update(generatedVideosTable)
      .set(updateData)
      .where(eq(generatedVideosTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Generated video with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Video status update failed:', error);
    throw error;
  }
}