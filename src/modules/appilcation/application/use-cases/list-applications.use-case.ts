import { Result, UseCase } from 'src/shared';
import { ApplicationRepository } from '../../domain';
import { ApplicationMapper } from '../mappers/application.mapper';
import { ApplicationOutput, ListApplicationsInput } from '../dtos';

export type ListApplications = UseCase<ListApplicationsInput, Result<ApplicationOutput[]>>;

export class ListApplicationsUseCase implements ListApplications {
  constructor(private readonly repo: ApplicationRepository) {}

  async execute(input: ListApplicationsInput): Promise<Result<ApplicationOutput[]>> {
    try {
      const items = await this.repo.findAll(input);
      return [null, items.map(ApplicationMapper.toPublicDto)];
    } catch (err) {
      return [err instanceof Error ? err : new Error('Unknown error'), null];
    }
  }
}
