import { Logger } from '@nestjs/common';
import { Result, UseCase } from 'src/shared';
import {
  ApplicationRepository,
  ApplicationTokenExpiredError,
  ApplicationTokenNotFoundError,
  ApplicationTokenUsedError,
  TradeReference,
} from '../../domain';
import { EmailSenderPort, PublicUrlPort } from '../ports';
import { ApplicationMapper } from '../mappers/application.mapper';
import { ApplicationOutput, SubmitApplicationInput } from '../dtos';

export type SubmitApplication = UseCase<SubmitApplicationInput, Result<ApplicationOutput>>;

export class SubmitApplicationUseCase implements SubmitApplication {
  private readonly logger = new Logger(SubmitApplicationUseCase.name);

  constructor(
    private readonly repo: ApplicationRepository,
    private readonly email: EmailSenderPort,
    private readonly urls: PublicUrlPort,
  ) {}

  async execute(input: SubmitApplicationInput): Promise<Result<ApplicationOutput>> {
    try {
      const agg = await this.repo.findByToken(input.token);
      if (!agg) return [new ApplicationTokenNotFoundError(), null];

      const token = agg.tokens.find((t) => t.token === input.token);
      if (!token) return [new ApplicationTokenNotFoundError(), null];
      if (token.usedAt) return [new ApplicationTokenUsedError(), null];
      if (token.expiresAt && token.expiresAt < new Date()) {
        return [new ApplicationTokenExpiredError(), null];
      }

      const { token: _t, tradeReferences, ...fields } = input;
      agg.submit(token, {
        ...fields,
        tradeReferences: tradeReferences?.map((r) =>
          TradeReference.create({
            businessName: r.businessName,
            engagementStart: toDate(r.engagementStart),
            engagementEnd: toDate(r.engagementEnd),
            contactName: r.contactName ?? null,
            contactEmail: r.contactEmail ?? null,
            contactPosition: r.contactPosition ?? null,
          }),
        ),
      });

      const saved = await this.repo.save(agg);

      if (saved.vendorId) {
        const [emailErr] = await this.email.send({
          to: saved.billingContactEmail ?? saved.recipientEmail ?? '',
          subject: 'Credit application submitted',
          html: buildVendorNotificationEmail(
            saved.props.id,
            this.urls.applicationLink(saved.props.id),
          ),
        });
        if (emailErr) this.logger.error('Failed to send vendor notification email', emailErr);
      }

      return [null, ApplicationMapper.toPublicDto(saved)];
    } catch (err) {
      return [err instanceof Error ? err : new Error('Unknown error'), null];
    }
  }
}

function buildVendorNotificationEmail(applicationId: string, url: string): string {
  return `
    <h2>Application submitted</h2>
    <p>Application <strong>${applicationId}</strong> has been submitted by the recipient.</p>
    <p>Review it here: <a href="${url}">${url}</a></p>
  `;
}

function toDate(v: string | Date | null | undefined): Date | null {
  if (!v) return null;
  return v instanceof Date ? v : new Date(v);
}
