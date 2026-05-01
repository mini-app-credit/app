import { Result, UseCase, UUIDIdentifier } from 'src/shared';
import { ApplicationNotFoundError, ApplicationRepository } from '../../domain';
import { ApplicationMapper } from '../mappers/application.mapper';
import { ApplicationOutput } from '../dtos';

export type GetApplication = UseCase<{ id: string }, Result<ApplicationOutput>>;

export class GetApplicationUseCase implements GetApplication {
  constructor(private readonly repo: ApplicationRepository) {}

  async execute(input: { id: string }): Promise<Result<ApplicationOutput>> {
    try {
      const agg = await this.repo.findById(UUIDIdentifier.create(input.id));
      if (!agg) return [new ApplicationNotFoundError(input.id), null];
      return [null, ApplicationMapper.toPublicDto(agg)];
    } catch (err) {
      return [err instanceof Error ? err : new Error('Unknown error'), null];
    }
  }
}
