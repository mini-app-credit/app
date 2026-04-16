import { randomUUID } from 'node:crypto';
import { testDb, testRedis, testApi } from '../mocks';
import { HTTP_STATUS, TIMEOUTS } from '../mocks/fixtures';
import { user, signInRequest } from '../mocks/dsl';
import { SignInResponseBody, ReportResponseBody, ReviewResponseBody, PaginatedResponseBody, extractTokens, extractPaginationTotal } from '../mocks/types';

describe('Audit Module', () => {
  let accessToken: string;
  let userId: string;
  let projectId: string;
  let reportId: string;
  let reportIssueIds: string[];

  beforeAll(async () => {
    await testDb.database.initialize();
    await testRedis.initialize();
  }, TIMEOUTS.MEDIUM);

  beforeEach(async () => {
    const u = await user().verified().build();
    userId = u.userId;
    const signIn = await testApi.post<SignInResponseBody>('/auth/email/sign-in', signInRequest().build());
    accessToken = extractTokens(signIn.getBody()).accessToken;

    const { projectId: pid } = await testDb.project.createProject({ userId, name: 'Audit Project' });
    projectId = pid;

    const objectId = randomUUID();
    const { runId } = await testDb.project.createRun({ projectId, storageObjectId: objectId, status: 'done' });
    const { reportId: rid, issueIds } = await testDb.project.createReport({
      runId,
      projectId,
      status: 'fail',
      issues: [
        { field: 'name', message: 'Name is missing', status: 'fail' },
        { field: 'age', message: 'Age is valid', status: 'ok' },
      ],
    });
    reportId = rid;
    reportIssueIds = issueIds;
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

  describe('Rule: Report Listing', () => {
    it('lists reports for project with pagination', async () => {
      const res = await testApi.get<PaginatedResponseBody<ReportResponseBody>>(`/projects/${projectId}/reports`, auth());
      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.getBody().data.length).toBeGreaterThanOrEqual(1);
      const total = extractPaginationTotal(res.getBody());
      expect(total).toBeGreaterThanOrEqual(1);
    }, TIMEOUTS.SHORT);

    it('filters reports by status', async () => {
      const res = await testApi.get<PaginatedResponseBody<ReportResponseBody>>(`/projects/${projectId}/reports?status=fail`, auth());
      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.getBody().data.every((r) => r.status === 'fail')).toBe(true);
    }, TIMEOUTS.SHORT);
  });

  describe('Rule: Report Finding', () => {
    it('finds report by id with issues', async () => {
      const res = await testApi.get<ReportResponseBody>(`/reports/${reportId}`, auth());
      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.getBody().id).toBe(reportId);
      expect(res.getBody().issues.length).toBeGreaterThanOrEqual(2);
    }, TIMEOUTS.SHORT);
  });

  describe('Rule: Review Creation', () => {
    it('creates review for report', async () => {
      const res = await testApi.post<ReviewResponseBody>(`/reports/${reportId}/reviews`, {
        verdict: 'approve',
        notes: 'Looks good overall',
        overrideData: null,
        issues: [
          { reportIssueId: reportIssueIds[0], type: 'rule', status: 'ok', message: 'Approved after manual check' },
        ],
      }, auth());

      expect(res.status).toBe(HTTP_STATUS.CREATED);
      expect(res.getBody().verdict).toBe('approve');
      expect(res.getBody().notes).toBe('Looks good overall');
    }, TIMEOUTS.SHORT);
  });

  describe('Rule: Review Update', () => {
    it('updates review verdict and notes', async () => {
      const created = await testApi.post<ReviewResponseBody>(`/reports/${reportId}/reviews`, {
        verdict: 'approve',
        notes: 'Initial',
        issues: [],
      }, auth());
      const reviewId = created.getBody().id;

      const res = await testApi.put<ReviewResponseBody>(`/reviews/${reviewId}`, {
        verdict: 'reject',
        notes: 'Changed mind after re-review',
      }, auth());

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.getBody().verdict).toBe('reject');
      expect(res.getBody().notes).toBe('Changed mind after re-review');
    }, TIMEOUTS.SHORT);
  });

  describe('Rule: Review Listing', () => {
    it('lists reviews for report', async () => {
      await testApi.post<ReviewResponseBody>(`/reports/${reportId}/reviews`, {
        verdict: 'approve', notes: '', issues: [],
      }, auth());

      const res = await testApi.get<{ reviews: ReviewResponseBody[] }>(`/reports/${reportId}/reviews`, auth());
      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.getBody().reviews.length).toBeGreaterThanOrEqual(1);
    }, TIMEOUTS.SHORT);
  });

  describe('Invariant: Authentication Required', () => {
    it('rejects unauthenticated report access', async () => {
      const res = await testApi.get(`/reports/${reportId}`);
      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    }, TIMEOUTS.SHORT);
  });
});
