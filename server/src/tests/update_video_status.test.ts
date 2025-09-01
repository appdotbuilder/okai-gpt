import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { generatedVideosTable } from '../db/schema';
import { type UpdateGeneratedVideoInput } from '../schema';
import { updateVideoStatus } from '../handlers/update_video_status';
import { eq } from 'drizzle-orm';

describe('updateVideoStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Create a test video first
  const createTestVideo = async () => {
    const result = await db.insert(generatedVideosTable)
      .values({
        prompt: 'Test video prompt',
        initial_image_url: 'http://example.com/image.jpg',
        status: 'pending'
      })
      .returning()
      .execute();
    
    return result[0];
  };

  it('should update video status', async () => {
    const testVideo = await createTestVideo();
    
    const updateInput: UpdateGeneratedVideoInput = {
      id: testVideo.id,
      status: 'processing',
      progress_message: 'Video generation in progress'
    };

    const result = await updateVideoStatus(updateInput);

    expect(result.id).toEqual(testVideo.id);
    expect(result.status).toEqual('processing');
    expect(result.progress_message).toEqual('Video generation in progress');
    expect(result.prompt).toEqual('Test video prompt');
    expect(result.initial_image_url).toEqual('http://example.com/image.jpg');
  });

  it('should update video URL when completed', async () => {
    const testVideo = await createTestVideo();
    const completedAt = new Date();
    
    const updateInput: UpdateGeneratedVideoInput = {
      id: testVideo.id,
      status: 'completed',
      video_url: 'http://example.com/generated-video.mp4',
      progress_message: 'Video generation completed',
      completed_at: completedAt
    };

    const result = await updateVideoStatus(updateInput);

    expect(result.id).toEqual(testVideo.id);
    expect(result.status).toEqual('completed');
    expect(result.video_url).toEqual('http://example.com/generated-video.mp4');
    expect(result.progress_message).toEqual('Video generation completed');
    expect(result.completed_at).toEqual(completedAt);
  });

  it('should update failed status with error message', async () => {
    const testVideo = await createTestVideo();
    
    const updateInput: UpdateGeneratedVideoInput = {
      id: testVideo.id,
      status: 'failed',
      progress_message: 'Video generation failed due to invalid prompt'
    };

    const result = await updateVideoStatus(updateInput);

    expect(result.status).toEqual('failed');
    expect(result.progress_message).toEqual('Video generation failed due to invalid prompt');
    expect(result.video_url).toBeNull();
    expect(result.completed_at).toBeNull();
  });

  it('should update only provided fields', async () => {
    const testVideo = await createTestVideo();
    
    // First update - only status
    const firstUpdate: UpdateGeneratedVideoInput = {
      id: testVideo.id,
      status: 'processing'
    };

    const firstResult = await updateVideoStatus(firstUpdate);
    expect(firstResult.status).toEqual('processing');
    expect(firstResult.progress_message).toBeNull(); // Should remain unchanged
    expect(firstResult.video_url).toBeNull(); // Should remain unchanged

    // Second update - only progress message
    const secondUpdate: UpdateGeneratedVideoInput = {
      id: testVideo.id,
      progress_message: 'Halfway done'
    };

    const secondResult = await updateVideoStatus(secondUpdate);
    expect(secondResult.status).toEqual('processing'); // Should remain unchanged
    expect(secondResult.progress_message).toEqual('Halfway done');
  });

  it('should save changes to database', async () => {
    const testVideo = await createTestVideo();
    
    const updateInput: UpdateGeneratedVideoInput = {
      id: testVideo.id,
      status: 'completed',
      video_url: 'http://example.com/final-video.mp4'
    };

    await updateVideoStatus(updateInput);

    // Verify changes were persisted
    const videos = await db.select()
      .from(generatedVideosTable)
      .where(eq(generatedVideosTable.id, testVideo.id))
      .execute();

    expect(videos).toHaveLength(1);
    expect(videos[0].status).toEqual('completed');
    expect(videos[0].video_url).toEqual('http://example.com/final-video.mp4');
  });

  it('should handle null values correctly', async () => {
    const testVideo = await createTestVideo();
    
    // Set some values first
    await updateVideoStatus({
      id: testVideo.id,
      progress_message: 'Initial message',
      video_url: 'http://example.com/temp.mp4'
    });

    // Now update with null values
    const updateInput: UpdateGeneratedVideoInput = {
      id: testVideo.id,
      progress_message: null,
      video_url: null
    };

    const result = await updateVideoStatus(updateInput);
    expect(result.progress_message).toBeNull();
    expect(result.video_url).toBeNull();
  });

  it('should throw error for non-existent video', async () => {
    const updateInput: UpdateGeneratedVideoInput = {
      id: 99999,
      status: 'completed'
    };

    expect(updateVideoStatus(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should update with completed_at timestamp', async () => {
    const testVideo = await createTestVideo();
    const completedDate = new Date('2024-01-01T12:00:00Z');
    
    const updateInput: UpdateGeneratedVideoInput = {
      id: testVideo.id,
      status: 'completed',
      completed_at: completedDate
    };

    const result = await updateVideoStatus(updateInput);
    expect(result.completed_at).toEqual(completedDate);
  });
});