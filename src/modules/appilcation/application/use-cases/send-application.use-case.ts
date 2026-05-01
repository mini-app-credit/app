import { Logger } from '@nestjs/common';
import { Result, UseCase, UUIDIdentifier } from 'src/shared';
import { ApplicationNotFoundError, ApplicationRepository } from '../../domain';
import { EmailSenderPort, PublicUrlPort } from '../ports';
import { ApplicationMapper } from '../mappers/application.mapper';
import { ApplicationOutput, SendApplicationInput } from '../dtos';

export type SendApplication = UseCase<SendApplicationInput, Result<ApplicationOutput>>;

export class SendApplicationUseCase implements SendApplication {
  private readonly logger = new Logger(SendApplicationUseCase.name);

  constructor(
    private readonly repo: ApplicationRepository,
    private readonly email: EmailSenderPort,
    private readonly urls: PublicUrlPort,
  ) {}

  async execute(input: SendApplicationInput): Promise<Result<ApplicationOutput>> {
    try {
      const agg = await this.repo.findById(UUIDIdentifier.create(input.id));
      if (!agg) return [new ApplicationNotFoundError(input.id), null];

      const token = agg.send({
        recipientName: input.recipientName,
        recipientEmail: input.recipientEmail,
      });

      const saved = await this.repo.save(agg);

      const link = this.urls.recipientLink(token.token);
      this.logger.log(`Recipient link for application ${input.id}: ${link}`);

      const [emailErr] = await this.email.send({
        to: input.recipientEmail,
        subject: 'You have received a credit application',
        html: buildRecipientEmail(input.recipientName, link),
      });
      if (emailErr) this.logger.error('Failed to send recipient email', emailErr);

      return [null, ApplicationMapper.toPublicDto(saved)];
    } catch (err) {
      return [err instanceof Error ? err : new Error('Unknown error'), null];
    }
  }
}

function buildRecipientEmail(name: string, link: string): string {
  return `
    <h2>Hello, ${name}!</h2>
    <p>You have received a credit application. Please click the link below to fill it out:</p>
    <p><a href="${link}">${link}</a></p>
    <p>This link expires in 7 days.</p>
  `;
}
