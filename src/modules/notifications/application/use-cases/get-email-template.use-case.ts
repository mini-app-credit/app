import { Logger } from '@nestjs/common';
import { Result, UseCase, UUIDIdentifier } from 'src/shared';
import { TemplateNotFoundError } from '../../domain/errors';
import { EmailTemplatesRepository } from '../../domain/repositories';
import { EmailTemplate } from '../../domain/entities';

export interface GetEmailTemplateInput {
  id: string;
}

export type GetEmailTemplate = UseCase<GetEmailTemplateInput, Result<EmailTemplate>>;

export class GetEmailTemplateUseCase implements GetEmailTemplate {
  private readonly logger = new Logger(GetEmailTemplateUseCase.name);

  constructor(
    private readonly emailTemplatesRepository: EmailTemplatesRepository,
  ) { }

  async execute(input: GetEmailTemplateInput): Promise<Result<EmailTemplate>> {
    try {
      const id = UUIDIdentifier.create(input.id);
      const template = await this.emailTemplatesRepository.findById(id);
      if (!template) {
        return [new TemplateNotFoundError(input.id), null];
      }
      return [null, template];
    } catch (error) {
      this.logger.error({ err: error, input }, 'Failed to get email template');
      return [error instanceof Error ? error : new Error('Unknown error'), null];
    }
  }
}
