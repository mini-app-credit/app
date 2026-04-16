import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq, and } from 'drizzle-orm';
import * as schema from '../../src/shared/core/infrastructure/drizzle/schema';
import { Argon2HashService } from '../../src/shared/core/infrastructure/hash';

/**
 * Test Database Client - Uses Drizzle ORM
 */
let testDbPool: Pool | null = null;
let testDbClient: any = null;

export async function initializeTestDatabase() {
  if (testDbClient) return testDbClient;

  const databaseUrl = process.env.DATABASE_WRITE_URL || 'postgresql://postgres:postgres@localhost:5432/ai-port-test';
  testDbPool = new Pool({ connectionString: databaseUrl });
  testDbClient = drizzle(testDbPool, { schema });

  return testDbClient;
}

export async function closeTestDatabase() {
  if (testDbPool) {
    await testDbPool.end();
    testDbClient = null;
    testDbPool = null;
  }
}

export function getTestDatabase() {
  if (!testDbClient) {
    throw new Error('Test database not initialized. Call initializeTestDatabase() first.');
  }
  return testDbClient;
}

/**
 * Clear all test data from database
 */
export async function clearTestDatabase() {
  const db = getTestDatabase();

  const tables = [
    schema.accounts,
    schema.users,
  ];

  for (const table of tables) {
    try { await db.delete(table); } catch {}
  }
}

/**
 * Create test user with account
 */
export async function createTestUser(overrides?: {
  email?: string;
  password?: string;
  verified?: boolean;
}) {
  const db = getTestDatabase();
  const { v4: uuid } = await import('uuid');

  const email = overrides?.email || `test-${Date.now()}@example.com`;
  const userId = uuid();
  const accountId = uuid();
  const password = overrides?.password || 'TestPassword123!@#';

  // Hash password using real hash service
  const hashService = new Argon2HashService();
  const passwordHash = await hashService.hash(password);

  // Create user
  await db.insert(schema.users).values({
    id: userId,
    unitAmount: 10000,
  });

  // Create account (password provider)
  const now = new Date();
  await db.insert(schema.accounts).values({
    id: accountId,
    userId: userId,
    provider: 'password',
    subject: email,
    verifiedAt: overrides?.verified ? now : null,
    meta: {
      password: {
        hash: passwordHash,
      },
    },
  });

  return {
    userId,
    accountId,
    email,
  };
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  const db = getTestDatabase();

  const account = await db.query.accounts.findFirst({
    where: and(
      eq(schema.accounts.provider, 'password'),
      eq(schema.accounts.subject, email)
    ),
  });

  if (!account) return null;

  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, account.userId),
  });

  return { user, account };
}

/**
 * Delete user and all related data
 */
export async function deleteTestUser(userId: string) {
  const db = getTestDatabase();

  // Delete accounts (tokens are in Redis, handled separately)
  await db.delete(schema.accounts).where(eq(schema.accounts.userId, userId));

  // Delete user
  await db.delete(schema.users).where(eq(schema.users.id, userId));
}

/**
 * Verify user account
 */
export async function verifyTestUser(email: string) {
  const db = getTestDatabase();

  await db
    .update(schema.accounts)
    .set({ verifiedAt: new Date() })
    .where(
      and(
        eq(schema.accounts.provider, 'password'),
        eq(schema.accounts.subject, email)
      )
    );
}

/**
 * Count all users in database
 */
export async function countUsers(): Promise<number> {
  const db = getTestDatabase();
  const users = await db.query.users.findMany();
  return users.length;
}

/**
 * Count all accounts in database
 */
export async function countAccounts(): Promise<number> {
  const db = getTestDatabase();
  const accounts = await db.query.accounts.findMany();
  return accounts.length;
}

/**
 * Verify database is completely empty (invariant check)
 */
export async function verifyDatabaseEmpty(): Promise<boolean> {
  const userCount = await countUsers();
  const accountCount = await countAccounts();
  return userCount === 0 && accountCount === 0;
}

/**
 * Get all users (for cleanup verification)
 */
export async function getAllUsers() {
  const db = getTestDatabase();
  return db.query.users.findMany();
}

/**
 * Get all accounts (for cleanup verification)
 */
export async function getAllAccounts() {
  const db = getTestDatabase();
  return db.query.accounts.findMany();
}


// ===== Project Helpers =====

