import { testApi } from '../mocks';
import { HTTP_STATUS, TIMEOUTS } from '../mocks/fixtures';
import { HealthResponseBody } from '../mocks/types';

describe('Health Module', () => {
  afterAll(async () => {
    try {
      await (testApi as any).close?.();
    } catch {}
  }, TIMEOUTS.MEDIUM);

  describe('Rule: Liveness', () => {
    it('GET /health/live returns 200 with status', async () => {
      const res = await testApi.get<HealthResponseBody>('/health/live');
      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.getBody()).toHaveProperty('status');
    }, TIMEOUTS.SHORT);
  });

  describe('Rule: Startup Check', () => {
    it('GET /health/startup returns health check result', async () => {
      const res = await testApi.get<HealthResponseBody>('/health/startup');
      expect([HTTP_STATUS.OK, HTTP_STATUS.SERVICE_UNAVAILABLE]).toContain(res.status);
      expect(res.getBody()).toHaveProperty('status');
    }, TIMEOUTS.SHORT);
  });

  describe('Rule: Full Health', () => {
    it('GET /health returns health check with details', async () => {
      const res = await testApi.get<HealthResponseBody>('/health');
      expect([HTTP_STATUS.OK, HTTP_STATUS.SERVICE_UNAVAILABLE]).toContain(res.status);
      expect(res.getBody()).toHaveProperty('status');
    }, TIMEOUTS.LONG);
  });
});
