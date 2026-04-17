import { Inject, Injectable, Logger } from '@nestjs/common';
import { EmailSenderService } from 'src/modules/notifications/application/services/email-sender';
import { NOTIFICATIONS_DI_TOKENS } from 'src/modules/notifications/infrastructure/constants';
import { tradeReferences as tradeReferencesTable } from 'src/shared';
import { ApplicationRepository } from './application.repository';
import {
  CreateApplicationDto,
  DecideApplicationDto,
  ListApplicationsDto,
  SendApplicationDto,
  SubmitApplicationDto,
  UpdateApplicationDto,
} from './applications.dto';

type TradeRefInsert = Omit<typeof tradeReferencesTable.$inferInsert, 'applicationId'>;

function mapTradeRefs(
  refs: { businessName: string; engagementStart?: string | null; engagementEnd?: string | null; contactName?: string | null; contactEmail?: string | null; contactPosition?: string | null }[],
): TradeRefInsert[] {
  return refs.map((r) => ({
    ...r,
    engagementStart: r.engagementStart ? new Date(r.engagementStart) : null,
    engagementEnd: r.engagementEnd ? new Date(r.engagementEnd) : null,
  }));
}
import {
  ApplicationNotFoundError,
  ApplicationTokenExpiredError,
  ApplicationTokenNotFoundError,
  ApplicationTokenUsedError,
  InvalidApplicationTransitionError,
} from './applications.errors';

@Injectable()
export class ApplicationService {
  private readonly logger = new Logger(ApplicationService.name);

  constructor(
    private readonly repo: ApplicationRepository,
    @Inject(NOTIFICATIONS_DI_TOKENS.SERVICES.EMAIL_SENDER)
    private readonly emailSender: EmailSenderService,
  ) {}

  async create(dto: CreateApplicationDto) {
    const { tradeReferences = [], vendorId, ...fields } = dto;

    return this.repo.create(
      {
        ...fields,
        vendorId: vendorId ?? undefined,
        status: 'draft',
      },
      mapTradeRefs(tradeReferences),
    );
  }

  async list(filters: ListApplicationsDto) {
    return this.repo.findAll({
      status: filters.status,
      vendorId: filters.vendorId,
    });
  }

  async get(id: string) {
    const app = await this.repo.findById(id);
    if (!app) throw new ApplicationNotFoundError(id);
    return app;
  }

  async update(id: string, dto: UpdateApplicationDto) {
    const app = await this.repo.findById(id);
    if (!app) throw new ApplicationNotFoundError(id);

    const { tradeReferences, ...fields } = dto;

    await this.repo.update(id, fields);

    if (tradeReferences !== undefined) {
      await this.repo.replaceTradeRefs(id, mapTradeRefs(tradeReferences));
    }

    return this.repo.findById(id);
  }

  async send(id: string, dto: SendApplicationDto) {
    const app = await this.repo.findById(id);
    if (!app) throw new ApplicationNotFoundError(id);

    if (app.status !== 'draft' && app.status !== 'sent') {
      throw new InvalidApplicationTransitionError(app.status, 'sent');
    }

    const TOKEN_TTL_DAYS = 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + TOKEN_TTL_DAYS);

    const tokenRecord = await this.repo.createToken(id, expiresAt);

    await this.repo.update(id, {
      status: 'sent',
      recipientName: dto.recipientName,
      recipientEmail: dto.recipientEmail,
      sentAt: new Date(),
    });

    const recipientLink = `${process.env.API_BASE_URL}/apply/${tokenRecord.token}`;

    this.logger.log(`Recipient link for application ${id}: ${recipientLink}`);

    const [emailError] = await this.emailSender.send({
      to: dto.recipientEmail,
      subject: 'You have received a credit application',
      html: buildRecipientEmail(dto.recipientName, recipientLink),
    });

    if (emailError) {
      this.logger.error('Failed to send recipient email', emailError);
    }

    return this.repo.findById(id);
  }

  async getByToken(token: string) {
    const result = await this.repo.findByToken(token);

    if (!result || !result.application) throw new ApplicationTokenNotFoundError();
    if (result.token.usedAt) throw new ApplicationTokenUsedError();
    if (result.token.expiresAt && result.token.expiresAt < new Date()) {
      throw new ApplicationTokenExpiredError();
    }

    return result.application;
  }

  async submit(token: string, dto: SubmitApplicationDto) {
    const result = await this.repo.findByToken(token);

    if (!result || !result.application) throw new ApplicationTokenNotFoundError();
    if (result.token.usedAt) throw new ApplicationTokenUsedError();
    if (result.token.expiresAt && result.token.expiresAt < new Date()) {
      throw new ApplicationTokenExpiredError();
    }

    const app = result.application;

    if (app.status !== 'sent') {
      throw new InvalidApplicationTransitionError(app.status, 'submitted');
    }

    const { tradeReferences = [], ...fields } = dto;

    await this.repo.update(app.id, {
      ...fields,
      status: 'submitted',
      submittedAt: new Date(),
    });

    await this.repo.replaceTradeRefs(app.id, mapTradeRefs(tradeReferences));
    await this.repo.markTokenUsed(token);

    const updated = await this.repo.findById(app.id);

    if (app.vendorId) {
      const vendorLink = `${process.env.API_BASE_URL}/applications/${app.id}`;
      const [emailError] = await this.emailSender.send({
        to: app.billingContactEmail ?? app.recipientEmail ?? '',
        subject: 'Credit application submitted',
        html: buildVendorNotificationEmail(app.id, vendorLink),
      });

      if (emailError) {
        this.logger.error('Failed to send vendor notification email', emailError);
      }
    }

    return updated;
  }

  async decide(id: string, dto: DecideApplicationDto) {
    const app = await this.repo.findById(id);
    if (!app) throw new ApplicationNotFoundError(id);

    if (app.status !== 'submitted') {
      throw new InvalidApplicationTransitionError(app.status, dto.action);
    }

    const statusMap: Record<string, 'approved' | 'approved_adjusted' | 'rejected'> = {
      approve: 'approved',
      approve_adjusted: 'approved_adjusted',
      reject: 'rejected',
    };

    await this.repo.update(id, {
      status: statusMap[dto.action],
      decisionAmount: dto.decisionAmount ?? undefined,
      decisionTerm: dto.decisionTerm ?? undefined,
      rejectionReason: dto.rejectionReason ?? undefined,
      decidedAt: new Date(),
    });

    return this.repo.findById(id);
  }

  async delete(id: string) {
    const app = await this.repo.findById(id);
    if (!app) throw new ApplicationNotFoundError(id);
    await this.repo.delete(id);
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

function buildVendorNotificationEmail(applicationId: string, link: string): string {
  return `
    <h2>Application submitted</h2>
    <p>Application <strong>${applicationId}</strong> has been submitted by the recipient.</p>
    <p>Review it here: <a href="${link}">${link}</a></p>
  `;
}
