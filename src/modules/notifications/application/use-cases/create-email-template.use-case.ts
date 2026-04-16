import { Logger } from '@nestjs/common';
import { Result, UseCase } from 'src/shared';
import { EmailTemplate } from '../../domain/entities';
import { TemplateAlreadyExistsError } from '../../domain/errors';
import { EmailTemplatesRepository } from '../../domain/repositories';
import { CreateEmailTemplateInput } from '../dtos/email-template.dto';

export type CreateEmailTemplate = UseCase<CreateEmailTemplateInput, Result<EmailTemplate>>;

export class CreateEmailTemplateUseCase implements CreateEmailTemplate {
  private readonly logger = new Logger(CreateEmailTemplateUseCase.name);

  constructor(
    private readonly emailTemplatesRepository: EmailTemplatesRepository,
  ) { }

  async execute(input: CreateEmailTemplateInput): Promise<Result<EmailTemplate>> {
    try {
      const exists = await this.emailTemplatesRepository.findByEventName(input.eventName);
      if (exists) {
        return [new TemplateAlreadyExistsError(input.eventName), null];
      }

      const template = EmailTemplate.create({
        eventName: input.eventName,
        templatePath: input.templatePath,
      });

      const created = await this.emailTemplatesRepository.insert(template);

      return [null, created];
    } catch (error) {
      this.logger.error({ err: error, input }, 'Failed to create email template');
      return [error instanceof Error ? error : new Error('Unknown error'), null];
    }
  }
}
