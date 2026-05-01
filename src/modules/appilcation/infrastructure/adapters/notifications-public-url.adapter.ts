import type { NotificationsConfig } from 'src/modules/notifications';
import { PublicUrlPort } from '../../application/ports';

export class NotificationsPublicUrlAdapter implements PublicUrlPort {
  constructor(private readonly config: NotificationsConfig) {}

  applicationLink(applicationId: string): string {
    return `${this.origin()}/applications/${applicationId}`;
  }

  recipientLink(token: string): string {
    return `${this.origin()}/apply/${token}`;
  }

  private origin(): string {
    const client = this.config.CLIENT_URL?.trim();
    if (client) return client.replace(/\/+$/, '');
    const verify = this.config.EMAIL_VERIFY_URL_BASE?.trim();
    if (verify) {
      try {
        return new URL(verify).origin;
      } catch {
        /* invalid URL */
      }
    }
    return 'http://localhost:4000';
  }
}
