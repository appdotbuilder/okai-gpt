import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { generatedVideosTable } from '../db/schema';
import { type GetVideoStatusInput } from '../schema';
import { getVideoStatus } from '../handlers/get_video_status';

describe('getVideoStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get video status for pending video', async () => {
    // Create test video
    const testVideo = await db.insert(generatedVideosTable)
      .values({
        prompt: 'Test video prompt',
        initial_image_url: 'https://example.com/image.jpg',
        video_url: null,
        status: 'pending',
        progress_message: null,
        completed_at: null
      })
      .returning()
      .execute();

    const input: GetVideoStatusInput = {
      id: testVideo[0].id
    };

    const result = await getVideoStatus(input);

    expect(result.id).toEqual(testVideo[0].id);
    expect(result.prompt).toEqual('Test video prompt');
    expect(result.initial_image_url).toEqual('https://example.com/image.jpg');
    expect(result.video_url).toBeNull();
    expect(result.status).toEqual('pending');
    expect(result.progress_message).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.completed_at).toBeNull();
  });

  it('should get video status for processing video with progress message', async () => {
    // Create processing video
    const testVideo = await db.insert(generatedVideosTable)
      .values({
        prompt: 'Processing video',
        initial_image_url: null,
        video_url: null,
        status: 'processing',
        progress_message: 'Generating video frames... 50% complete',
        completed_at: null
      })
      .returning()
      .execute();

    const input: GetVideoStatusInput = {
      id: testVideo[0].id
    };

    const result = await getVideoStatus(input);

    expect(result.id).toEqual(testVideo[0].id);
    expect(result.prompt).toEqual('Processing video');
    expect(result.initial_image_url).toBeNull();
    expect(result.video_url).toBeNull();
    expect(result.status).toEqual('processing');
    expect(result.progress_message).toEqual('Generating video frames... 50% complete');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.completed_at).toBeNull();
  });

  it('should get video status for completed video', async () => {
    const completedDate = new Date();
    
    // Create completed video
    const testVideo = await db.insert(generatedVideosTable)
      .values({
        prompt: 'Completed video',
        initial_image_url: 'https://example.com/initial.jpg',
        video_url: 'https://example.com/video.mp4',
        status: 'completed',
        progress_message: 'Video generation complete',
        completed_at: completedDate
      })
      .returning()
      .execute();

    const input: GetVideoStatusInput = {
      id: testVideo[0].id
    };

    const result = await getVideoStatus(input);

    expect(result.id).toEqual(testVideo[0].id);
    expect(result.prompt).toEqual('Completed video');
    expect(result.initial_image_url).toEqual('https://example.com/initial.jpg');
    expect(result.video_url).toEqual('https://example.com/video.mp4');
    expect(result.status).toEqual('completed');
    expect(result.progress_message).toEqual('Video generation complete');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.completed_at).toBeInstanceOf(Date);
  });

  it('should get video status for failed video', async () => {
    const failedDate = new Date();
    
    // Create failed video
    const testVideo = await db.insert(generatedVideosTable)
      .values({
        prompt: 'Failed video',
        initial_image_url: null,
        video_url: null,
        status: 'failed',
        progress_message: 'Error: Unable to process video request',
        completed_at: failedDate
      })
      .returning()
      .execute();

    const input: GetVideoStatusInput = {
      id: testVideo[0].id
    };

    const result = await getVideoStatus(input);

    expect(result.id).toEqual(testVideo[0].id);
    expect(result.prompt).toEqual('Failed video');
    expect(result.initial_image_url).toBeNull();
    expect(result.video_url).toBeNull();
    expect(result.status).toEqual('failed');
    expect(result.progress_message).toEqual('Error: Unable to process video request');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.completed_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent video ID', async () => {
    const input: GetVideoStatusInput = {
      id: 999999 // Non-existent ID
    };

    await expect(getVideoStatus(input)).rejects.toThrow(/Video with id 999999 not found/i);
  });

  it('should handle all video status enum values', async () => {
    // Test all possible status values to ensure enum handling works correctly
    const statuses = ['pending', 'processing', 'completed', 'failed'] as const;
    
    for (const status of statuses) {
      const testVideo = await db.insert(generatedVideosTable)
        .values({
          prompt: `Video with ${status} status`,
          status: status,
          completed_at: status === 'completed' || status === 'failed' ? new Date() : null
        })
        .returning()
        .execute();

      const input: GetVideoStatusInput = {
        id: testVideo[0].id
      };

      const result = await getVideoStatus(input);
      expect(result.status).toEqual(status);
    }
  });
});