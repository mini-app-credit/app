import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  CreateEmailTemplateBodyDto,
  EmailTemplateResponseDto,
  ListEmailTemplatesResponseDto,
  UpdateEmailTemplateBodyDto,
} from '../dtos';

export class EmailTemplatesDocs {
  static readonly tags = () => applyDecorators(
    ApiTags('Notifications'),
  );

  static readonly create = () => applyDecorators(
    ApiTags('Notifications'),
    ApiOperation({
      summary: 'Create email template mapping',
      description:
        'Maps a domain event name to a React Email template path. Used when processing JetStream notification events.',
    }),
    ApiBody({ type: CreateEmailTemplateBodyDto }),
    ApiResponse({ status: 201, type: EmailTemplateResponseDto }),
    ApiResponse({ status: 400, description: 'Validation error' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 409, description: 'Mapping for this event name already exists' }),
  );

  static readonly list = () => applyDecorators(
    ApiTags('Notifications'),
    ApiOperation({
      summary: 'List email template mappings',
      description: 'Returns a paginated list of all event name → template mappings.',
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Page size (default from pagination config)',
    }),
    ApiQuery({
      name: 'offset',
      required: false,
      type: Number,
      description: 'Items to skip',
    }),
    ApiResponse({ status: 200, type: ListEmailTemplatesResponseDto }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );

  static readonly getById = () => applyDecorators(
    ApiTags('Notifications'),
    ApiOperation({
      summary: 'Get email template mapping by ID',
      description: 'Returns a single event name → template mapping by its UUID.',
    }),
    ApiParam({ name: 'id', type: String, format: 'uuid' }),
    ApiResponse({ status: 200, type: EmailTemplateResponseDto }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Template not found' }),
  );

  static readonly update = () => applyDecorators(
    ApiTags('Notifications'),
    ApiOperation({
      summary: 'Update email template mapping',
      description: 'Partial update; at least one of eventName or templatePath must be provided.',
    }),
    ApiParam({ name: 'id', type: String, format: 'uuid' }),
    ApiBody({ type: UpdateEmailTemplateBodyDto }),
    ApiResponse({ status: 200, type: EmailTemplateResponseDto }),
    ApiResponse({ status: 400, description: 'Validation error or empty body' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Template not found' }),
    ApiResponse({ status: 409, description: 'Conflict (e.g. event name taken by another row)' }),
  );

  static readonly delete = () => applyDecorators(
    ApiTags('Notifications'),
    ApiOperation({
      summary: 'Delete email template mapping',
      description: 'Removes the mapping; the worker will skip notifications for that event until re-created.',
    }),
    ApiParam({ name: 'id', type: String, format: 'uuid' }),
    ApiResponse({ status: 204, description: 'Deleted' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Template not found' }),
  );
}
