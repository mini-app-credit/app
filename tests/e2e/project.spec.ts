import { testDb, testRedis, testApi } from '../mocks';
import { HTTP_STATUS, TIMEOUTS } from '../mocks/fixtures';
import { user, signInRequest } from '../mocks/dsl';
import { SignInResponseBody, ProjectResponseBody, PaginatedResponseBody, extractTokens, extractPaginationTotal } from '../mocks/types';

describe('Project Module', () => {
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    await testDb.database.initialize();
    await testRedis.initialize();
  }, TIMEOUTS.MEDIUM);

  beforeEach(async () => {
    const { userId: uid } = await user().verified().build();
    userId = uid;

    const signIn = await testApi.post<SignInResponseBody>('/auth/email/sign-in', signInRequest().build());
    expect(signIn.status).toBe(HTTP_STATUS.OK);
    accessToken = extractTokens(signIn.getBody()).accessToken;
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

  // ===== PROJECT CRUD =====
  describe('Rule: Project CRUD', () => {
    it('creates project, returns 201 with id', async () => {
      const res = await testApi.post<ProjectResponseBody>('/projects', { name: 'KYC Validation' }, auth());
      expect(res.status).toBe(HTTP_STATUS.CREATED);
      expect(res.getBody()).toHaveProperty('id');
      expect(res.getBody().name).toBe('KYC Validation');
    }, TIMEOUTS.SHORT);

    it('lists projects for authenticated user', async () => {
      const p1 = await testApi.post<ProjectResponseBody>('/projects', { name: 'Project 1' }, auth());
      expect(p1.status).toBe(HTTP_STATUS.CREATED);

      const res = await testApi.get<PaginatedResponseBody<ProjectResponseBody>>('/projects', auth());
      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.getBody().data.length).toBe(1);
      const total = extractPaginationTotal(res.getBody());
      expect(total).toBe(1);
    }, TIMEOUTS.SHORT);

    it('finds project by id', async () => {
      const created = await testApi.post<ProjectResponseBody>('/projects', { name: 'Find Me' }, auth());
      const id = created.getBody().id;

      const res = await testApi.get<ProjectResponseBody>(`/projects/${id}`, auth());
      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.getBody().name).toBe('Find Me');
    }, TIMEOUTS.SHORT);

    it('updates project name', async () => {
      const created = await testApi.post<ProjectResponseBody>('/projects', { name: 'Old Name' }, auth());
      const id = created.getBody().id;

      const res = await testApi.put<ProjectResponseBody>(`/projects/${id}`, { name: 'New Name' }, auth());
      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.getBody().name).toBe('New Name');
    }, TIMEOUTS.SHORT);

    it('deletes project, returns 204', async () => {
      const created = await testApi.post<ProjectResponseBody>('/projects', { name: 'Delete Me' }, auth());
      const id = created.getBody().id;

      const res = await testApi.delete(`/projects/${id}`, auth());
      expect(res.status).toBe(HTTP_STATUS.NO_CONTENT);
    }, TIMEOUTS.SHORT);
  });

  // ===== AUTH INVARIANT =====
  describe('Invariant: Authentication Required', () => {
    it('rejects unauthenticated project creation', async () => {
      const res = await testApi.post('/projects', { name: 'No Auth' });
      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    }, TIMEOUTS.SHORT);

    it('rejects unauthenticated project listing', async () => {
      const res = await testApi.get('/projects');
      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    }, TIMEOUTS.SHORT);
  });

  // ===== USER ISOLATION =====
  describe('Invariant: User Isolation', () => {
    it('user cannot access another user\'s project', async () => {
      const created = await testApi.post<ProjectResponseBody>('/projects', { name: 'Private' }, auth());
      const projectId = created.getBody().id;

      await user().verified().withEmail('other@example.com').build();
      const signIn2 = await testApi.post<SignInResponseBody>('/auth/email/sign-in', signInRequest().withEmail('other@example.com').build());
      const otherToken = extractTokens(signIn2.getBody()).accessToken;

      const res = await testApi.get(`/projects/${projectId}`, testApi.withBearerToken(otherToken));
      expect([HTTP_STATUS.NOT_FOUND, HTTP_STATUS.FORBIDDEN]).toContain(res.status);
    }, TIMEOUTS.SHORT);
  });

  // ===== PROJECT CONFIGURATION =====
  describe('Rule: Project Configuration', () => {
    it('sets activeRuleSetId and activeMappingId on project', async () => {
      const created = await testApi.post<ProjectResponseBody>('/projects', { name: 'Config Test' }, auth());
      const projectId = created.getBody().id;

      const { ruleSetId } = await testDb.project.createRuleSet({ projectId });
      const { mappingId } = await testDb.project.createMapping({ projectId });

      const res = await testApi.put<ProjectResponseBody>(`/projects/${projectId}`, {
        activeRuleSetId: ruleSetId,
        activeMappingId: mappingId,
      }, auth());

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.getBody().activeRuleSetId).toBe(ruleSetId);
      expect(res.getBody().activeMappingId).toBe(mappingId);
    }, TIMEOUTS.SHORT);
  });

  // ===== EDGE CASES =====
  describe('Edge Cases', () => {
    it('rejects project creation with empty name', async () => {
      const res = await testApi.post('/projects', { name: '' }, auth());
      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
    }, TIMEOUTS.SHORT);

    it('returns error for non-existent project', async () => {
      const res = await testApi.get('/projects/00000000-0000-0000-0000-000000000000', auth());
      expect(res.status).toBeGreaterThanOrEqual(HTTP_STATUS.BAD_REQUEST);
    }, TIMEOUTS.SHORT);
  });
});
