import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { chatSessionsTable } from '../db/schema';
import { type CreateChatSessionInput } from '../schema';
import { getChatSessions } from '../handlers/get_chat_sessions';
import { eq } from 'drizzle-orm';

// Test input data
const testSession1: CreateChatSessionInput = {
  id: 'session-1',
  title: 'First Chat Session',
  gen_z_mode: false,
  copy_code_only_mode: false,
  target_language: 'javascript'
};

const testSession2: CreateChatSessionInput = {
  id: 'session-2',
  title: 'Second Chat Session',
  gen_z_mode: true,
  copy_code_only_mode: true,
  target_language: null
};

const testSession3: CreateChatSessionInput = {
  id: 'session-3',
  title: null,
  gen_z_mode: false,
  copy_code_only_mode: false,
  target_language: 'python'
};

describe('getChatSessions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no sessions exist', async () => {
    const result = await getChatSessions();

    expect(result).toEqual([]);
  });

  it('should return all chat sessions ordered by updated_at descending', async () => {
    // Create test sessions with different timestamps
    const session1 = await db.insert(chatSessionsTable)
      .values({
        id: testSession1.id!,
        title: testSession1.title,
        gen_z_mode: testSession1.gen_z_mode!,
        copy_code_only_mode: testSession1.copy_code_only_mode!,
        target_language: testSession1.target_language
      })
      .returning()
      .execute();

    // Wait a moment to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const session2 = await db.insert(chatSessionsTable)
      .values({
        id: testSession2.id!,
        title: testSession2.title,
        gen_z_mode: testSession2.gen_z_mode!,
        copy_code_only_mode: testSession2.copy_code_only_mode!,
        target_language: testSession2.target_language
      })
      .returning()
      .execute();

    // Wait a moment to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const session3 = await db.insert(chatSessionsTable)
      .values({
        id: testSession3.id!,
        title: testSession3.title,
        gen_z_mode: testSession3.gen_z_mode!,
        copy_code_only_mode: testSession3.copy_code_only_mode!,
        target_language: testSession3.target_language
      })
      .returning()
      .execute();

    const result = await getChatSessions();

    // Should return all 3 sessions
    expect(result).toHaveLength(3);

    // Should be ordered by updated_at descending (most recent first)
    expect(result[0].id).toEqual('session-3');
    expect(result[1].id).toEqual('session-2');
    expect(result[2].id).toEqual('session-1');

    // Verify session data integrity
    expect(result[0].title).toBeNull();
    expect(result[0].gen_z_mode).toEqual(false);
    expect(result[0].copy_code_only_mode).toEqual(false);
    expect(result[0].target_language).toEqual('python');
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    expect(result[1].title).toEqual('Second Chat Session');
    expect(result[1].gen_z_mode).toEqual(true);
    expect(result[1].copy_code_only_mode).toEqual(true);
    expect(result[1].target_language).toBeNull();

    expect(result[2].title).toEqual('First Chat Session');
    expect(result[2].gen_z_mode).toEqual(false);
    expect(result[2].copy_code_only_mode).toEqual(false);
    expect(result[2].target_language).toEqual('javascript');
  });

  it('should handle sessions with all nullable fields as null', async () => {
    // Create minimal session with only required fields
    await db.insert(chatSessionsTable)
      .values({
        id: 'minimal-session'
        // All other fields will use defaults or be null
      })
      .returning()
      .execute();

    const result = await getChatSessions();

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual('minimal-session');
    expect(result[0].title).toBeNull();
    expect(result[0].gen_z_mode).toEqual(false); // Default value
    expect(result[0].copy_code_only_mode).toEqual(false); // Default value
    expect(result[0].target_language).toBeNull();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return sessions in correct chronological order', async () => {
    // Create first session
    await db.insert(chatSessionsTable)
      .values({
        id: 'old-session',
        title: 'Old Session'
      })
      .returning()
      .execute();

    // Wait to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 50));

    // Create second session (more recent)
    await db.insert(chatSessionsTable)
      .values({
        id: 'new-session',
        title: 'New Session'
      })
      .returning()
      .execute();

    const result = await getChatSessions();

    expect(result).toHaveLength(2);
    
    // Most recent session should be first
    expect(result[0].id).toEqual('new-session');
    expect(result[1].id).toEqual('old-session');

    // Verify chronological order
    expect(result[0].updated_at.getTime()).toBeGreaterThan(result[1].updated_at.getTime());
  });

  it('should verify sessions are saved correctly in database', async () => {
    const insertedSession = await db.insert(chatSessionsTable)
      .values({
        id: testSession1.id!,
        title: testSession1.title,
        gen_z_mode: testSession1.gen_z_mode!,
        copy_code_only_mode: testSession1.copy_code_only_mode!,
        target_language: testSession1.target_language
      })
      .returning()
      .execute();

    // Query database directly to verify data
    const sessions = await db.select()
      .from(chatSessionsTable)
      .where(eq(chatSessionsTable.id, testSession1.id!))
      .execute();

    expect(sessions).toHaveLength(1);
    expect(sessions[0].id).toEqual('session-1');
    expect(sessions[0].title).toEqual('First Chat Session');
    expect(sessions[0].gen_z_mode).toEqual(false);
    expect(sessions[0].copy_code_only_mode).toEqual(false);
    expect(sessions[0].target_language).toEqual('javascript');
    expect(sessions[0].created_at).toBeInstanceOf(Date);
    expect(sessions[0].updated_at).toBeInstanceOf(Date);

    // Verify handler returns same data
    const handlerResult = await getChatSessions();
    expect(handlerResult).toHaveLength(1);
    expect(handlerResult[0]).toEqual(sessions[0]);
  });
});