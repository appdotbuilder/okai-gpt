import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import {
  createChatSessionInputSchema,
  updateChatSessionInputSchema,
  createChatMessageInputSchema,
  getChatMessagesInputSchema,
  createDocumentAnalysisInputSchema,
  createGeneratedImageInputSchema,
  createGeneratedVideoInputSchema,
  getVideoStatusInputSchema,
  updateGeneratedVideoInputSchema,
  createQuizInputSchema,
  createWebSearchInputSchema
} from './schema';

// Import handlers
import { createChatSession } from './handlers/create_chat_session';
import { getChatSessions } from './handlers/get_chat_sessions';
import { updateChatSession } from './handlers/update_chat_session';
import { createChatMessage } from './handlers/create_chat_message';
import { getChatMessages } from './handlers/get_chat_messages';
import { deleteChatSession } from './handlers/delete_chat_session';
import { clearChatHistory } from './handlers/clear_chat_history';
import { analyzeDocument } from './handlers/analyze_document';
import { generateImage } from './handlers/generate_image';
import { generateVideo } from './handlers/generate_video';
import { getVideoStatus } from './handlers/get_video_status';
import { updateVideoStatus } from './handlers/update_video_status';
import { generateQuiz } from './handlers/generate_quiz';
import { searchWeb } from './handlers/search_web';
import { getRecentActivities } from './handlers/get_recent_activities';
import { z } from 'zod';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Chat session management
  createChatSession: publicProcedure
    .input(createChatSessionInputSchema)
    .mutation(({ input }) => createChatSession(input)),

  getChatSessions: publicProcedure
    .query(() => getChatSessions()),

  updateChatSession: publicProcedure
    .input(updateChatSessionInputSchema)
    .mutation(({ input }) => updateChatSession(input)),

  deleteChatSession: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(({ input }) => deleteChatSession(input.sessionId)),

  clearChatHistory: publicProcedure
    .mutation(() => clearChatHistory()),

  // Chat message management
  createChatMessage: publicProcedure
    .input(createChatMessageInputSchema)
    .mutation(({ input }) => createChatMessage(input)),

  getChatMessages: publicProcedure
    .input(getChatMessagesInputSchema)
    .query(({ input }) => getChatMessages(input)),

  // Document Scanner
  analyzeDocument: publicProcedure
    .input(createDocumentAnalysisInputSchema)
    .mutation(({ input }) => analyzeDocument(input)),

  // Image Generator
  generateImage: publicProcedure
    .input(createGeneratedImageInputSchema)
    .mutation(({ input }) => generateImage(input)),

  // Video Generator
  generateVideo: publicProcedure
    .input(createGeneratedVideoInputSchema)
    .mutation(({ input }) => generateVideo(input)),

  getVideoStatus: publicProcedure
    .input(getVideoStatusInputSchema)
    .query(({ input }) => getVideoStatus(input)),

  updateVideoStatus: publicProcedure
    .input(updateGeneratedVideoInputSchema)
    .mutation(({ input }) => updateVideoStatus(input)),

  // Quiz Generator
  generateQuiz: publicProcedure
    .input(createQuizInputSchema)
    .mutation(({ input }) => generateQuiz(input)),

  // Web Explorer
  searchWeb: publicProcedure
    .input(createWebSearchInputSchema)
    .mutation(({ input }) => searchWeb(input)),

  // General activities
  getRecentActivities: publicProcedure
    .input(z.object({ limit: z.number().int().positive().optional() }))
    .query(({ input }) => getRecentActivities(input.limit)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`OKAIgpt TRPC server listening at port: ${port}`);
}

start();