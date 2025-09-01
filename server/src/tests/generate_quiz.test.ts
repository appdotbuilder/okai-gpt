import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { quizTable } from '../db/schema';
import { type CreateQuizInput } from '../schema';
import { generateQuiz } from '../handlers/generate_quiz';
import { eq } from 'drizzle-orm';

// Test input data
const testInput: CreateQuizInput = {
  source_text: 'This is a sample text about artificial intelligence and machine learning. It discusses various concepts including neural networks, deep learning, and natural language processing. The text explains how AI systems can be trained on large datasets to perform complex tasks like image recognition and language translation.'
};

const shortTextInput: CreateQuizInput = {
  source_text: 'Short text.'
};

const longTextInput: CreateQuizInput = {
  source_text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(50) + 'This is a very long text that should be handled properly by the quiz generation system. It contains multiple sentences and paragraphs that could be used to generate meaningful questions and answers for educational purposes.'
};

describe('generateQuiz', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should generate a quiz from source text', async () => {
    const result = await generateQuiz(testInput);

    // Validate basic properties
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.source_text).toEqual(testInput.source_text);
    expect(result.created_at).toBeInstanceOf(Date);

    // Validate quiz data structure
    expect(result.quiz_data).toBeDefined();
    expect(result.quiz_data['quiz']).toBeArray();
    expect(result.quiz_data['quiz'].length).toBeGreaterThan(0);

    // Validate quiz question structure
    const firstQuestion = result.quiz_data['quiz'][0] as any;
    expect(firstQuestion.question).toBeDefined();
    expect(typeof firstQuestion.question).toBe('string');
    expect(firstQuestion.options).toBeArray();
    expect(firstQuestion.options.length).toBe(4);
    expect(firstQuestion.answer).toBeDefined();
    expect(firstQuestion.options).toContain(firstQuestion.answer);
  });

  it('should save quiz to database', async () => {
    const result = await generateQuiz(testInput);

    // Query database to verify quiz was saved
    const savedQuiz = await db.select()
      .from(quizTable)
      .where(eq(quizTable.id, result.id))
      .execute();

    expect(savedQuiz).toHaveLength(1);
    expect(savedQuiz[0].source_text).toEqual(testInput.source_text);
    expect(savedQuiz[0].quiz_data).toEqual(result.quiz_data);
    expect(savedQuiz[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle short text input', async () => {
    const result = await generateQuiz(shortTextInput);

    expect(result.source_text).toEqual('Short text.');
    expect(result.quiz_data['quiz']).toBeArray();
    expect(result.quiz_data['quiz'].length).toBeGreaterThan(0);

    // Verify each question has proper structure
    (result.quiz_data['quiz'] as any[]).forEach((question: any) => {
      expect(question.question).toBeDefined();
      expect(question.options).toBeArray();
      expect(question.options.length).toBe(4);
      expect(question.answer).toBeDefined();
      expect(question.options).toContain(question.answer);
    });
  });

  it('should handle long text input', async () => {
    const result = await generateQuiz(longTextInput);

    expect(result.source_text).toEqual(longTextInput.source_text);
    expect(result.quiz_data['quiz']).toBeArray();
    expect(result.quiz_data['quiz'].length).toBeGreaterThan(0);

    // Check that questions are generated properly for long text
    const firstQuestion = result.quiz_data['quiz'][0] as any;
    expect(firstQuestion.question).toContain('...');  // Should truncate long text in question
    expect(firstQuestion.options.length).toBe(4);
  });

  it('should generate multiple questions per quiz', async () => {
    const result = await generateQuiz(testInput);

    expect(result.quiz_data['quiz'].length).toBeGreaterThan(1);

    // Verify all questions have different content
    const questions = (result.quiz_data['quiz'] as any[]).map((q: any) => q.question);
    const uniqueQuestions = new Set(questions);
    expect(uniqueQuestions.size).toBe(questions.length);
  });

  it('should generate quiz with valid question format', async () => {
    const result = await generateQuiz(testInput);

    (result.quiz_data['quiz'] as any[]).forEach((question: any, index: number) => {
      expect(question.question).toBeDefined();
      expect(typeof question.question).toBe('string');
      expect(question.question.length).toBeGreaterThan(0);
      
      // Validate options
      expect(question.options).toBeArray();
      expect(question.options.length).toBe(4);
      question.options.forEach((option: any) => {
        expect(typeof option).toBe('string');
        expect(option.length).toBeGreaterThan(0);
      });

      // Validate answer
      expect(typeof question.answer).toBe('string');
      expect(question.options).toContain(question.answer);
    });
  });

  it('should preserve source text exactly as provided', async () => {
    const textWithSpecialChars = "Text with special chars: @#$%^&*()[]{}|;':\",./<>?`~";
    const specialInput: CreateQuizInput = {
      source_text: textWithSpecialChars
    };

    const result = await generateQuiz(specialInput);

    expect(result.source_text).toEqual(textWithSpecialChars);

    // Verify it was saved correctly to database
    const savedQuiz = await db.select()
      .from(quizTable)
      .where(eq(quizTable.id, result.id))
      .execute();

    expect(savedQuiz[0].source_text).toEqual(textWithSpecialChars);
  });

  it('should handle empty quiz data structure correctly', async () => {
    const result = await generateQuiz(testInput);

    // Verify the quiz_data structure matches expected format
    expect(result.quiz_data['quiz']).toBeArray();
    const quizArray = result.quiz_data['quiz'] as any[];
    expect(quizArray.length).toBeGreaterThan(0);
    
    quizArray.forEach((question: any) => {
      expect(question).toMatchObject({
        question: expect.any(String),
        options: expect.arrayContaining([
          expect.any(String),
          expect.any(String), 
          expect.any(String),
          expect.any(String)
        ]),
        answer: expect.any(String)
      });
    });
  });
});