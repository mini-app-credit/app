import { EmailSenderService } from 'src/modules/notifications/application/services/email-sender';
import { EmailSenderPort } from '../../application/ports';

export class NestEmailSenderAdapter implements EmailSenderPort {
  constructor(private readonly inner: EmailSenderService) {}

  send(input: {
    to: string;
    subject: string;
    html: string;
  }): Promise<[Error | null, unknown]> {
    return this.inner.send(input);
  }
}
