import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UUIDIdentifier } from '../../domain';

export type ProjectIdExtractor = (params: Record<string, string>, body: Record<string, unknown>) => string | null;

export const PROJECT_SCOPED_METADATA = 'project-scoped:extractor';

export const setProjectScopedMetadata = (extractor: ProjectIdExtractor) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(PROJECT_SCOPED_METADATA, extractor, descriptor.value);
    return descriptor;
  };
};

interface ProjectAccessChecker {
  findByUserAndProject(userId: UUIDIdentifier, projectId: UUIDIdentifier): Promise<unknown | null>;
}

const USER_PROJECTS_REPOSITORY = Symbol.for('USER_PROJECTS_REPOSITORY');
const defaultExtractor: ProjectIdExtractor = (params) => params.projectId ?? null;

@Injectable()
export class ProjectAccessGuard implements CanActivate {
  private readonly logger = new Logger(ProjectAccessGuard.name);

  constructor(
    private readonly reflector: Reflector,
    @Inject(USER_PROJECTS_REPOSITORY)
    private readonly userProjectsRepository: ProjectAccessChecker,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const handler = context.getHandler();
    const extractor = this.reflector.get<ProjectIdExtractor>(PROJECT_SCOPED_METADATA, handler) ?? defaultExtractor;

    const projectId = extractor(request.params, request.body);

    if (!projectId) {
      this.logger.warn({ userId: user.userId }, 'ProjectAccessGuard: projectId not found in request');
      throw new ForbiddenException('Project ID is required');
    }

    const userProject = await this.userProjectsRepository.findByUserAndProject(
      UUIDIdentifier.create(user.userId),
      UUIDIdentifier.create(projectId),
    );

    if (!userProject) {
      throw new ForbiddenException('Access denied: no access to this project');
    }

    return true;
  }
}