export async function createTestProject(overrides?: { userId?: string; name?: string }) {
  const db = getTestDatabase();
  const { v4: uuid } = await import('uuid');

  const userId = overrides?.userId || (await createTestUser({ verified: true })).userId;
  const projectId = uuid();
  const name = overrides?.name || `Test Project ${Date.now()}`;

  await db.insert(schema.projects).values({ id: projectId, name });
  await db.insert(schema.userProjects).values({ userId, projectId });

  return { projectId, userId, name };
}

export async function createTestRuleSet(overrides: {
  projectId: string;
  name?: string;
  rules?: { message: string; type: string; payload: any }[];
}) {
  const db = getTestDatabase();
  const { v4: uuid } = await import('uuid');

  const ruleSetId = uuid();
  await db.insert(schema.ruleSets).values({
    id: ruleSetId,
    projectId: overrides.projectId,
    name: overrides.name || 'Test Rules',
    version: 1,
  });

  const rules = overrides.rules || [
    { message: 'Name required', type: 'static', payload: { fields: ['name'], rule: { '!!': { var: 'name' } } } },
  ];

  for (const rule of rules) {
    await db.insert(schema.rules).values({
      id: uuid(),
      ruleSetId,
      message: rule.message,
      type: rule.type,
      payload: rule.payload,
    });
  }

  return { ruleSetId };
}

export async function createTestMapping(overrides: {
  projectId: string;
  fields?: { from: string; to: string }[];
}) {
  const db = getTestDatabase();
  const { v4: uuid } = await import('uuid');

  const mappingId = uuid();
  await db.insert(schema.mappings).values({ id: mappingId, projectId: overrides.projectId });

  const fields = overrides.fields || [{ from: 'name', to: 'name' }];
  for (const field of fields) {
    await db.insert(schema.mappingFields).values({
      id: uuid(),
      mappingId,
      from: field.from,
      to: field.to,
    });
  }

  return { mappingId };
}

export async function createTestRun(overrides: {
  projectId: string;
  storageObjectId: string;
  status?: string;
  reportId?: string;
}) {
  const db = getTestDatabase();
  const { v4: uuid } = await import('uuid');

  const runId = uuid();
  await db.insert(schema.runs).values({
    id: runId,
    projectId: overrides.projectId,
    storageObjectId: overrides.storageObjectId,
    status: overrides.status || 'done',
    reportId: overrides.reportId || null,
  });

  return { runId };
}

export async function createTestReport(overrides: {
  runId: string;
  projectId: string;
  status?: string;
  issues?: { field: string; message: string; status: string; ruleId?: string }[];
}) {
  const db = getTestDatabase();
  const { v4: uuid } = await import('uuid');

  const reportId = uuid();
  await db.insert(schema.reports).values({
    id: reportId,
    runId: overrides.runId,
    projectId: overrides.projectId,
    status: overrides.status || 'pass',
  });

  const issues = overrides.issues || [];
  const issueIds: string[] = [];
  for (const issue of issues) {
    const issueId = uuid();
    issueIds.push(issueId);
    await db.insert(schema.reportIssues).values({
      id: issueId,
      reportId,
      ruleId: issue.ruleId || null,
      field: issue.field,
      message: issue.message,
      status: issue.status,
    });
  }

  return { reportId, issueIds };
}

export async function clearProjectData() {
  const db = getTestDatabase();
  const tables = [
    schema.reviewIssues, schema.reviews,
    schema.reportIssues, schema.reports,
    schema.runs,
    schema.mappingFields, schema.mappings,
    schema.dataSchemas,
    schema.rules, schema.ruleSets,
    schema.userProjects, schema.projects,
  ];
  for (const table of tables) {
    try { await db.delete(table); } catch {}
  }
}

export const testDb = {
  database: {
    initialize: initializeTestDatabase,
    close: closeTestDatabase,
    get: getTestDatabase,
    clear: async () => {
      await clearProjectData();
      await clearTestDatabase();
    },
    countUsers,
    countAccounts,
    verifyEmpty: verifyDatabaseEmpty,
    getAllUsers,
    getAllAccounts,
  },
  iam: {
    createUser: createTestUser,
    getUserByEmail,
    deleteUser: deleteTestUser,
    verifyUser: verifyTestUser,
  },
  project: {
    createProject: createTestProject,
    createRuleSet: createTestRuleSet,
    createMapping: createTestMapping,
    createRun: createTestRun,
    createReport: createTestReport,
  },
};
