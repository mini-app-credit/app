import { Logger } from '@nestjs/common';
import { Result, UseCase } from 'src/shared';
import { EmailTemplatesRepository } from '../../domain/repositories';
import { ListEmailTemplatesInput, ListEmailTemplatesOutput } from '../dtos/email-template.dto';

export type ListEmailTemplates = UseCase<ListEmailTemplatesInput, Result<ListEmailTemplatesOutput>>;

export class ListEmailTemplatesUseCase implements ListEmailTemplates {
  private readonly logger = new Logger(ListEmailTemplatesUseCase.name);

  constructor(private readonly emailTemplatesRepository: EmailTemplatesRepository) { }

  async execute(input: ListEmailTemplatesInput): Promise<Result<ListEmailTemplatesOutput>> {
    try {
      const limit = Math.min(input.limit ?? 50, 100);
      const offset = input.offset ?? 0;
      const templates = await this.emailTemplatesRepository.list(limit, offset);

      return [null, {
        data: templates.map((template) => template.props),
        meta: {
          pagination: {
            total: templates.length,
            offset,
            limit,
          },
        },
      }];
    } catch (error) {
      this.logger.error({ err: error, input }, 'Failed to list email templates');
      return [error instanceof Error ? error : new Error('Unknown error'), null];
    }
  }
}
