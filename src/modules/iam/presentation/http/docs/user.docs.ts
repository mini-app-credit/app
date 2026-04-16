import { applyDecorators } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { UserParamsDto } from "../dtos";

export class UserDocs {
  static readonly tags = () => applyDecorators(
    ApiTags('Users'),
  );
  static readonly findUserById = () => applyDecorators(
    ApiOperation({
      summary: 'Find user by id',
      description: 'Get user information by user ID',
    }),
    ApiResponse({
      status: 200,
      description: 'User found successfully',
      type: UserParamsDto,
    }),
    ApiResponse({
      status: 404,
      description: 'User not found',
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - invalid user ID format',
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
    }),
  );
}
