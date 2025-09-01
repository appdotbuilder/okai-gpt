import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { generatedVideosTable } from '../db/schema';
import { type CreateGeneratedVideoInput } from '../schema';
import { generateVideo } from '../handlers/generate_video';
import { eq } from 'drizzle-orm';

// Test inputs
const testInputWithImage: CreateGeneratedVideoInput = {
  prompt: 'A beautiful sunset over the ocean with waves crashing',
  initial_image_url: 'https://example.com/sunset.jpg'
};

const testInputTextOnly: CreateGeneratedVideoInput = {
  prompt: 'A cat playing with a ball of yarn'
};

const testInputWithNullImage: CreateGeneratedVideoInput = {
  prompt: 'Abstract geometric shapes in motion',
  initial_image_url: null
};

describe('generateVideo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create video generation record with initial image', async () => {
    const result = await generateVideo(testInputWithImage);

    // Basic field validation
    expect(result.prompt).toEqual('A beautiful sunset over the ocean with waves crashing');
    expect(result.initial_image_url).toEqual('https://example.com/sunset.jpg');
    expect(result.video_url).toBeNull();
    expect(result.status).toEqual('pending');
    expect(result.progress_message).toEqual('Video generation queued');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.completed_at).toBeNull();
  });

  it('should create video generation record without initial image', async () => {
    const result = await generateVideo(testInputTextOnly);

    // Basic field validation
    expect(result.prompt).toEqual('A cat playing with a ball of yarn');
    expect(result.initial_image_url).toBeNull();
    expect(result.video_url).toBeNull();
    expect(result.status).toEqual('pending');
    expect(result.progress_message).toEqual('Video generation queued');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.completed_at).toBeNull();
  });

  it('should handle explicit null initial_image_url', async () => {
    const result = await generateVideo(testInputWithNullImage);

    expect(result.prompt).toEqual('Abstract geometric shapes in motion');
    expect(result.initial_image_url).toBeNull();
    expect(result.status).toEqual('pending');
  });

  it('should save video generation record to database', async () => {
    const result = await generateVideo(testInputWithImage);

    // Query database to verify record was saved
    const videos = await db.select()
      .from(generatedVideosTable)
      .where(eq(generatedVideosTable.id, result.id))
      .execute();

    expect(videos).toHaveLength(1);
    expect(videos[0].prompt).toEqual('A beautiful sunset over the ocean with waves crashing');
    expect(videos[0].initial_image_url).toEqual('https://example.com/sunset.jpg');
    expect(videos[0].video_url).toBeNull();
    expect(videos[0].status).toEqual('pending');
    expect(videos[0].progress_message).toEqual('Video generation queued');
    expect(videos[0].created_at).toBeInstanceOf(Date);
    expect(videos[0].completed_at).toBeNull();
  });

  it('should create multiple video generation records independently', async () => {
    const result1 = await generateVideo(testInputWithImage);
    const result2 = await generateVideo(testInputTextOnly);

    // Verify both records exist and are different
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.prompt).toEqual('A beautiful sunset over the ocean with waves crashing');
    expect(result2.prompt).toEqual('A cat playing with a ball of yarn');

    // Query database to verify both records were saved
    const allVideos = await db.select()
      .from(generatedVideosTable)
      .execute();

    expect(allVideos).toHaveLength(2);
    
    const video1 = allVideos.find(v => v.id === result1.id);
    const video2 = allVideos.find(v => v.id === result2.id);
    
    expect(video1).toBeDefined();
    expect(video2).toBeDefined();
    expect(video1!.initial_image_url).toEqual('https://example.com/sunset.jpg');
    expect(video2!.initial_image_url).toBeNull();
  });

  it('should handle empty string prompt', async () => {
    const inputWithEmptyPrompt: CreateGeneratedVideoInput = {
      prompt: ''
    };

    const result = await generateVideo(inputWithEmptyPrompt);

    expect(result.prompt).toEqual('');
    expect(result.status).toEqual('pending');
    expect(result.initial_image_url).toBeNull();
  });

  it('should handle very long prompt', async () => {
    const longPrompt = 'A'.repeat(1000) + ' very detailed and elaborate video scene';
    const inputWithLongPrompt: CreateGeneratedVideoInput = {
      prompt: longPrompt
    };

    const result = await generateVideo(inputWithLongPrompt);

    expect(result.prompt).toEqual(longPrompt);
    expect(result.status).toEqual('pending');
  });
});