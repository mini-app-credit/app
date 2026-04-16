import { randomUUID } from 'node:crypto';
import { testDb, testRedis, testApi } from '../mocks';
import { HTTP_STATUS, TIMEOUTS } from '../mocks/fixtures';
import { user, signInRequest } from '../mocks/dsl';
import { SignInResponseBody, ProjectResponseBody, RunResponseBody, PaginatedResponseBody, extractTokens, extractPaginationTotal } from '../mocks/types';

describe('Execution Module', () => {
  let accessToken: string;
  let projectId: string;
  let storageObjectId: string;

  beforeAll(async () => {
    await testDb.database.initialize();
    await testRedis.initialize();
  }, TIMEOUTS.MEDIUM);

  beforeEach(async () => {
    await user().verified().build();
    const signIn = await testApi.post<SignInResponseBody>('/auth/email/sign-in', signInRequest().build());
    accessToken = extractTokens(signIn.getBody()).accessToken;

    const projectRes = await testApi.post<ProjectResponseBody>('/projects', { name: 'Exec Project' }, testApi.withBearerToken(accessToken));
    projectId = projectRes.getBody().id;

    storageObjectId = randomUUID();
  }, TIMEOUTS.SHORT);

  afterEach(async () => {
    await testDb.database.clear();
    await testRedis.clear();
  }, TIMEOUTS.SHORT);

  afterAll(async () => {
    try {
      await (testApi as any).close?.();
      await testDb.database.close();
    } catch {}
  }, TIMEOUTS.MEDIUM);

  const auth = () => testApi.withBearerToken(accessToken);

  describe('Rule: Run Creation', () => {
    it('creates run, returns 201 with status=pending', async () => {
      const res = await testApi.post<RunResponseBody>('/runs', {
        projectId,
        storageObjectId,
      }, auth());

      expect(res.status).toBe(HTTP_STATUS.CREATED);
      expect(res.getBody().status).toBe('pending');
      expect(res.getBody().projectId).toBe(projectId);
    }, TIMEOUTS.SHORT);
  });

  describe('Rule: Run Listing', () => {
    it('lists runs for project with pagination', async () => {
      await testApi.post<RunResponseBody>('/runs', { projectId, storageObjectId }, auth());

      const res = await testApi.get<PaginatedResponseBody<RunResponseBody>>(`/projects/${projectId}/runs`, auth());
      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.getBody().data.length).toBeGreaterThanOrEqual(1);
      const total = extractPaginationTotal(res.getBody());
      expect(total).toBeGreaterThanOrEqual(1);
    }, TIMEOUTS.SHORT);
  });

  describe('Rule: Run Finding', () => {
    it('finds run by id', async () => {
      const created = await testApi.post<RunResponseBody>('/runs', { projectId, storageObjectId }, auth());
      const runId = created.getBody().id;

      const res = await testApi.get<RunResponseBody>(`/runs/${runId}`, auth());
      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.getBody().id).toBe(runId);
    }, TIMEOUTS.SHORT);
  });

  describe('Invariant: Authentication Required', () => {
    it('rejects unauthenticated run creation', async () => {
      const res = await testApi.post('/runs', { projectId, storageObjectId });
      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    }, TIMEOUTS.SHORT);
  });

  describe('Invariant: User Isolation', () => {
    it('user cannot create run for another user\'s project', async () => {
      await user().verified().withEmail('other@example.com').build();
      const signIn2 = await testApi.post<SignInResponseBody>('/auth/email/sign-in', signInRequest().withEmail('other@example.com').build());
      const otherToken = extractTokens(signIn2.getBody()).accessToken;

      const res = await testApi.post('/runs', {
        projectId,
        storageObjectId,
      }, testApi.withBearerToken(otherToken));

      expect([HTTP_STATUS.NOT_FOUND, HTTP_STATUS.FORBIDDEN]).toContain(res.status);
    }, TIMEOUTS.SHORT);
  });
});
