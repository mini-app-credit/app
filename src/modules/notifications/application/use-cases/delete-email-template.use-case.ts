import { Logger } from '@nestjs/common';
import { Result, UseCase, UUIDIdentifier } from 'src/shared';
import { TemplateNotFoundError } from '../../domain/errors';
import { EmailTemplatesRepository } from '../../domain/repositories';
import { DeleteEmailTemplateInput } from '../dtos/email-template.dto';

export type DeleteEmailTemplate = UseCase<DeleteEmailTemplateInput, Result<null>>;

export class DeleteEmailTemplateUseCase implements DeleteEmailTemplate {
  private readonly logger = new Logger(DeleteEmailTemplateUseCase.name);

  constructor(
    private readonly emailTemplatesRepository: EmailTemplatesRepository,
  ) { }

  async execute(input: DeleteEmailTemplateInput): Promise<Result<null>> {
    try {
      const id = UUIDIdentifier.create(input.id);
      const template = await this.emailTemplatesRepository.findById(id);
      if (!template) {
        return [new TemplateNotFoundError(input.id), null];
      }

      await this.emailTemplatesRepository.deleteById(id);

      return [null, null];
    } catch (error) {
      this.logger.error({ err: error, input }, 'Failed to delete email template');
      return [error instanceof Error ? error : new Error('Unknown error'), null];
    }
  }
}
