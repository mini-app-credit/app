import { UUIDIdentifier } from "src/shared";
import { Token, TokenType } from "../../domain";
import { TokenDto } from "../dtos/token";

export const TokenMapper = {
  toDto(token: Token): TokenDto {
    return {
      id: token.id.toString(),
      userId: token.userId.toString(),
      accountId: token.accountId.toString(),
      type: token.type.toString(),
      value: token.value,
      expiresAt: token.expiresAt,
      createdAt: token.createdAt,
      updatedAt: token.updatedAt,
    };
  },

  toDomain(dto: TokenDto): Token {
    return Token.restore({
      id: UUIDIdentifier.create(dto.id),
      userId: UUIDIdentifier.create(dto.userId),
      accountId: UUIDIdentifier.create(dto.accountId),
      type: TokenType.create(dto.type),
      value: dto.value,
      expiresAt: dto.expiresAt,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }
};
