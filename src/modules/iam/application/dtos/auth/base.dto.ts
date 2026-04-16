import { AccountMetaProps, ProviderPrimitive, SubjectPrimitive } from "src/modules/iam/domain";
import { UUID } from "src/shared";

export interface AccountDto {
  id: UUID;
  userId: UUID;
  provider: ProviderPrimitive;
  subject: SubjectPrimitive;
  meta: AccountMetaProps;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}