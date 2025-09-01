import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { generatedImagesTable } from '../db/schema';
import { type CreateGeneratedImageInput } from '../schema';
import { generateImage } from '../handlers/generate_image';
import { eq, gte } from 'drizzle-orm';

// Test input
const testInput: CreateGeneratedImageInput = {
  prompt: 'A beautiful sunset over mountains'
};

const longPromptInput: CreateGeneratedImageInput = {
  prompt: 'A very detailed and elaborate description of a fantastical landscape with dragons flying over crystal clear lakes surrounded by towering snow-capped mountains and ancient forests filled with magical creatures'
};

describe('generateImage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should generate an image and save to database', async () => {
    const result = await generateImage(testInput);

    // Verify returned data structure
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.prompt).toEqual('A beautiful sunset over mountains');
    expect(result.image_url).toBeDefined();
    expect(typeof result.image_url).toBe('string');
    expect(result.image_url.startsWith('https://')).toBe(true);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save generated image to database correctly', async () => {
    const result = await generateImage(testInput);

    // Query database to verify record was saved
    const images = await db.select()
      .from(generatedImagesTable)
      .where(eq(generatedImagesTable.id, result.id))
      .execute();

    expect(images).toHaveLength(1);
    expect(images[0].prompt).toEqual('A beautiful sunset over mountains');
    expect(images[0].image_url).toEqual(result.image_url);
    expect(images[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle long prompts correctly', async () => {
    const result = await generateImage(longPromptInput);

    expect(result.prompt).toEqual(longPromptInput.prompt);
    expect(result.image_url).toBeDefined();
    expect(result.image_url.length).toBeGreaterThan(0);
    
    // Verify in database
    const images = await db.select()
      .from(generatedImagesTable)
      .where(eq(generatedImagesTable.id, result.id))
      .execute();

    expect(images).toHaveLength(1);
    expect(images[0].prompt).toEqual(longPromptInput.prompt);
  });

  it('should generate unique image URLs for different prompts', async () => {
    const input1: CreateGeneratedImageInput = { prompt: 'A red car' };
    const input2: CreateGeneratedImageInput = { prompt: 'A blue house' };

    const result1 = await generateImage(input1);
    const result2 = await generateImage(input2);

    expect(result1.image_url).not.toEqual(result2.image_url);
    expect(result1.prompt).toEqual('A red car');
    expect(result2.prompt).toEqual('A blue house');
  });

  it('should handle special characters in prompts', async () => {
    const specialInput: CreateGeneratedImageInput = {
      prompt: 'A café with ñoño & "quotes" + symbols!'
    };

    const result = await generateImage(specialInput);

    expect(result.prompt).toEqual(specialInput.prompt);
    expect(result.image_url).toBeDefined();
    
    // Verify URL is properly encoded
    expect(result.image_url.includes('%')).toBe(true); // URL encoding present
  });

  it('should create records with proper timestamps', async () => {
    const beforeGeneration = new Date();
    const result = await generateImage(testInput);
    const afterGeneration = new Date();

    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at >= beforeGeneration).toBe(true);
    expect(result.created_at <= afterGeneration).toBe(true);
  });

  it('should query generated images by date range', async () => {
    // Create test image
    await generateImage(testInput);

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Query images from today onwards
    const images = await db.select()
      .from(generatedImagesTable)
      .where(gte(generatedImagesTable.created_at, yesterday))
      .execute();

    expect(images.length).toBeGreaterThan(0);
    images.forEach(image => {
      expect(image.created_at).toBeInstanceOf(Date);
      expect(image.created_at >= yesterday).toBe(true);
    });
  });

  it('should create multiple images successfully', async () => {
    const inputs = [
      { prompt: 'Mountain landscape' },
      { prompt: 'Ocean waves' },
      { prompt: 'City skyline' }
    ];

    const results = await Promise.all(inputs.map(input => generateImage(input)));

    expect(results).toHaveLength(3);
    
    // Verify all have unique IDs
    const ids = results.map(r => r.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(3);

    // Verify all prompts are preserved
    expect(results[0].prompt).toBe('Mountain landscape');
    expect(results[1].prompt).toBe('Ocean waves');
    expect(results[2].prompt).toBe('City skyline');
  });
});