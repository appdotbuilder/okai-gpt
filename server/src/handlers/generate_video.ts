import { db } from '../db';
import { generatedVideosTable } from '../db/schema';
import { type CreateGeneratedVideoInput, type GeneratedVideo } from '../schema';

export const generateVideo = async (input: CreateGeneratedVideoInput): Promise<GeneratedVideo> => {
  try {
    // Insert video generation record with pending status
    const result = await db.insert(generatedVideosTable)
      .values({
        prompt: input.prompt,
        initial_image_url: input.initial_image_url || null,
        video_url: null, // Will be populated when generation completes
        status: 'pending',
        progress_message: 'Video generation queued'
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Video generation initialization failed:', error);
    throw error;
  }
};