import { UUID } from "src/shared";
import { AccountDto } from "../auth/base.dto";

export interface PublicUserDto {
  id: UUID;
  unitAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDto extends PublicUserDto {
  accounts?: AccountDto[];
}