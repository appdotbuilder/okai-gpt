import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { webSearchTable } from '../db/schema';
import { type CreateWebSearchInput } from '../schema';
import { searchWeb } from '../handlers/search_web';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateWebSearchInput = {
  query: 'latest developments in AI technology'
};

describe('searchWeb', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a web search record', async () => {
    const result = await searchWeb(testInput);

    // Basic field validation
    expect(result.query).toEqual('latest developments in AI technology');
    expect(result.summary).toBeDefined();
    expect(typeof result.summary).toBe('string');
    expect(result.summary.length).toBeGreaterThan(0);
    expect(result.sources).toBeDefined();
    expect(Array.isArray(result.sources)).toBe(true);
    expect(result.sources.length).toBeGreaterThan(0);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save web search to database', async () => {
    const result = await searchWeb(testInput);

    // Query database to verify record was saved
    const webSearches = await db.select()
      .from(webSearchTable)
      .where(eq(webSearchTable.id, result.id))
      .execute();

    expect(webSearches).toHaveLength(1);
    const savedSearch = webSearches[0];
    
    expect(savedSearch.query).toEqual('latest developments in AI technology');
    expect(savedSearch.summary).toEqual(result.summary);
    expect(Array.isArray(savedSearch.sources)).toBe(true);
    expect(savedSearch.sources).toEqual(result.sources);
    expect(savedSearch.created_at).toBeInstanceOf(Date);
  });

  it('should handle different query types', async () => {
    const queries = [
      'machine learning trends 2024',
      'climate change research',
      'cryptocurrency market analysis',
      'space exploration news'
    ];

    for (const query of queries) {
      const input: CreateWebSearchInput = { query };
      const result = await searchWeb(input);

      expect(result.query).toEqual(query);
      expect(result.summary).toContain(query);
      expect(result.sources.length).toBeGreaterThan(0);
      expect(result.sources.every(source => typeof source === 'string')).toBe(true);
      expect(result.sources.every(source => source.startsWith('http'))).toBe(true);
    }
  });

  it('should create multiple web searches independently', async () => {
    const firstInput: CreateWebSearchInput = {
      query: 'artificial intelligence ethics'
    };
    
    const secondInput: CreateWebSearchInput = {
      query: 'renewable energy solutions'
    };

    const firstResult = await searchWeb(firstInput);
    const secondResult = await searchWeb(secondInput);

    // Verify both records are different
    expect(firstResult.id).not.toEqual(secondResult.id);
    expect(firstResult.query).not.toEqual(secondResult.query);
    expect(firstResult.summary).not.toEqual(secondResult.summary);

    // Verify both are saved in database
    const allSearches = await db.select()
      .from(webSearchTable)
      .execute();

    expect(allSearches).toHaveLength(2);
    
    const savedQueries = allSearches.map(search => search.query);
    expect(savedQueries).toContain('artificial intelligence ethics');
    expect(savedQueries).toContain('renewable energy solutions');
  });

  it('should handle empty or minimal queries', async () => {
    const minimalInput: CreateWebSearchInput = {
      query: 'AI'
    };

    const result = await searchWeb(minimalInput);

    expect(result.query).toEqual('AI');
    expect(result.summary).toBeDefined();
    expect(result.summary.length).toBeGreaterThan(0);
    expect(result.sources.length).toBeGreaterThan(0);
  });

  it('should generate appropriate summaries for queries', async () => {
    const result = await searchWeb(testInput);

    // Verify summary contains query context
    expect(result.summary.toLowerCase()).toContain('search results');
    expect(result.summary).toContain(testInput.query);
    expect(result.summary.toLowerCase()).toContain('summary');
  });

  it('should store sources as valid URLs', async () => {
    const result = await searchWeb(testInput);

    expect(result.sources.length).toBeGreaterThan(0);
    
    // All sources should be strings and look like URLs
    result.sources.forEach(source => {
      expect(typeof source).toBe('string');
      expect(source.startsWith('http')).toBe(true);
      expect(source.includes('.')).toBe(true); // Should contain domain
    });
  });
});