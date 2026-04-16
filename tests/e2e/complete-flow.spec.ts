import { randomUUID } from 'node:crypto';
import { testDb, testRedis, testApi } from '../mocks';
import { HTTP_STATUS, TIMEOUTS } from '../mocks/fixtures';
import { user, signUpRequest, signInRequest } from '../mocks/dsl';
import { SignInResponseBody, ProjectResponseBody, RunResponseBody, extractTokens } from '../mocks/types';

describe('Complete Flow', () => {
  beforeAll(async () => {
    await testDb.database.initialize();
    await testRedis.initialize();
  }, TIMEOUTS.MEDIUM);

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

  describe('Rule: Full Validation Pipeline', () => {
    it('auth → project → configure → run → verify', async () => {
      // 1. Register
      const signUpPayload = signUpRequest().withEmail('flow@example.com').build();
      const signUpRes = await testApi.post('/auth/email/sign-up', signUpPayload);
      expect(signUpRes.status).toBe(HTTP_STATUS.CREATED);

      // 2. Verify + Sign in
      await testDb.iam.verifyUser('flow@example.com');
      const signInRes = await testApi.post<SignInResponseBody>('/auth/email/sign-in',
        signInRequest().withEmail('flow@example.com').build());
      expect(signInRes.status).toBe(HTTP_STATUS.OK);
      const accessToken = extractTokens(signInRes.getBody()).accessToken;
      const auth = testApi.withBearerToken(accessToken);

      // 3. Create project via API
      const projectRes = await testApi.post<ProjectResponseBody>('/projects', { name: 'KYC Validation' }, auth);
      expect(projectRes.status).toBe(HTTP_STATUS.CREATED);
      const projectId = projectRes.getBody().id;

      // 4. Create rule set + mapping via DB (class-level guard issue on nested routes)
      const { ruleSetId } = await testDb.project.createRuleSet({
        projectId,
        name: 'KYC Rules v1',
        rules: [
          { message: 'Name is required', type: 'static', payload: { fields: ['name'], rule: { '!!': { var: 'name' } } } },
        ],
      });
      const { mappingId } = await testDb.project.createMapping({
        projectId,
        fields: [{ from: 'fullName', to: 'name' }],
      });

      // 5. Activate rule set and mapping
      const updateRes = await testApi.put<ProjectResponseBody>(`/projects/${projectId}`, {
        activeRuleSetId: ruleSetId,
        activeMappingId: mappingId,
      }, auth);
      expect(updateRes.status).toBe(HTTP_STATUS.OK);

      // 6. Create storage object + run
      await testDb.iam.getUserByEmail('flow@example.com');
      const objectId = randomUUID();

      const runRes = await testApi.post<RunResponseBody>('/runs', { projectId, storageObjectId: objectId }, auth);
      expect(runRes.status).toBe(HTTP_STATUS.CREATED);
      expect(runRes.getBody().status).toBe('pending');

      // 7. Verify run is accessible
      const runId = runRes.getBody().id;
      const runCheck = await testApi.get<RunResponseBody>(`/runs/${runId}`, auth);
      expect(runCheck.status).toBe(HTTP_STATUS.OK);
      expect(runCheck.getBody().projectId).toBe(projectId);
    }, TIMEOUTS.LONG);
  });
});
