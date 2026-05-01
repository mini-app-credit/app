import { Result, UseCase, UUIDIdentifier } from 'src/shared';
import { ApplicationNotFoundError, ApplicationRepository } from '../../domain';

export type DeleteApplication = UseCase<{ id: string }, Result<null>>;

export class DeleteApplicationUseCase implements DeleteApplication {
  constructor(private readonly repo: ApplicationRepository) {}

  async execute(input: { id: string }): Promise<Result<null>> {
    try {
      const id = UUIDIdentifier.create(input.id);
      const agg = await this.repo.findById(id);
      if (!agg) return [new ApplicationNotFoundError(input.id), null];
      await this.repo.delete(id);
      return [null, null];
    } catch (err) {
      return [err instanceof Error ? err : new Error('Unknown error'), null];
    }
  }
}
