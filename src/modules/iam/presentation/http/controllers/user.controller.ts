import { Controller, Get, Inject, Param, ParseUUIDPipe } from "@nestjs/common";
import { FindUserById } from "src/modules/iam/application/use-cases";
import { IAM_DI_TOKENS } from "src/modules/iam/infrastructure";
import { Docs } from "../docs";
import { UserParamsDto } from "../dtos";
import { RequireAuth, RequirePathId } from "../decorators";

@Controller('users')
@Docs.user.tags()
export class UserController {
  constructor(
    @Inject(IAM_DI_TOKENS.USE_CASES.FIND_USER_BY_ID) private readonly findUserByIdUseCase: FindUserById,
  ) { }

  @Get(':userId')
  @RequirePathId((params) => params.userId)
  @RequireAuth('jwt-access')
  @Docs.user.findUserById()
  async findUserById(@Param('userId', ParseUUIDPipe) userId: string): Promise<UserParamsDto> {
    const [error, result] = await this.findUserByIdUseCase.execute({ userId });

    if (error) {
      throw error;
    }

    return result;
  }
}