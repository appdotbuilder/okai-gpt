import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { chatMessagesTable, chatSessionsTable } from '../db/schema';
import { type CreateChatMessageInput } from '../schema';
import { createChatMessage } from '../handlers/create_chat_message';
import { eq } from 'drizzle-orm';

describe('createChatMessage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a chat message with all required fields', async () => {
    // First create a session
    await db.insert(chatSessionsTable)
      .values({
        id: 'test-session-1',
        title: 'Test Session',
        gen_z_mode: false,
        copy_code_only_mode: false,
        target_language: null
      })
      .execute();

    const testInput: CreateChatMessageInput = {
      session_id: 'test-session-1',
      role: 'user',
      content: 'Hello, how are you?',
      content_type: 'text',
      metadata: { test: 'data' }
    };

    const result = await createChatMessage(testInput);

    // Validate the returned message
    expect(result.id).toBeDefined();
    expect(result.session_id).toEqual('test-session-1');
    expect(result.role).toEqual('user');
    expect(result.content).toEqual('Hello, how are you?');
    expect(result.content_type).toEqual('text');
    expect(result.metadata).toEqual({ test: 'data' });
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save chat message to database', async () => {
    // First create a session
    await db.insert(chatSessionsTable)
      .values({
        id: 'test-session-2',
        title: 'Test Session 2',
        gen_z_mode: false,
        copy_code_only_mode: false,
        target_language: null
      })
      .execute();

    const testInput: CreateChatMessageInput = {
      session_id: 'test-session-2',
      role: 'assistant',
      content: 'I am doing well, thank you!',
      content_type: 'text'
    };

    const result = await createChatMessage(testInput);

    // Query the database to verify the message was saved
    const messages = await db.select()
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.id, result.id))
      .execute();

    expect(messages).toHaveLength(1);
    expect(messages[0].session_id).toEqual('test-session-2');
    expect(messages[0].role).toEqual('assistant');
    expect(messages[0].content).toEqual('I am doing well, thank you!');
    expect(messages[0].content_type).toEqual('text');
    expect(messages[0].metadata).toBeNull();
    expect(messages[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle null metadata correctly', async () => {
    // First create a session
    await db.insert(chatSessionsTable)
      .values({
        id: 'test-session-3',
        title: 'Test Session 3',
        gen_z_mode: false,
        copy_code_only_mode: false,
        target_language: null
      })
      .execute();

    const testInput: CreateChatMessageInput = {
      session_id: 'test-session-3',
      role: 'user',
      content: 'Test message without metadata',
      content_type: 'text'
      // metadata is undefined
    };

    const result = await createChatMessage(testInput);

    expect(result.metadata).toBeNull();

    // Verify in database
    const messages = await db.select()
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.id, result.id))
      .execute();

    expect(messages[0].metadata).toBeNull();
  });

  it('should update session updated_at timestamp', async () => {
    // First create a session
    const originalTime = new Date('2023-01-01T00:00:00Z');
    await db.insert(chatSessionsTable)
      .values({
        id: 'test-session-4',
        title: 'Test Session 4',
        gen_z_mode: false,
        copy_code_only_mode: false,
        target_language: null,
        created_at: originalTime,
        updated_at: originalTime
      })
      .execute();

    const testInput: CreateChatMessageInput = {
      session_id: 'test-session-4',
      role: 'user',
      content: 'This should update the session timestamp',
      content_type: 'text'
    };

    await createChatMessage(testInput);

    // Check that session's updated_at was updated
    const sessions = await db.select()
      .from(chatSessionsTable)
      .where(eq(chatSessionsTable.id, 'test-session-4'))
      .execute();

    expect(sessions).toHaveLength(1);
    expect(sessions[0].updated_at).not.toEqual(originalTime);
    expect(sessions[0].updated_at > originalTime).toBe(true);
  });

  it('should handle different content types', async () => {
    // First create a session
    await db.insert(chatSessionsTable)
      .values({
        id: 'test-session-5',
        title: 'Test Session 5',
        gen_z_mode: false,
        copy_code_only_mode: false,
        target_language: null
      })
      .execute();

    const imageInput: CreateChatMessageInput = {
      session_id: 'test-session-5',
      role: 'user',
      content: 'Here is an image',
      content_type: 'image',
      metadata: { image_url: 'https://example.com/image.jpg' }
    };

    const result = await createChatMessage(imageInput);

    expect(result.content_type).toEqual('image');
    expect(result.metadata).toEqual({ image_url: 'https://example.com/image.jpg' });
  });

  it('should throw error for non-existent session', async () => {
    const testInput: CreateChatMessageInput = {
      session_id: 'non-existent-session',
      role: 'user',
      content: 'This should fail',
      content_type: 'text'
    };

    await expect(createChatMessage(testInput)).rejects.toThrow(/Chat session with id non-existent-session does not exist/i);
  });

  it('should create messages with pdf content type', async () => {
    // First create a session
    await db.insert(chatSessionsTable)
      .values({
        id: 'test-session-6',
        title: 'Test Session 6',
        gen_z_mode: false,
        copy_code_only_mode: false,
        target_language: null
      })
      .execute();

    const pdfInput: CreateChatMessageInput = {
      session_id: 'test-session-6',
      role: 'user',
      content: 'Please analyze this PDF',
      content_type: 'pdf',
      metadata: { pdf_url: 'https://example.com/document.pdf', page_count: 5 }
    };

    const result = await createChatMessage(pdfInput);

    expect(result.content_type).toEqual('pdf');
    expect(result.metadata).toEqual({ pdf_url: 'https://example.com/document.pdf', page_count: 5 });
  });
});