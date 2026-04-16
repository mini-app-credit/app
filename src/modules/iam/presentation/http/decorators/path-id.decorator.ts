import { ExecutionContext, ForbiddenException, UnauthorizedException, UseGuards, applyDecorators, CanActivate } from '@nestjs/common';
import { AuthPayload } from './auth.decorator';

export type PathIdCallback = (params: Record<string, string>) => string;

const defaultPathIdExtractor: PathIdCallback = (params) => params.id;

export const PathIdGuard = (idExtractor: PathIdCallback = defaultPathIdExtractor) => {
  return class PathIdGuardImpl implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();
      const user = request.user as AuthPayload | undefined;

      if (!user?.userId) {
        throw new UnauthorizedException('User not authenticated');
      }

      const pathId = idExtractor(request.params);

      if (!pathId) {
        throw new ForbiddenException('ID not found in path');
      }

      if (pathId !== user.userId) {
        throw new ForbiddenException('Access denied: ID mismatch');
      }

      return true;
    }
  };
};

export const RequirePathId = (idExtractor?: PathIdCallback) =>
  applyDecorators(
    UseGuards(PathIdGuard(idExtractor)),
  );
