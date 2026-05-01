import { Logger } from '@nestjs/common';
import { Result, UseCase, UUIDIdentifier } from 'src/shared';
import { ApplicationNotFoundError, ApplicationRepository } from '../../domain';
import { AiSummarizerPort } from '../ports';
import { ApplicationMapper } from '../mappers/application.mapper';
import { ApplicationOutput } from '../dtos';

export type GenerateAiSummary = UseCase<{ id: string }, Result<ApplicationOutput>>;

export class GenerateAiSummaryUseCase implements GenerateAiSummary {
  private readonly logger = new Logger(GenerateAiSummaryUseCase.name);

  constructor(
    private readonly repo: ApplicationRepository,
    private readonly ai: AiSummarizerPort,
  ) {}

  async execute(input: { id: string }): Promise<Result<ApplicationOutput>> {
    try {
      const agg = await this.repo.findById(UUIDIdentifier.create(input.id));
      if (!agg) return [new ApplicationNotFoundError(input.id), null];

      const p = agg.props;
      const summary = await this.ai.summarize({
        companyName: p.companyName,
        dba: p.dba,
        country: p.country,
        website: p.website,
        revenueBand: p.revenueBand,
        creditAmountRequested: p.creditRequested?.value.amount ?? null,
        creditTermRequested: p.creditTermRequested,
        billingContactName: p.billingContactName,
        billingContactEmail: p.billingContactEmail,
        tradeReferences: p.tradeReferences.map((r) => r.value),
      });

      agg.attachAiSummary(summary);
      const saved = await this.repo.save(agg);
      return [null, ApplicationMapper.toPublicDto(saved)];
    } catch (err) {
      this.logger.error('AI summary failed', err);
      return [err instanceof Error ? err : new Error('Unknown error'), null];
    }
  }
}
