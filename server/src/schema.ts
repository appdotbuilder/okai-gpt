import { z } from 'zod';

// Chat message schema
export const chatMessageSchema = z.object({
  id: z.number(),
  session_id: z.string(),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  content_type: z.enum(['text', 'image', 'pdf']),
  metadata: z.record(z.any()).nullable(), // JSON field for storing additional data
  created_at: z.coerce.date()
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

// Chat session schema
export const chatSessionSchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
  gen_z_mode: z.boolean(),
  copy_code_only_mode: z.boolean(),
  target_language: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type ChatSession = z.infer<typeof chatSessionSchema>;

// Document analysis schema
export const documentAnalysisSchema = z.object({
  id: z.number(),
  image_url: z.string(),
  prompt: z.string(),
  analysis_result: z.string(),
  created_at: z.coerce.date()
});

export type DocumentAnalysis = z.infer<typeof documentAnalysisSchema>;

// Generated image schema
export const generatedImageSchema = z.object({
  id: z.number(),
  prompt: z.string(),
  image_url: z.string(),
  created_at: z.coerce.date()
});

export type GeneratedImage = z.infer<typeof generatedImageSchema>;

// Generated video schema
export const generatedVideoSchema = z.object({
  id: z.number(),
  prompt: z.string(),
  initial_image_url: z.string().nullable(),
  video_url: z.string().nullable(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  progress_message: z.string().nullable(),
  created_at: z.coerce.date(),
  completed_at: z.coerce.date().nullable()
});

export type GeneratedVideo = z.infer<typeof generatedVideoSchema>;

// Quiz schema
export const quizSchema = z.object({
  id: z.number(),
  source_text: z.string(),
  quiz_data: z.record(z.any()), // JSON field storing quiz questions and answers
  created_at: z.coerce.date()
});

export type Quiz = z.infer<typeof quizSchema>;

// Web search schema
export const webSearchSchema = z.object({
  id: z.number(),
  query: z.string(),
  summary: z.string(),
  sources: z.array(z.string()), // Array of URLs
  created_at: z.coerce.date()
});

export type WebSearch = z.infer<typeof webSearchSchema>;

// Input schemas for creating entities

export const createChatMessageInputSchema = z.object({
  session_id: z.string(),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  content_type: z.enum(['text', 'image', 'pdf']),
  metadata: z.record(z.any()).nullable().optional()
});

export type CreateChatMessageInput = z.infer<typeof createChatMessageInputSchema>;

export const createChatSessionInputSchema = z.object({
  id: z.string().optional(), // Optional, will be generated if not provided
  title: z.string().nullable().optional(),
  gen_z_mode: z.boolean().optional(),
  copy_code_only_mode: z.boolean().optional(),
  target_language: z.string().nullable().optional()
});

export type CreateChatSessionInput = z.infer<typeof createChatSessionInputSchema>;

export const createDocumentAnalysisInputSchema = z.object({
  image_url: z.string(),
  prompt: z.string()
});

export type CreateDocumentAnalysisInput = z.infer<typeof createDocumentAnalysisInputSchema>;

export const createGeneratedImageInputSchema = z.object({
  prompt: z.string()
});

export type CreateGeneratedImageInput = z.infer<typeof createGeneratedImageInputSchema>;

export const createGeneratedVideoInputSchema = z.object({
  prompt: z.string(),
  initial_image_url: z.string().nullable().optional()
});

export type CreateGeneratedVideoInput = z.infer<typeof createGeneratedVideoInputSchema>;

export const createQuizInputSchema = z.object({
  source_text: z.string()
});

export type CreateQuizInput = z.infer<typeof createQuizInputSchema>;

export const createWebSearchInputSchema = z.object({
  query: z.string()
});

export type CreateWebSearchInput = z.infer<typeof createWebSearchInputSchema>;

// Update schemas

export const updateChatSessionInputSchema = z.object({
  id: z.string(),
  title: z.string().nullable().optional(),
  gen_z_mode: z.boolean().optional(),
  copy_code_only_mode: z.boolean().optional(),
  target_language: z.string().nullable().optional()
});

export type UpdateChatSessionInput = z.infer<typeof updateChatSessionInputSchema>;

export const updateGeneratedVideoInputSchema = z.object({
  id: z.number(),
  video_url: z.string().nullable().optional(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
  progress_message: z.string().nullable().optional(),
  completed_at: z.coerce.date().nullable().optional()
});

export type UpdateGeneratedVideoInput = z.infer<typeof updateGeneratedVideoInputSchema>;

// Query schemas

export const getChatMessagesInputSchema = z.object({
  session_id: z.string(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional()
});

export type GetChatMessagesInput = z.infer<typeof getChatMessagesInputSchema>;

export const getVideoStatusInputSchema = z.object({
  id: z.number()
});

export type GetVideoStatusInput = z.infer<typeof getVideoStatusInputSchema>;

export const sendAiMessageInputSchema = z.object({
  sessionId: z.string(),
  messageContent: z.string(),
  genZMode: z.boolean().optional(),
  copyCodeOnlyMode: z.boolean().optional(),
  targetLanguage: z.string().nullable().optional(),
  imageFileBase64: z.string().nullable().optional(),
  pdfFileContent: z.string().nullable().optional()
});

export type SendAiMessageInput = z.infer<typeof sendAiMessageInputSchema>;