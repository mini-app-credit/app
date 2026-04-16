export { };

declare module 'express-serve-static-core' {
  interface Request {
    rateLimitInfo?: {
      limit: number;
      remaining: number;
      reset: number;
    };
    user?: {
      userId: string;
      accountId: string;
      email: string | null;
      provider: string;
    };
  }
}
