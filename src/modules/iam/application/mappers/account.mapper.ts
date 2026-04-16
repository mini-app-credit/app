import { UUIDIdentifier } from "src/shared";
import { Account, AccountMeta, AccountSubject, Provider } from "../../domain";
import { AccountDto } from "../dtos/auth/base.dto";

export const AccountMapper = {
  toDto(account: Account): AccountDto {
    return {
      id: account.id.toString(),
      userId: account.userId.value,
      provider: account.provider.asString,
      subject: account.subject.asString,
      meta: account.meta.toJSON(),
      verifiedAt: account.verifiedAt,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  },

  toDomain(dto: AccountDto): Account {
    return Account.restore({
      id: UUIDIdentifier.create(dto.id),
      userId: UUIDIdentifier.create(dto.userId),
      provider: Provider.create(dto.provider),
      subject: AccountSubject.create(dto.subject),
      meta: AccountMeta.create(dto.meta),
      verifiedAt: dto.verifiedAt,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  },
};