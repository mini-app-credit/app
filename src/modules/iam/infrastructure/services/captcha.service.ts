import { z } from 'zod';
import { CaptchaOptions, CaptchaService } from '../../application/services';
import axios, { AxiosInstance } from 'axios';

const actionNameSchema = z.string().regex(/^[A-Za-z0-9/_]+$/);
const tokenSchema = z.string().min(1);

const isValidOptsSchema = z
  .object({
    minScore: z.number().min(0).max(1).optional(),
    expectedAction: actionNameSchema.optional(),
  })
  .strict();

const recaptchaResponseSchema = z
  .object({
    success: z.boolean(),
    score: z.number().min(0).max(1).optional(),
    action: actionNameSchema.optional(),
    challenge_ts: z.string().datetime().optional(),
    hostname: z.string().min(1).optional(),
    'error-codes': z.array(z.string().min(1)).optional(),
  })
  .passthrough();

export interface GoogleCaptchaServiceOptions {
  secret: string;
  timeoutMs: number;
}

export class GoogleCaptchaService implements CaptchaService {
  private readonly secret: string;
  private readonly timeoutMs: number;
  private readonly client: AxiosInstance;

  constructor(private readonly options: GoogleCaptchaServiceOptions) {
    const { secret, timeoutMs } = this.options;
    this.secret = secret;
    this.timeoutMs = timeoutMs;
    this.client = this.createClient();
  }

  private createClient() {
    const baseURL = 'https://www.google.com/recaptcha/api/siteverify';
    return axios.create({
      baseURL,
      timeout: this.timeoutMs,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  }

  async verify(token: string, ip?: string) {
    const tokenParse = tokenSchema.safeParse(token);
    if (!tokenParse.success) {
      return null;
    }

    const body = new URLSearchParams();
    body.set('secret', this.secret);
    body.set('response', tokenParse.data);
    if (ip) body.set('remoteip', ip);

    try {
      const res = await this.client.post('', body);
      const result = recaptchaResponseSchema.safeParse(res.data);
      return result.success ? result.data : null;
    } catch {
      return null;
    }
  }

  async isValid(token: string, ip?: string, opts?: CaptchaOptions): Promise<boolean> {
    const { minScore = 0.5, expectedAction } = isValidOptsSchema.parse(opts ?? {});
    const result = await this.verify(token, ip);
    if (!result) return false;
    if (!result.success) return false; // Add check for success field
    if (typeof result.score === 'number' && result.score < minScore) return false;
    if (expectedAction && result.action !== expectedAction) return false;
    return true;
  }
}
