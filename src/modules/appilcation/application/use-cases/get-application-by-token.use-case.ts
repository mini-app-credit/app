import { Result, UseCase } from 'src/shared';
import {
  ApplicationRepository,
  ApplicationTokenExpiredError,
  ApplicationTokenNotFoundError,
  ApplicationTokenUsedError,
} from '../../domain';
import { ApplicationMapper } from '../mappers/application.mapper';
import { ApplicationOutput } from '../dtos';

export type GetApplicationByToken = UseCase<{ token: string }, Result<ApplicationOutput>>;

export class GetApplicationByTokenUseCase implements GetApplicationByToken {
  constructor(private readonly repo: ApplicationRepository) {}

  async execute(input: { token: string }): Promise<Result<ApplicationOutput>> {
    try {
      const agg = await this.repo.findByToken(input.token);
      if (!agg) return [new ApplicationTokenNotFoundError(), null];

      const token = agg.tokens.find((t) => t.token === input.token);
      if (!token) return [new ApplicationTokenNotFoundError(), null];
      if (token.usedAt) return [new ApplicationTokenUsedError(), null];
      if (token.expiresAt && token.expiresAt < new Date()) {
        return [new ApplicationTokenExpiredError(), null];
      }

      return [null, ApplicationMapper.toPublicDto(agg)];
    } catch (err) {
      return [err instanceof Error ? err : new Error('Unknown error'), null];
    }
  }
}
