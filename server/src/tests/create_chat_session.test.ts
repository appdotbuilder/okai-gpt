import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { chatSessionsTable } from '../db/schema';
import { type CreateChatSessionInput } from '../schema';
import { createChatSession } from '../handlers/create_chat_session';
import { eq } from 'drizzle-orm';

// Test inputs
const minimalInput: CreateChatSessionInput = {};

const fullInput: CreateChatSessionInput = {
  id: 'custom-session-123',
  title: 'Test Chat Session',
  gen_z_mode: true,
  copy_code_only_mode: true,
  target_language: 'spanish'
};

const partialInput: CreateChatSessionInput = {
  title: 'Partial Session',
  gen_z_mode: true
};

describe('createChatSession', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a chat session with minimal input', async () => {
    const result = await createChatSession(minimalInput);

    // Verify all fields are present with correct defaults
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('string');
    expect(result.title).toBeNull();
    expect(result.gen_z_mode).toBe(false);
    expect(result.copy_code_only_mode).toBe(false);
    expect(result.target_language).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a chat session with all provided fields', async () => {
    const result = await createChatSession(fullInput);

    // Verify all provided values are preserved
    expect(result.id).toEqual('custom-session-123');
    expect(result.title).toEqual('Test Chat Session');
    expect(result.gen_z_mode).toBe(true);
    expect(result.copy_code_only_mode).toBe(true);
    expect(result.target_language).toEqual('spanish');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a chat session with partial input and correct defaults', async () => {
    const result = await createChatSession(partialInput);

    // Verify provided values and defaults
    expect(result.id).toBeDefined();
    expect(result.title).toEqual('Partial Session');
    expect(result.gen_z_mode).toBe(true);
    expect(result.copy_code_only_mode).toBe(false); // Default
    expect(result.target_language).toBeNull(); // Default
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save chat session to database', async () => {
    const result = await createChatSession(fullInput);

    // Query database to verify persistence
    const sessions = await db.select()
      .from(chatSessionsTable)
      .where(eq(chatSessionsTable.id, result.id))
      .execute();

    expect(sessions).toHaveLength(1);
    const session = sessions[0];
    
    expect(session.id).toEqual('custom-session-123');
    expect(session.title).toEqual('Test Chat Session');
    expect(session.gen_z_mode).toBe(true);
    expect(session.copy_code_only_mode).toBe(true);
    expect(session.target_language).toEqual('spanish');
    expect(session.created_at).toBeInstanceOf(Date);
    expect(session.updated_at).toBeInstanceOf(Date);
  });

  it('should generate unique session IDs when not provided', async () => {
    const session1 = await createChatSession(minimalInput);
    const session2 = await createChatSession(minimalInput);

    // Verify unique IDs are generated
    expect(session1.id).not.toEqual(session2.id);
    expect(session1.id).toBeDefined();
    expect(session2.id).toBeDefined();
    
    // Verify both sessions exist in database
    const allSessions = await db.select()
      .from(chatSessionsTable)
      .execute();

    expect(allSessions).toHaveLength(2);
    expect(allSessions.map(s => s.id)).toContain(session1.id);
    expect(allSessions.map(s => s.id)).toContain(session2.id);
  });

  it('should handle null values correctly', async () => {
    const inputWithNulls: CreateChatSessionInput = {
      title: null,
      target_language: null
    };

    const result = await createChatSession(inputWithNulls);

    expect(result.title).toBeNull();
    expect(result.target_language).toBeNull();
    expect(result.gen_z_mode).toBe(false); // Default
    expect(result.copy_code_only_mode).toBe(false); // Default
  });

  it('should handle timestamps correctly', async () => {
    const beforeCreation = new Date();
    const result = await createChatSession(fullInput);
    const afterCreation = new Date();

    // Verify timestamps are within expected range
    expect(result.created_at >= beforeCreation).toBe(true);
    expect(result.created_at <= afterCreation).toBe(true);
    expect(result.updated_at >= beforeCreation).toBe(true);
    expect(result.updated_at <= afterCreation).toBe(true);
  });

  it('should fail when trying to create session with duplicate ID', async () => {
    // Create first session
    await createChatSession({ id: 'duplicate-id' });

    // Attempt to create second session with same ID should fail
    await expect(
      createChatSession({ id: 'duplicate-id' })
    ).rejects.toThrow(/duplicate key value/i);
  });
});