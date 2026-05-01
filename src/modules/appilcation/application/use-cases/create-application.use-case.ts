import { Result, UseCase } from 'src/shared';
import {
  ApplicationAggregate,
  ApplicationRepository,
  TradeReference,
} from '../../domain';
import { ApplicationMapper } from '../mappers/application.mapper';
import { ApplicationOutput, CreateApplicationInput } from '../dtos';

export type CreateApplication = UseCase<CreateApplicationInput, Result<ApplicationOutput>>;

export class CreateApplicationUseCase implements CreateApplication {
  constructor(private readonly repo: ApplicationRepository) {}

  async execute(input: CreateApplicationInput): Promise<Result<ApplicationOutput>> {
    try {
      const tradeReferences = (input.tradeReferences ?? []).map((r) =>
        TradeReference.create({
          businessName: r.businessName,
          engagementStart: toDate(r.engagementStart),
          engagementEnd: toDate(r.engagementEnd),
          contactName: r.contactName ?? null,
          contactEmail: r.contactEmail ?? null,
          contactPosition: r.contactPosition ?? null,
        }),
      );

      const agg = ApplicationAggregate.create({ ...input, tradeReferences });
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
