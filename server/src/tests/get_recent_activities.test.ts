import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  documentAnalysisTable, 
  generatedImagesTable, 
  generatedVideosTable, 
  quizTable, 
  webSearchTable 
} from '../db/schema';
import { getRecentActivities } from '../handlers/get_recent_activities';

describe('getRecentActivities', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no activities exist', async () => {
    const result = await getRecentActivities();
    expect(result).toEqual([]);
  });

  it('should return activities from all tables sorted by creation date', async () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);

    // Create test data in different tables with different timestamps
    await Promise.all([
      // Most recent - document analysis
      db.insert(documentAnalysisTable).values({
        image_url: 'https://example.com/image1.jpg',
        prompt: 'Analyze this document',
        analysis_result: 'This is a test analysis',
        created_at: now
      }),

      // Second most recent - web search
      db.insert(webSearchTable).values({
        query: 'test query',
        summary: 'test summary',
        sources: ['https://example.com'],
        created_at: oneHourAgo
      }),

      // Third most recent - generated video
      db.insert(generatedVideosTable).values({
        prompt: 'Create a video',
        status: 'completed',
        created_at: twoHoursAgo
      }),

      // Fourth most recent - quiz
      db.insert(quizTable).values({
        source_text: 'Test source text',
        quiz_data: { questions: [{ question: 'Test?', answer: 'Yes' }] },
        created_at: threeHoursAgo
      }),

      // Oldest - generated image
      db.insert(generatedImagesTable).values({
        prompt: 'Generate an image',
        image_url: 'https://example.com/generated.jpg',
        created_at: fourHoursAgo
      })
    ]);

    const result = await getRecentActivities();

    expect(result).toHaveLength(5);

    // Verify correct order (most recent first)
    expect(result[0].type).toBe('document_analysis');
    if (result[0].type === 'document_analysis') {
      expect(result[0].data.prompt).toBe('Analyze this document');
    }

    expect(result[1].type).toBe('web_search');
    if (result[1].type === 'web_search') {
      expect(result[1].data.query).toBe('test query');
    }

    expect(result[2].type).toBe('generated_video');
    if (result[2].type === 'generated_video') {
      expect(result[2].data.prompt).toBe('Create a video');
    }

    expect(result[3].type).toBe('quiz');
    if (result[3].type === 'quiz') {
      expect(result[3].data.source_text).toBe('Test source text');
    }

    expect(result[4].type).toBe('generated_image');
    if (result[4].type === 'generated_image') {
      expect(result[4].data.prompt).toBe('Generate an image');
    }
  });

  it('should respect the limit parameter', async () => {
    const now = new Date();

    // Create 5 activities
    await Promise.all([
      db.insert(documentAnalysisTable).values({
        image_url: 'https://example.com/image1.jpg',
        prompt: 'Analysis 1',
        analysis_result: 'Result 1',
        created_at: new Date(now.getTime() - 1000)
      }),

      db.insert(documentAnalysisTable).values({
        image_url: 'https://example.com/image2.jpg',
        prompt: 'Analysis 2',
        analysis_result: 'Result 2',
        created_at: new Date(now.getTime() - 2000)
      }),

      db.insert(generatedImagesTable).values({
        prompt: 'Image 1',
        image_url: 'https://example.com/img1.jpg',
        created_at: new Date(now.getTime() - 3000)
      }),

      db.insert(webSearchTable).values({
        query: 'Search 1',
        summary: 'Summary 1',
        sources: ['https://example.com'],
        created_at: new Date(now.getTime() - 4000)
      }),

      db.insert(quizTable).values({
        source_text: 'Quiz text',
        quiz_data: { questions: [] },
        created_at: new Date(now.getTime() - 5000)
      })
    ]);

    // Test with limit of 3
    const result = await getRecentActivities(3);

    expect(result).toHaveLength(3);
    if (result[0].type === 'document_analysis') {
      expect(result[0].data.prompt).toBe('Analysis 1');
    }
    if (result[1].type === 'document_analysis') {
      expect(result[1].data.prompt).toBe('Analysis 2');
    }
    if (result[2].type === 'generated_image') {
      expect(result[2].data.prompt).toBe('Image 1');
    }
  });

  it('should handle activities with same timestamps correctly', async () => {
    const sameTime = new Date();

    // Create multiple activities with same timestamp
    await Promise.all([
      db.insert(documentAnalysisTable).values({
        image_url: 'https://example.com/image.jpg',
        prompt: 'Document analysis',
        analysis_result: 'Analysis result',
        created_at: sameTime
      }),

      db.insert(generatedImagesTable).values({
        prompt: 'Image generation',
        image_url: 'https://example.com/image.jpg',
        created_at: sameTime
      }),

      db.insert(webSearchTable).values({
        query: 'Web search',
        summary: 'Search summary',
        sources: ['https://example.com'],
        created_at: sameTime
      })
    ]);

    const result = await getRecentActivities();

    expect(result).toHaveLength(3);
    
    // All should have the same timestamp
    result.forEach(activity => {
      expect(activity.data.created_at).toEqual(sameTime);
    });

    // Should contain all three types
    const types = result.map(r => r.type);
    expect(types).toContain('document_analysis');
    expect(types).toContain('generated_image');
    expect(types).toContain('web_search');
  });

  it('should handle large limit values correctly', async () => {
    // Create only 2 activities
    await Promise.all([
      db.insert(documentAnalysisTable).values({
        image_url: 'https://example.com/image.jpg',
        prompt: 'Test analysis',
        analysis_result: 'Test result',
        created_at: new Date()
      }),

      db.insert(generatedImagesTable).values({
        prompt: 'Test image',
        image_url: 'https://example.com/test.jpg',
        created_at: new Date(Date.now() - 1000)
      })
    ]);

    // Request 100 activities but only 2 exist
    const result = await getRecentActivities(100);

    expect(result).toHaveLength(2);
  });

  it('should handle video status enum correctly', async () => {
    await db.insert(generatedVideosTable).values({
      prompt: 'Test video',
      status: 'completed',
      video_url: 'https://example.com/video.mp4',
      created_at: new Date()
    });

    const result = await getRecentActivities();

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('generated_video');
    if (result[0].type === 'generated_video') {
      expect(result[0].data.status).toBe('completed');
      expect(result[0].data.video_url).toBe('https://example.com/video.mp4');
    }
  });

  it('should handle JSON fields correctly', async () => {
    const quizData = {
      questions: [
        { question: 'What is 2+2?', answer: '4', options: ['3', '4', '5'] },
        { question: 'What is the capital of France?', answer: 'Paris' }
      ],
      title: 'Math and Geography Quiz'
    };

    const sources = ['https://example.com/source1', 'https://example.com/source2'];

    await Promise.all([
      db.insert(quizTable).values({
        source_text: 'Educational content',
        quiz_data: quizData,
        created_at: new Date()
      }),

      db.insert(webSearchTable).values({
        query: 'Test search',
        summary: 'Search results summary',
        sources: sources,
        created_at: new Date(Date.now() - 1000)
      })
    ]);

    const result = await getRecentActivities();

    expect(result).toHaveLength(2);
    
    // Verify quiz data
    const quizActivity = result.find(r => r.type === 'quiz');
    expect(quizActivity).toBeDefined();
    expect(quizActivity!.data.quiz_data).toEqual(quizData);

    // Verify web search sources
    const webSearchActivity = result.find(r => r.type === 'web_search');
    expect(webSearchActivity).toBeDefined();
    expect(webSearchActivity!.data.sources).toEqual(sources);
  });

  it('should use default limit of 10 when no limit provided', async () => {
    // Create 15 activities
    const promises = [];
    for (let i = 0; i < 15; i++) {
      promises.push(
        db.insert(documentAnalysisTable).values({
          image_url: `https://example.com/image${i}.jpg`,
          prompt: `Analysis ${i}`,
          analysis_result: `Result ${i}`,
          created_at: new Date(Date.now() - i * 1000)
        })
      );
    }

    await Promise.all(promises);

    const result = await getRecentActivities(); // No limit specified

    expect(result).toHaveLength(10); // Should default to 10
  });
});