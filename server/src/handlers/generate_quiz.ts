import { db } from '../db';
import { quizTable } from '../db/schema';
import { type CreateQuizInput, type Quiz } from '../schema';

export const generateQuiz = async (input: CreateQuizInput): Promise<Quiz> => {
  try {
    // Generate sample quiz data based on source text
    // In a real implementation, this would use an AI service to generate meaningful questions
    const quizData = {
      quiz: [
        {
          question: `What is the main topic discussed in this text: "${input.source_text.substring(0, 100)}..."?`,
          options: ["Topic A", "Topic B", "Topic C", "Topic D"],
          answer: "Topic A"
        },
        {
          question: "Based on the provided text, which statement is most accurate?",
          options: [
            "Statement 1",
            "Statement 2", 
            "Statement 3",
            "Statement 4"
          ],
          answer: "Statement 1"
        },
        {
          question: "What can be inferred from the source material?",
          options: [
            "Inference A",
            "Inference B",
            "Inference C", 
            "Inference D"
          ],
          answer: "Inference C"
        }
      ]
    };

    // Insert quiz record into database
    const result = await db.insert(quizTable)
      .values({
        source_text: input.source_text,
        quiz_data: quizData
      })
      .returning()
      .execute();

    const quiz = result[0];
    return {
      ...quiz,
      quiz_data: quiz.quiz_data as Record<string, any>
    };
  } catch (error) {
    console.error('Quiz generation failed:', error);
    throw error;
  }
};