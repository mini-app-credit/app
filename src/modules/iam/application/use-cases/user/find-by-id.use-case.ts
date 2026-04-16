import { Result, UseCase, UUIDIdentifier } from "src/shared";
import { FindUserByIdInput, FindUserByIdOutput } from "../../dtos";
import { UserNotFoundError, UsersRepository } from "src/modules/iam/domain";
import { UserMapper } from "../../mappers";

export type FindUserById = UseCase<FindUserByIdInput, Result<FindUserByIdOutput>>;

export class FindUserByIdUseCase implements FindUserById {
  constructor(private readonly usersRepository: UsersRepository) { }

  async execute(input: FindUserByIdInput): Promise<Result<FindUserByIdOutput>> {
    try {
      const user = await this.usersRepository.findById(UUIDIdentifier.create(input.userId));

      if (!user) {
        return [new UserNotFoundError(input.userId), null];
      }

      return [null, UserMapper.toPublicDto(user)];
    } catch (error) {
      return [error instanceof Error ? error : new Error('Unknown error'), null];
    }
  }
}
