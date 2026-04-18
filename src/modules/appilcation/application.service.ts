import { GoogleGenerativeAI } from '@google/generative-ai';
import { Inject, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { EmailSenderService } from 'src/modules/notifications/application/services/email-sender';
import { NOTIFICATIONS_DI_TOKENS } from 'src/modules/notifications/infrastructure/constants';
import { BadRequestError, tradeReferences as tradeReferencesTable } from 'src/shared';
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

export type ParsedApplicationFields = {
  companyName?: string;
  dba?: string;
  country?: string;
  website?: string;
  revenueBand?: 'under_1m' | '1m_10m' | '10m_100m' | '100m_250m' | '250m_500m' | 'over_500m';
  creditAmountRequested?: number;
  creditTermRequested?: 'net_10' | 'net_20' | 'net_30';
  billingContactName?: string;
  billingContactEmail?: string;
  tradeReferences?: {
    businessName: string;
    engagementStart?: string | null;
    engagementEnd?: string | null;
    contactName?: string | null;
    contactEmail?: string | null;
    contactPosition?: string | null;
  }[];
};

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

/** User-facing app origin for links in emails (no env — local dev). */
const PUBLIC_APP_BASE_URL = 'http://localhost:4000' as const;

@Injectable()
export class ApplicationService {
  private readonly logger = new Logger(ApplicationService.name);

  constructor(
    private readonly repo: ApplicationRepository,
    @Inject(NOTIFICATIONS_DI_TOKENS.SERVICES.EMAIL_SENDER)
    private readonly emailSender: EmailSenderService,
  ) { }

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

    const recipientLink = `${PUBLIC_APP_BASE_URL}/apply/${tokenRecord.token}`;

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
      const [emailError] = await this.emailSender.send({
        to: app.billingContactEmail ?? app.recipientEmail ?? '',
        subject: 'Credit application submitted',
        html: buildVendorNotificationEmail(app.id),
      });

      if (emailError) {
        this.logger.error('Failed to send vendor notification email', emailError);
      }
    }

    return updated;
  }

  async generateAiSummary(id: string) {
    const app = await this.repo.findById(id);
    if (!app) throw new ApplicationNotFoundError(id);

    if (app.status !== 'submitted') {
      throw new BadRequestError('AI summary is only available for applications in submitted status');
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'GEMINI_API_KEY is not set — add it to the API environment to enable AI summaries',
      );
    }

    const payload = {
      companyName: app.companyName,
      dba: app.dba,
      country: app.country,
      website: app.website,
      revenueBand: app.revenueBand,
      creditAmountRequested: app.creditAmountRequested,
      creditTermRequested: app.creditTermRequested,
      billingContactName: app.billingContactName,
      billingContactEmail: app.billingContactEmail,
      tradeReferences: (app.tradeReferences ?? []).map((r) => ({
        businessName: r.businessName,
        engagementStart: r.engagementStart,
        engagementEnd: r.engagementEnd,
        contactName: r.contactName,
        contactEmail: r.contactEmail,
        contactPosition: r.contactPosition,
      })),
    };

    try {
      const modelName =
        process.env.GEMINI_MODEL?.trim() || 'gemini-3-flash-preview';
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction:
          'You are a credit analyst assistant. Given JSON application data, write a concise advisory summary (4–8 sentences) for the vendor: key strengths, risks, and whether to lean toward approve, reject, or approve with adjusted terms. This is advisory only; the vendor makes the final decision. Plain English, no markdown headings.',
      });

      const result = await model.generateContent(
        `Application data (JSON):\n${JSON.stringify(payload, null, 2)}`,
      );

      const text = result.response.text()?.trim();
      if (!text) {
        throw new BadRequestError('Empty response from the language model');
      }

      await this.repo.update(id, { aiSummary: text });
    } catch (err) {
      if (err instanceof BadRequestError || err instanceof ApplicationNotFoundError) {
        throw err;
      }
      if (err instanceof ServiceUnavailableException) {
        throw err;
      }
      this.logger.error('Gemini summary failed', err);
      throw new BadRequestError(
        err instanceof Error ? err.message : 'Failed to generate AI summary',
      );
    }

    return this.repo.findById(id);
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

  async parsePdf(fileBuffer: Buffer): Promise<{ fields: ParsedApplicationFields; droppedFields: string[] }> {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'GEMINI_API_KEY is not set — add it to the API environment to enable PDF parsing',
      );
    }

    const KNOWN_KEYS: (keyof ParsedApplicationFields)[] = [
      'companyName', 'dba', 'country', 'website', 'revenueBand',
      'creditAmountRequested', 'creditTermRequested',
      'billingContactName', 'billingContactEmail', 'tradeReferences',
    ];

    try {
      const modelName = process.env.GEMINI_MODEL?.trim() || 'gemini-3-flash-preview';
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName });

      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: fileBuffer.toString('base64'),
          },
        },
        {
          text:
            'Extract credit application fields from this PDF. Return ONLY valid JSON with these exact keys: ' +
            'companyName, dba, country, website, revenueBand (one of: under_1m|1m_10m|10m_100m|100m_250m|250m_500m|over_500m), ' +
            'creditAmountRequested (number), creditTermRequested (one of: net_10|net_20|net_30), ' +
            'billingContactName, billingContactEmail, ' +
            'tradeReferences (array of: businessName, engagementStart, engagementEnd, contactName, contactEmail, contactPosition). ' +
            'If a field is not found, omit it. Do not include any fields outside this list.',
        },
      ]);

      const raw = result.response.text()?.trim();
      if (!raw) {
        throw new BadRequestError('Empty response from the language model');
      }

      const jsonString = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
      const parsed: Record<string, unknown> = JSON.parse(jsonString);

      const fields: ParsedApplicationFields = {};
      const droppedFields: string[] = [];

      for (const [key, value] of Object.entries(parsed)) {
        if ((KNOWN_KEYS as string[]).includes(key)) {
          (fields as Record<string, unknown>)[key] = value;
        } else {
          droppedFields.push(key);
        }
      }

      if (Array.isArray(fields.tradeReferences)) {
        fields.tradeReferences = fields.tradeReferences.slice(0, 2);
      }

      return { fields, droppedFields };
    } catch (err) {
      if (err instanceof BadRequestError || err instanceof ServiceUnavailableException) {
        throw err;
      }
      this.logger.error('Gemini PDF parsing failed', err);
      throw new BadRequestError(
        err instanceof Error ? err.message : 'Failed to parse PDF',
      );
    }
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

function buildVendorNotificationEmail(applicationId: string): string {
  const url = `${PUBLIC_APP_BASE_URL}/applications/${applicationId}`;
  return `
    <h2>Application submitted</h2>
    <p>Application <strong>${applicationId}</strong> has been submitted by the recipient.</p>
    <p>Review it here: <a href="${url}">${url}</a></p>
  `;
}
