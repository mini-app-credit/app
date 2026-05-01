import { Result, UseCase, UUIDIdentifier } from 'src/shared';
import { ApplicationNotFoundError, ApplicationRepository } from '../../domain';
import { ApplicationMapper } from '../mappers/application.mapper';
import { ApplicationOutput, DecideApplicationInput } from '../dtos';

export type DecideApplication = UseCase<DecideApplicationInput, Result<ApplicationOutput>>;

export class DecideApplicationUseCase implements DecideApplication {
  constructor(private readonly repo: ApplicationRepository) {}

  async execute(input: DecideApplicationInput): Promise<Result<ApplicationOutput>> {
    try {
      const agg = await this.repo.findById(UUIDIdentifier.create(input.id));
      if (!agg) return [new ApplicationNotFoundError(input.id), null];

      agg.decide({
        action: input.action,
        decisionAmount: input.decisionAmount ?? null,
        decisionTerm: input.decisionTerm ?? null,
        rejectionReason: input.rejectionReason ?? null,
      });

      const saved = await this.repo.save(agg);
      return [null, ApplicationMapper.toPublicDto(saved)];
    } catch (err) {
      return [err instanceof Error ? err : new Error('Unknown error'), null];
    }
  }
}
