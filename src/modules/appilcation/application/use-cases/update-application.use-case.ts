import { Result, UseCase, UUIDIdentifier } from 'src/shared';
import {
  ApplicationNotFoundError,
  ApplicationRepository,
  TradeReference,
} from '../../domain';
import { ApplicationMapper } from '../mappers/application.mapper';
import { ApplicationOutput, UpdateApplicationInput } from '../dtos';

export type UpdateApplication = UseCase<
  { id: string; patch: UpdateApplicationInput },
  Result<ApplicationOutput>
>;

export class UpdateApplicationUseCase implements UpdateApplication {
  constructor(private readonly repo: ApplicationRepository) {}

  async execute(input: {
    id: string;
    patch: UpdateApplicationInput;
  }): Promise<Result<ApplicationOutput>> {
    try {
      const agg = await this.repo.findById(UUIDIdentifier.create(input.id));
      if (!agg) return [new ApplicationNotFoundError(input.id), null];

      agg.patchDraft({
        ...input.patch,
        tradeReferences: input.patch.tradeReferences?.map((r) =>
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
      return [null, ApplicationMapper.toPublicDto(saved)];
    } catch (err) {
      return [err instanceof Error ? err : new Error('Unknown error'), null];
    }
  }
}

function toDate(v: string | Date | null | undefined): Date | null {
  if (!v) return null;
  return v instanceof Date ? v : new Date(v);
}
