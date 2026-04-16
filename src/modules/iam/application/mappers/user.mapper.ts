import { UUIDIdentifier } from 'src/shared';
import { User } from '../../domain/aggregates/user.aggregate';
import { PublicUserDto, UserDto } from '../dtos/user/base.dto';
import { AccountMapper } from './account.mapper';

export const UserMapper = {
  toDto(user: User): UserDto {
    return {
      id: user.id.toString(),
      unitAmount: user.unitAmount,
      accounts: user.accounts.map(AccountMapper.toDto),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },

  toPublicDto(user: User): PublicUserDto {
    return {
      id: user.id.toString(),
      unitAmount: user.unitAmount,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },

  toDomain(dto: UserDto): User {
    return User.restore({
      id: UUIDIdentifier.create(dto.id),
      unitAmount: dto.unitAmount,
      accounts: dto.accounts?.map(AccountMapper.toDomain) ?? [],
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }
};
