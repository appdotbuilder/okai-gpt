import { db } from '../db';
import { generatedVideosTable } from '../db/schema';
import { type GetVideoStatusInput, type GeneratedVideo } from '../schema';
import { eq } from 'drizzle-orm';

export const getVideoStatus = async (input: GetVideoStatusInput): Promise<GeneratedVideo> => {
  try {
    // Query the video by ID
    const results = await db.select()
      .from(generatedVideosTable)
      .where(eq(generatedVideosTable.id, input.id))
      .execute();

    if (results.length === 0) {
      throw new Error(`Video with id ${input.id} not found`);
    }

    // Return the video status data
    const video = results[0];
    return {
      id: video.id,
      prompt: video.prompt,
      initial_image_url: video.initial_image_url,
      video_url: video.video_url,
      status: video.status,
      progress_message: video.progress_message,
      created_at: video.created_at,
      completed_at: video.completed_at
    };
  } catch (error) {
    console.error('Get video status failed:', error);
    throw error;
  }
};