import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { documentAnalysisTable } from '../db/schema';
import { type CreateDocumentAnalysisInput } from '../schema';
import { analyzeDocument } from '../handlers/analyze_document';
import { eq } from 'drizzle-orm';

// Test input data
const testInput: CreateDocumentAnalysisInput = {
  image_url: 'https://example.com/test-document.jpg',
  prompt: 'Extract text from this document'
};

const testInputSummarize: CreateDocumentAnalysisInput = {
  image_url: 'https://example.com/report.pdf',
  prompt: 'Summarize the key points in this report'
};

const testInputAnalyze: CreateDocumentAnalysisInput = {
  image_url: 'https://example.com/chart.png',
  prompt: 'Analyze the data trends shown in this chart'
};

describe('analyzeDocument', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should analyze a document and return result', async () => {
    const result = await analyzeDocument(testInput);

    // Basic field validation
    expect(result.image_url).toEqual('https://example.com/test-document.jpg');
    expect(result.prompt).toEqual('Extract text from this document');
    expect(result.analysis_result).toContain('Text extracted from document');
    expect(result.analysis_result).toContain(testInput.image_url);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save document analysis to database', async () => {
    const result = await analyzeDocument(testInput);

    // Query database to verify record was saved
    const analyses = await db.select()
      .from(documentAnalysisTable)
      .where(eq(documentAnalysisTable.id, result.id))
      .execute();

    expect(analyses).toHaveLength(1);
    expect(analyses[0].image_url).toEqual('https://example.com/test-document.jpg');
    expect(analyses[0].prompt).toEqual('Extract text from this document');
    expect(analyses[0].analysis_result).toContain('Text extracted from document');
    expect(analyses[0].created_at).toBeInstanceOf(Date);
  });

  it('should generate different analysis based on prompt type - summarize', async () => {
    const result = await analyzeDocument(testInputSummarize);

    expect(result.image_url).toEqual('https://example.com/report.pdf');
    expect(result.prompt).toEqual('Summarize the key points in this report');
    expect(result.analysis_result).toContain('Document Summary');
    expect(result.analysis_result).toContain('summarized');
  });

  it('should generate different analysis based on prompt type - analyze', async () => {
    const result = await analyzeDocument(testInputAnalyze);

    expect(result.image_url).toEqual('https://example.com/chart.png');
    expect(result.prompt).toEqual('Analyze the data trends shown in this chart');
    expect(result.analysis_result).toContain('Document Analysis');
    expect(result.analysis_result).toContain(testInputAnalyze.prompt);
  });

  it('should handle generic prompts with default template', async () => {
    const genericInput: CreateDocumentAnalysisInput = {
      image_url: 'https://example.com/document.jpg',
      prompt: 'What is in this image?'
    };

    const result = await analyzeDocument(genericInput);

    expect(result.analysis_result).toContain('Document processed successfully');
    expect(result.analysis_result).toContain('multimodal AI capabilities');
    expect(result.analysis_result).toContain(genericInput.prompt);
    expect(result.analysis_result).toContain(genericInput.image_url);
  });

  it('should create multiple analyses independently', async () => {
    const result1 = await analyzeDocument(testInput);
    const result2 = await analyzeDocument(testInputSummarize);

    // Verify both records exist and are different
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.prompt).not.toEqual(result2.prompt);
    expect(result1.analysis_result).not.toEqual(result2.analysis_result);

    // Verify both are in database
    const allAnalyses = await db.select()
      .from(documentAnalysisTable)
      .execute();

    expect(allAnalyses).toHaveLength(2);
    
    const ids = allAnalyses.map(a => a.id);
    expect(ids).toContain(result1.id);
    expect(ids).toContain(result2.id);
  });

  it('should handle long prompts and URLs correctly', async () => {
    const longPromptInput: CreateDocumentAnalysisInput = {
      image_url: 'https://very-long-domain-name.example.com/path/to/very/long/file/name/with/many/segments/document.pdf',
      prompt: 'This is a very detailed prompt that asks for comprehensive analysis of the document including extraction of all text content, identification of key themes, summarization of main points, and analysis of any data or charts present in the document'
    };

    const result = await analyzeDocument(longPromptInput);

    expect(result.image_url).toEqual(longPromptInput.image_url);
    expect(result.prompt).toEqual(longPromptInput.prompt);
    expect(result.analysis_result).toBeDefined();
    expect(result.analysis_result.length).toBeGreaterThan(0);
  });

  it('should handle special characters in prompts', async () => {
    const specialCharInput: CreateDocumentAnalysisInput = {
      image_url: 'https://example.com/doc-with-special-chars.jpg',
      prompt: 'Extract text & analyze données with émojis 🔍 and symbols: @#$%'
    };

    const result = await analyzeDocument(specialCharInput);

    expect(result.prompt).toEqual(specialCharInput.prompt);
    expect(result.analysis_result).toContain('Text extracted from document');
  });
});