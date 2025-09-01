import { 
  serial, 
  text, 
  pgTable, 
  timestamp, 
  boolean, 
  json,
  pgEnum
} from 'drizzle-orm/pg-core';

// Enums
export const messageRoleEnum = pgEnum('message_role', ['user', 'assistant']);
export const contentTypeEnum = pgEnum('content_type', ['text', 'image', 'pdf']);
export const videoStatusEnum = pgEnum('video_status', ['pending', 'processing', 'completed', 'failed']);

// Chat sessions table
export const chatSessionsTable = pgTable('chat_sessions', {
  id: text('id').primaryKey(),
  title: text('title'), // Nullable by default
  gen_z_mode: boolean('gen_z_mode').notNull().default(false),
  copy_code_only_mode: boolean('copy_code_only_mode').notNull().default(false),
  target_language: text('target_language'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Chat messages table
export const chatMessagesTable = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  session_id: text('session_id').notNull().references(() => chatSessionsTable.id, { onDelete: 'cascade' }),
  role: messageRoleEnum('role').notNull(),
  content: text('content').notNull(),
  content_type: contentTypeEnum('content_type').notNull().default('text'),
  metadata: json('metadata'), // Nullable by default, stores additional data
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Document analysis table
export const documentAnalysisTable = pgTable('document_analysis', {
  id: serial('id').primaryKey(),
  image_url: text('image_url').notNull(),
  prompt: text('prompt').notNull(),
  analysis_result: text('analysis_result').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Generated images table
export const generatedImagesTable = pgTable('generated_images', {
  id: serial('id').primaryKey(),
  prompt: text('prompt').notNull(),
  image_url: text('image_url').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Generated videos table
export const generatedVideosTable = pgTable('generated_videos', {
  id: serial('id').primaryKey(),
  prompt: text('prompt').notNull(),
  initial_image_url: text('initial_image_url'), // Nullable by default
  video_url: text('video_url'), // Nullable by default
  status: videoStatusEnum('status').notNull().default('pending'),
  progress_message: text('progress_message'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
  completed_at: timestamp('completed_at'), // Nullable by default
});

// Quiz table
export const quizTable = pgTable('quiz', {
  id: serial('id').primaryKey(),
  source_text: text('source_text').notNull(),
  quiz_data: json('quiz_data').notNull(), // Stores quiz questions and answers
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Web search table
export const webSearchTable = pgTable('web_search', {
  id: serial('id').primaryKey(),
  query: text('query').notNull(),
  summary: text('summary').notNull(),
  sources: json('sources').notNull(), // Array of URLs stored as JSON
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schemas
export type ChatSession = typeof chatSessionsTable.$inferSelect;
export type NewChatSession = typeof chatSessionsTable.$inferInsert;

export type ChatMessage = typeof chatMessagesTable.$inferSelect;
export type NewChatMessage = typeof chatMessagesTable.$inferInsert;

export type DocumentAnalysis = typeof documentAnalysisTable.$inferSelect;
export type NewDocumentAnalysis = typeof documentAnalysisTable.$inferInsert;

export type GeneratedImage = typeof generatedImagesTable.$inferSelect;
export type NewGeneratedImage = typeof generatedImagesTable.$inferInsert;

export type GeneratedVideo = typeof generatedVideosTable.$inferSelect;
export type NewGeneratedVideo = typeof generatedVideosTable.$inferInsert;

export type Quiz = typeof quizTable.$inferSelect;
export type NewQuiz = typeof quizTable.$inferInsert;

export type WebSearch = typeof webSearchTable.$inferSelect;
export type NewWebSearch = typeof webSearchTable.$inferInsert;

// Export all tables for relation queries
export const tables = {
  chatSessions: chatSessionsTable,
  chatMessages: chatMessagesTable,
  documentAnalysis: documentAnalysisTable,
  generatedImages: generatedImagesTable,
  generatedVideos: generatedVideosTable,
  quiz: quizTable,
  webSearch: webSearchTable,
};