import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { chatSessionsTable, chatMessagesTable } from '../db/schema';
import { clearChatHistory } from '../handlers/clear_chat_history';

describe('clearChatHistory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should clear all chat sessions and messages', async () => {
    // Create test data
    const session1 = await db.insert(chatSessionsTable)
      .values({
        id: 'session-1',
        title: 'Test Session 1',
        gen_z_mode: false,
        copy_code_only_mode: false,
        target_language: null
      })
      .returning()
      .execute();

    const session2 = await db.insert(chatSessionsTable)
      .values({
        id: 'session-2',
        title: 'Test Session 2',
        gen_z_mode: true,
        copy_code_only_mode: true,
        target_language: 'Spanish'
      })
      .returning()
      .execute();

    // Create messages for both sessions
    await db.insert(chatMessagesTable)
      .values([
        {
          session_id: 'session-1',
          role: 'user',
          content: 'Hello from session 1',
          content_type: 'text',
          metadata: null
        },
        {
          session_id: 'session-1',
          role: 'assistant',
          content: 'Response from session 1',
          content_type: 'text',
          metadata: { confidence: 0.95 }
        },
        {
          session_id: 'session-2',
          role: 'user',
          content: 'Hello from session 2',
          content_type: 'image',
          metadata: { image_type: 'png' }
        }
      ])
      .execute();

    // Verify data exists before clearing
    const sessionsBefore = await db.select().from(chatSessionsTable).execute();
    const messagesBefore = await db.select().from(chatMessagesTable).execute();
    
    expect(sessionsBefore).toHaveLength(2);
    expect(messagesBefore).toHaveLength(3);

    // Clear chat history
    await clearChatHistory();

    // Verify all data is cleared
    const sessionsAfter = await db.select().from(chatSessionsTable).execute();
    const messagesAfter = await db.select().from(chatMessagesTable).execute();
    
    expect(sessionsAfter).toHaveLength(0);
    expect(messagesAfter).toHaveLength(0);
  });

  it('should handle empty database gracefully', async () => {
    // Verify database is empty
    const sessionsBefore = await db.select().from(chatSessionsTable).execute();
    const messagesBefore = await db.select().from(chatMessagesTable).execute();
    
    expect(sessionsBefore).toHaveLength(0);
    expect(messagesBefore).toHaveLength(0);

    // Clear should not throw error
    await expect(clearChatHistory()).resolves.toBeUndefined();

    // Verify database remains empty
    const sessionsAfter = await db.select().from(chatSessionsTable).execute();
    const messagesAfter = await db.select().from(chatMessagesTable).execute();
    
    expect(sessionsAfter).toHaveLength(0);
    expect(messagesAfter).toHaveLength(0);
  });

  it('should clear only sessions with messages', async () => {
    // Create a session with messages
    await db.insert(chatSessionsTable)
      .values({
        id: 'session-with-messages',
        title: 'Session with Messages',
        gen_z_mode: false,
        copy_code_only_mode: false,
        target_language: null
      })
      .execute();

    // Create a session without messages
    await db.insert(chatSessionsTable)
      .values({
        id: 'session-without-messages',
        title: 'Session without Messages',
        gen_z_mode: true,
        copy_code_only_mode: false,
        target_language: 'French'
      })
      .execute();

    // Add messages only to the first session
    await db.insert(chatMessagesTable)
      .values([
        {
          session_id: 'session-with-messages',
          role: 'user',
          content: 'Test message 1',
          content_type: 'text',
          metadata: null
        },
        {
          session_id: 'session-with-messages',
          role: 'assistant',
          content: 'Test response 1',
          content_type: 'text',
          metadata: null
        }
      ])
      .execute();

    // Verify initial state
    const sessionsBefore = await db.select().from(chatSessionsTable).execute();
    const messagesBefore = await db.select().from(chatMessagesTable).execute();
    
    expect(sessionsBefore).toHaveLength(2);
    expect(messagesBefore).toHaveLength(2);

    // Clear all chat history
    await clearChatHistory();

    // Verify everything is cleared (both sessions and messages)
    const sessionsAfter = await db.select().from(chatSessionsTable).execute();
    const messagesAfter = await db.select().from(chatMessagesTable).execute();
    
    expect(sessionsAfter).toHaveLength(0);
    expect(messagesAfter).toHaveLength(0);
  });

  it('should handle different content types and metadata', async () => {
    // Create session
    await db.insert(chatSessionsTable)
      .values({
        id: 'diverse-session',
        title: 'Diverse Content Session',
        gen_z_mode: false,
        copy_code_only_mode: true,
        target_language: 'German'
      })
      .execute();

    // Create messages with different content types and metadata
    await db.insert(chatMessagesTable)
      .values([
        {
          session_id: 'diverse-session',
          role: 'user',
          content: 'Text message',
          content_type: 'text',
          metadata: null
        },
        {
          session_id: 'diverse-session',
          role: 'user',
          content: 'Image analysis request',
          content_type: 'image',
          metadata: { filename: 'test.jpg', size: 1024 }
        },
        {
          session_id: 'diverse-session',
          role: 'assistant',
          content: 'PDF analysis result',
          content_type: 'pdf',
          metadata: { pages: 5, confidence: 0.98 }
        }
      ])
      .execute();

    // Verify data exists
    const sessionsBefore = await db.select().from(chatSessionsTable).execute();
    const messagesBefore = await db.select().from(chatMessagesTable).execute();
    
    expect(sessionsBefore).toHaveLength(1);
    expect(messagesBefore).toHaveLength(3);
    
    // Verify metadata is properly stored
    expect(messagesBefore[1].metadata).toEqual({ filename: 'test.jpg', size: 1024 });
    expect(messagesBefore[2].metadata).toEqual({ pages: 5, confidence: 0.98 });

    // Clear chat history
    await clearChatHistory();

    // Verify all data is cleared regardless of content type or metadata
    const sessionsAfter = await db.select().from(chatSessionsTable).execute();
    const messagesAfter = await db.select().from(chatMessagesTable).execute();
    
    expect(sessionsAfter).toHaveLength(0);
    expect(messagesAfter).toHaveLength(0);
  });
});