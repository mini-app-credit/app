import { applyDecorators, UseGuards } from '@nestjs/common';
import { ProjectAccessGuard, ProjectIdExtractor, setProjectScopedMetadata } from '../guards';

export const ProjectScoped = (extractor?: ProjectIdExtractor) => {
  const decorators = [UseGuards(ProjectAccessGuard)];

  if (extractor) {
    decorators.push(setProjectScopedMetadata(extractor) as ClassDecorator & MethodDecorator);
  }

  return applyDecorators(...decorators);
};
