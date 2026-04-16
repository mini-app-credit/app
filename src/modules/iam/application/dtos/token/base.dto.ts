import { TokenTypePrimitive } from "src/modules/iam/domain";
import { JWTToken, UUID } from "src/shared";

export interface TokenDto {
  id: UUID;
  accountId: UUID;
  userId: UUID;
  type: TokenTypePrimitive;
  value: JWTToken;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}