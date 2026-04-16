
export interface CaptchaOptions {
  minScore?: number;
  expectedAction?: string;
}

/**
 * Abstract Captcha Service for CAPTCHA validation
 * Infrastructure layer will implement with Google reCAPTCHA
 */
export interface CaptchaService {
  /**
   * Validate CAPTCHA token
   * @param token CAPTCHA token from frontend
   * @param ip IP address of the client
   * @param opts Additional options
   * @returns true if valid, false otherwise
   */
  isValid(token: string, ip?: string, opts?: CaptchaOptions): Promise<boolean>;
}
