import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { chatSessionsTable, chatMessagesTable } from '../db/schema';
import { type GetChatMessagesInput } from '../schema';
import { getChatMessages } from '../handlers/get_chat_messages';

describe('getChatMessages', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test session
  const createTestSession = async (id: string = 'test-session-1') => {
    await db.insert(chatSessionsTable)
      .values({
        id,
        title: 'Test Session',
        gen_z_mode: false,
        copy_code_only_mode: false,
        target_language: null
      })
      .execute();
  };

  // Helper function to create test messages
  const createTestMessages = async (sessionId: string = 'test-session-1', count: number = 3) => {
    const messages = [];
    for (let i = 0; i < count; i++) {
      const message = {
        session_id: sessionId,
        role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
        content: `Test message ${i + 1}`,
        content_type: 'text' as 'text' | 'image' | 'pdf',
        metadata: i === 1 ? { key: 'value' } : null
      };
      messages.push(message);
    }

    await db.insert(chatMessagesTable)
      .values(messages)
      .execute();

    return messages;
  };

  it('should fetch messages for a specific session', async () => {
    // Create test session and messages
    await createTestSession();
    await createTestMessages();

    const input: GetChatMessagesInput = {
      session_id: 'test-session-1'
    };

    const result = await getChatMessages(input);

    // Should return all 3 messages
    expect(result).toHaveLength(3);
    
    // Verify message structure and content
    expect(result[0].session_id).toBe('test-session-1');
    expect(result[0].role).toBe('user');
    expect(result[0].content).toBe('Test message 1');
    expect(result[0].content_type).toBe('text');
    expect(result[0].metadata).toBeNull();
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Check second message with metadata
    expect(result[1].role).toBe('assistant');
    expect(result[1].content).toBe('Test message 2');
    expect(result[1].metadata).toEqual({ key: 'value' });

    // Check third message
    expect(result[2].role).toBe('user');
    expect(result[2].content).toBe('Test message 3');
  });

  it('should return empty array for non-existent session', async () => {
    const input: GetChatMessagesInput = {
      session_id: 'non-existent-session'
    };

    const result = await getChatMessages(input);

    expect(result).toHaveLength(0);
  });

  it('should return messages ordered by created_at ascending', async () => {
    // Create test session
    await createTestSession();

    // Insert messages with small delays to ensure different timestamps
    await db.insert(chatMessagesTable)
      .values({
        session_id: 'test-session-1',
        role: 'user' as 'user' | 'assistant',
        content: 'First message',
        content_type: 'text' as 'text' | 'image' | 'pdf',
        metadata: null
      })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(chatMessagesTable)
      .values({
        session_id: 'test-session-1',
        role: 'assistant' as 'user' | 'assistant',
        content: 'Second message',
        content_type: 'text' as 'text' | 'image' | 'pdf',
        metadata: null
      })
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(chatMessagesTable)
      .values({
        session_id: 'test-session-1',
        role: 'user' as 'user' | 'assistant',
        content: 'Third message',
        content_type: 'text' as 'text' | 'image' | 'pdf',
        metadata: null
      })
      .execute();

    const input: GetChatMessagesInput = {
      session_id: 'test-session-1'
    };

    const result = await getChatMessages(input);

    expect(result).toHaveLength(3);
    expect(result[0].content).toBe('First message');
    expect(result[1].content).toBe('Second message');
    expect(result[2].content).toBe('Third message');

    // Verify ascending order by timestamp
    expect(result[0].created_at.getTime()).toBeLessThanOrEqual(result[1].created_at.getTime());
    expect(result[1].created_at.getTime()).toBeLessThanOrEqual(result[2].created_at.getTime());
  });

  it('should apply limit when provided', async () => {
    // Create test session and 5 messages
    await createTestSession();
    await createTestMessages('test-session-1', 5);

    const input: GetChatMessagesInput = {
      session_id: 'test-session-1',
      limit: 3
    };

    const result = await getChatMessages(input);

    expect(result).toHaveLength(3);
    expect(result[0].content).toBe('Test message 1');
    expect(result[1].content).toBe('Test message 2');
    expect(result[2].content).toBe('Test message 3');
  });

  it('should apply offset when provided', async () => {
    // Create test session and 5 messages
    await createTestSession();
    await createTestMessages('test-session-1', 5);

    const input: GetChatMessagesInput = {
      session_id: 'test-session-1',
      offset: 2
    };

    const result = await getChatMessages(input);

    expect(result).toHaveLength(3); // 5 total - 2 offset = 3 remaining
    expect(result[0].content).toBe('Test message 3');
    expect(result[1].content).toBe('Test message 4');
    expect(result[2].content).toBe('Test message 5');
  });

  it('should apply both limit and offset when provided', async () => {
    // Create test session and 10 messages
    await createTestSession();
    await createTestMessages('test-session-1', 10);

    const input: GetChatMessagesInput = {
      session_id: 'test-session-1',
      limit: 3,
      offset: 4
    };

    const result = await getChatMessages(input);

    expect(result).toHaveLength(3);
    expect(result[0].content).toBe('Test message 5');
    expect(result[1].content).toBe('Test message 6');
    expect(result[2].content).toBe('Test message 7');
  });

  it('should only return messages from the specified session', async () => {
    // Create two test sessions
    await createTestSession('session-1');
    await createTestSession('session-2');

    // Create messages for both sessions
    await createTestMessages('session-1', 2);
    await createTestMessages('session-2', 3);

    const input: GetChatMessagesInput = {
      session_id: 'session-1'
    };

    const result = await getChatMessages(input);

    expect(result).toHaveLength(2);
    result.forEach(message => {
      expect(message.session_id).toBe('session-1');
    });
  });

  it('should handle different content types and roles', async () => {
    await createTestSession();

    // Create messages with different content types
    await db.insert(chatMessagesTable)
      .values([
        {
          session_id: 'test-session-1',
          role: 'user' as 'user' | 'assistant',
          content: 'Text message',
          content_type: 'text' as 'text' | 'image' | 'pdf',
          metadata: null
        },
        {
          session_id: 'test-session-1',
          role: 'assistant' as 'user' | 'assistant',
          content: 'Image analysis',
          content_type: 'image' as 'text' | 'image' | 'pdf',
          metadata: { image_url: 'https://example.com/image.jpg' }
        },
        {
          session_id: 'test-session-1',
          role: 'user' as 'user' | 'assistant',
          content: 'PDF content',
          content_type: 'pdf' as 'text' | 'image' | 'pdf',
          metadata: { pdf_url: 'https://example.com/doc.pdf' }
        }
      ])
      .execute();

    const input: GetChatMessagesInput = {
      session_id: 'test-session-1'
    };

    const result = await getChatMessages(input);

    expect(result).toHaveLength(3);
    
    // Verify different content types are handled correctly
    expect(result[0].content_type).toBe('text');
    expect(result[1].content_type).toBe('image');
    expect(result[2].content_type).toBe('pdf');

    // Verify metadata handling
    expect(result[0].metadata).toBeNull();
    expect(result[1].metadata).toEqual({ image_url: 'https://example.com/image.jpg' });
    expect(result[2].metadata).toEqual({ pdf_url: 'https://example.com/doc.pdf' });
  });

  it('should handle edge case with zero limit', async () => {
    await createTestSession();
    await createTestMessages();

    const input: GetChatMessagesInput = {
      session_id: 'test-session-1',
      limit: 0
    };

    const result = await getChatMessages(input);

    expect(result).toHaveLength(0);
  });

  it('should handle offset larger than total messages', async () => {
    await createTestSession();
    await createTestMessages('test-session-1', 3);

    const input: GetChatMessagesInput = {
      session_id: 'test-session-1',
      offset: 10
    };

    const result = await getChatMessages(input);

    expect(result).toHaveLength(0);
  });
});