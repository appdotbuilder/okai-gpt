import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { chatSessionsTable } from '../db/schema';
import { type UpdateChatSessionInput, type CreateChatSessionInput } from '../schema';
import { updateChatSession } from '../handlers/update_chat_session';
import { eq } from 'drizzle-orm';

// Helper to create a chat session for testing
const createTestSession = async (sessionData: Partial<CreateChatSessionInput> = {}) => {
  const defaultData = {
    id: 'test-session-123',
    title: 'Original Title',
    gen_z_mode: false,
    copy_code_only_mode: false,
    target_language: null
  };

  const result = await db.insert(chatSessionsTable)
    .values({ ...defaultData, ...sessionData })
    .returning()
    .execute();

  return result[0];
};

describe('updateChatSession', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update title only', async () => {
    // Create test session
    const originalSession = await createTestSession();

    const updateInput: UpdateChatSessionInput = {
      id: originalSession.id,
      title: 'Updated Title'
    };

    const result = await updateChatSession(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(originalSession.id);
    expect(result.title).toEqual('Updated Title');
    expect(result.gen_z_mode).toEqual(originalSession.gen_z_mode); // Unchanged
    expect(result.copy_code_only_mode).toEqual(originalSession.copy_code_only_mode); // Unchanged
    expect(result.target_language).toEqual(originalSession.target_language); // Unchanged
    expect(result.created_at).toEqual(originalSession.created_at); // Unchanged
    expect(result.updated_at).not.toEqual(originalSession.updated_at); // Should be updated
  });

  it('should update gen_z_mode flag', async () => {
    const originalSession = await createTestSession();

    const updateInput: UpdateChatSessionInput = {
      id: originalSession.id,
      gen_z_mode: true
    };

    const result = await updateChatSession(updateInput);

    expect(result.gen_z_mode).toBe(true);
    expect(result.title).toEqual(originalSession.title); // Unchanged
    expect(result.updated_at).not.toEqual(originalSession.updated_at);
  });

  it('should update copy_code_only_mode flag', async () => {
    const originalSession = await createTestSession();

    const updateInput: UpdateChatSessionInput = {
      id: originalSession.id,
      copy_code_only_mode: true
    };

    const result = await updateChatSession(updateInput);

    expect(result.copy_code_only_mode).toBe(true);
    expect(result.title).toEqual(originalSession.title); // Unchanged
    expect(result.updated_at).not.toEqual(originalSession.updated_at);
  });

  it('should update target_language', async () => {
    const originalSession = await createTestSession();

    const updateInput: UpdateChatSessionInput = {
      id: originalSession.id,
      target_language: 'Spanish'
    };

    const result = await updateChatSession(updateInput);

    expect(result.target_language).toEqual('Spanish');
    expect(result.title).toEqual(originalSession.title); // Unchanged
    expect(result.updated_at).not.toEqual(originalSession.updated_at);
  });

  it('should update multiple fields at once', async () => {
    const originalSession = await createTestSession();

    const updateInput: UpdateChatSessionInput = {
      id: originalSession.id,
      title: 'New Multi-Update Title',
      gen_z_mode: true,
      copy_code_only_mode: true,
      target_language: 'French'
    };

    const result = await updateChatSession(updateInput);

    expect(result.title).toEqual('New Multi-Update Title');
    expect(result.gen_z_mode).toBe(true);
    expect(result.copy_code_only_mode).toBe(true);
    expect(result.target_language).toEqual('French');
    expect(result.created_at).toEqual(originalSession.created_at); // Should remain unchanged
    expect(result.updated_at).not.toEqual(originalSession.updated_at); // Should be updated
  });

  it('should set title to null', async () => {
    const originalSession = await createTestSession({ title: 'Original Title' });

    const updateInput: UpdateChatSessionInput = {
      id: originalSession.id,
      title: null
    };

    const result = await updateChatSession(updateInput);

    expect(result.title).toBeNull();
    expect(result.updated_at).not.toEqual(originalSession.updated_at);
  });

  it('should set target_language to null', async () => {
    const originalSession = await createTestSession({ target_language: 'English' });

    const updateInput: UpdateChatSessionInput = {
      id: originalSession.id,
      target_language: null
    };

    const result = await updateChatSession(updateInput);

    expect(result.target_language).toBeNull();
    expect(result.updated_at).not.toEqual(originalSession.updated_at);
  });

  it('should update database record', async () => {
    const originalSession = await createTestSession();

    const updateInput: UpdateChatSessionInput = {
      id: originalSession.id,
      title: 'Database Update Test',
      gen_z_mode: true
    };

    await updateChatSession(updateInput);

    // Query database directly to verify changes were persisted
    const updatedSessionInDb = await db.select()
      .from(chatSessionsTable)
      .where(eq(chatSessionsTable.id, originalSession.id))
      .execute();

    expect(updatedSessionInDb).toHaveLength(1);
    expect(updatedSessionInDb[0].title).toEqual('Database Update Test');
    expect(updatedSessionInDb[0].gen_z_mode).toBe(true);
    expect(updatedSessionInDb[0].copy_code_only_mode).toEqual(originalSession.copy_code_only_mode);
    expect(updatedSessionInDb[0].updated_at).not.toEqual(originalSession.updated_at);
  });

  it('should throw error for non-existent session', async () => {
    const updateInput: UpdateChatSessionInput = {
      id: 'non-existent-session-id',
      title: 'This should fail'
    };

    await expect(updateChatSession(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should always update timestamp even with no field changes', async () => {
    const originalSession = await createTestSession();

    // Update with only the ID (no other fields)
    const updateInput: UpdateChatSessionInput = {
      id: originalSession.id
    };

    const result = await updateChatSession(updateInput);

    // All fields should remain the same except updated_at
    expect(result.id).toEqual(originalSession.id);
    expect(result.title).toEqual(originalSession.title);
    expect(result.gen_z_mode).toEqual(originalSession.gen_z_mode);
    expect(result.copy_code_only_mode).toEqual(originalSession.copy_code_only_mode);
    expect(result.target_language).toEqual(originalSession.target_language);
    expect(result.created_at).toEqual(originalSession.created_at);
    expect(result.updated_at).not.toEqual(originalSession.updated_at); // Should be updated
  });
});