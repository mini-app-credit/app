import { PublicUserDto } from "./base.dto";

export interface FindUserByIdInput {
  userId: string;
}

export type FindUserByIdOutput = PublicUserDto