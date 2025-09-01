import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { chatSessionsTable, chatMessagesTable } from '../db/schema';
import { deleteChatSession } from '../handlers/delete_chat_session';
import { eq } from 'drizzle-orm';

describe('deleteChatSession', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing chat session', async () => {
    // Create a test chat session
    const sessionData = {
      id: 'test-session-123',
      title: 'Test Session',
      gen_z_mode: false,
      copy_code_only_mode: false,
      target_language: 'en'
    };

    await db.insert(chatSessionsTable)
      .values(sessionData)
      .execute();

    // Verify session exists before deletion
    const sessionsBefore = await db.select()
      .from(chatSessionsTable)
      .where(eq(chatSessionsTable.id, 'test-session-123'))
      .execute();

    expect(sessionsBefore).toHaveLength(1);

    // Delete the session
    await deleteChatSession('test-session-123');

    // Verify session is deleted
    const sessionsAfter = await db.select()
      .from(chatSessionsTable)
      .where(eq(chatSessionsTable.id, 'test-session-123'))
      .execute();

    expect(sessionsAfter).toHaveLength(0);
  });

  it('should delete chat session and cascade delete associated messages', async () => {
    // Create a test chat session
    const sessionData = {
      id: 'test-session-cascade',
      title: 'Test Session with Messages',
      gen_z_mode: true,
      copy_code_only_mode: false,
      target_language: null
    };

    await db.insert(chatSessionsTable)
      .values(sessionData)
      .execute();

    // Create associated chat messages
    const messageData = [
      {
        session_id: 'test-session-cascade',
        role: 'user' as const,
        content: 'Hello, how are you?',
        content_type: 'text' as const,
        metadata: { source: 'test' }
      },
      {
        session_id: 'test-session-cascade',
        role: 'assistant' as const,
        content: 'I am doing well, thank you!',
        content_type: 'text' as const,
        metadata: null
      }
    ];

    await db.insert(chatMessagesTable)
      .values(messageData)
      .execute();

    // Verify messages exist before deletion
    const messagesBefore = await db.select()
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.session_id, 'test-session-cascade'))
      .execute();

    expect(messagesBefore).toHaveLength(2);

    // Delete the session
    await deleteChatSession('test-session-cascade');

    // Verify session is deleted
    const sessionsAfter = await db.select()
      .from(chatSessionsTable)
      .where(eq(chatSessionsTable.id, 'test-session-cascade'))
      .execute();

    expect(sessionsAfter).toHaveLength(0);

    // Verify associated messages are also deleted (cascade delete)
    const messagesAfter = await db.select()
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.session_id, 'test-session-cascade'))
      .execute();

    expect(messagesAfter).toHaveLength(0);
  });

  it('should handle deletion of non-existent session gracefully', async () => {
    // Attempt to delete a session that doesn't exist
    await expect(deleteChatSession('non-existent-session')).resolves.toBeUndefined();

    // Verify no sessions exist
    const sessions = await db.select()
      .from(chatSessionsTable)
      .execute();

    expect(sessions).toHaveLength(0);
  });

  it('should delete only the specified session and leave others intact', async () => {
    // Create multiple test sessions
    const sessionData = [
      {
        id: 'session-1',
        title: 'Session 1',
        gen_z_mode: false,
        copy_code_only_mode: false,
        target_language: 'en'
      },
      {
        id: 'session-2',
        title: 'Session 2',
        gen_z_mode: true,
        copy_code_only_mode: true,
        target_language: 'es'
      }
    ];

    await db.insert(chatSessionsTable)
      .values(sessionData)
      .execute();

    // Create messages for both sessions
    const messageData = [
      {
        session_id: 'session-1',
        role: 'user' as const,
        content: 'Message in session 1',
        content_type: 'text' as const,
        metadata: null
      },
      {
        session_id: 'session-2',
        role: 'user' as const,
        content: 'Message in session 2',
        content_type: 'text' as const,
        metadata: null
      }
    ];

    await db.insert(chatMessagesTable)
      .values(messageData)
      .execute();

    // Delete only session-1
    await deleteChatSession('session-1');

    // Verify session-1 is deleted but session-2 remains
    const remainingSessions = await db.select()
      .from(chatSessionsTable)
      .execute();

    expect(remainingSessions).toHaveLength(1);
    expect(remainingSessions[0].id).toEqual('session-2');

    // Verify only messages from session-1 are deleted
    const remainingMessages = await db.select()
      .from(chatMessagesTable)
      .execute();

    expect(remainingMessages).toHaveLength(1);
    expect(remainingMessages[0].session_id).toEqual('session-2');
  });
});