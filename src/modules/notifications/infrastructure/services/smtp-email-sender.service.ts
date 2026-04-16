import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { Result } from 'src/shared';
import { EmailSendFailedError } from '../../domain/errors';
import { EmailSenderService, SendEmailInput } from '../../application/services/email-sender';
import { NotificationsConfig } from '../configs';
import { Logger } from '@nestjs/common';

export class EmailService implements EmailSenderService {
  private readonly transporter: Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly config: NotificationsConfig) {
    const auth: { user?: string; pass?: string } = {};
    if (this.config.SMTP_USER.length && this.config.SMTP_PASSWORD.length) {
      auth.user = this.config.SMTP_USER;
      auth.pass = this.config.SMTP_PASSWORD;
    }

    this.transporter = nodemailer.createTransport({
      host: this.config.SMTP_HOST,
      port: this.config.SMTP_PORT,
      secure: this.config.SMTP_SECURE,
      ...(Object.keys(auth).length ? { auth } : {}),
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      this.logger.debug('Verifying SMTP connection');
      await this.transporter.verify();
      this.logger.debug('SMTP connection verified');
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to verify SMTP connection: ${reason}`);
    }
  }

  async send(input: SendEmailInput): Promise<Result<null>> {
    try {
      this.logger.debug({ to: input.to, subject: input.subject }, 'Sending email');

      await this.transporter.sendMail({
        from: this.config.SMTP_FROM,
        to: input.to,
        subject: input.subject,
        html: input.html,
      });

      this.logger.debug({ to: input.to }, 'Email sent');

      return [null, null];
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown error';

      this.logger.error({ to: input.to, err: error }, 'Failed to send email');
      return [new EmailSendFailedError(input.to, reason), null];
    }
  }
}
