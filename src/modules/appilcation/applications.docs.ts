import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  CreateApplicationDto,
  DecideApplicationDto,
  SendApplicationDto,
  SubmitApplicationDto,
  UpdateApplicationDto,
} from './applications.dto';

export class ApplicationsDocs {
  static readonly tags = () => applyDecorators(ApiTags('Applications'));

  static readonly create = () =>
    applyDecorators(
      ApiOperation({ summary: 'Create draft application', description: 'Creates a new credit application in draft status' }),
      ApiBody({ type: CreateApplicationDto }),
      ApiResponse({ status: 201, description: 'Application created' }),
      ApiResponse({ status: 400, description: 'Validation error' }),
    );

  static readonly list = () =>
    applyDecorators(
      ApiOperation({ summary: 'List applications', description: 'Returns all applications with optional status/vendorId filter' }),
      ApiQuery({ name: 'status', required: false, enum: ['draft', 'sent', 'submitted', 'approved', 'approved_adjusted', 'rejected'] }),
      ApiQuery({ name: 'vendorId', required: false, type: String }),
      ApiResponse({ status: 200, description: 'List of applications' }),
    );

  static readonly get = () =>
    applyDecorators(
      ApiOperation({ summary: 'Get application by ID' }),
      ApiParam({ name: 'id', type: String, format: 'uuid' }),
      ApiResponse({ status: 200, description: 'Application found' }),
      ApiResponse({ status: 404, description: 'Application not found' }),
    );

  static readonly update = () =>
    applyDecorators(
      ApiOperation({ summary: 'Update application', description: 'Partial update of application fields and trade references' }),
      ApiParam({ name: 'id', type: String, format: 'uuid' }),
      ApiBody({ type: UpdateApplicationDto }),
      ApiResponse({ status: 200, description: 'Application updated' }),
      ApiResponse({ status: 404, description: 'Application not found' }),
    );

  static readonly send = () =>
    applyDecorators(
      ApiOperation({ summary: 'Send application to recipient', description: 'Generates a unique token link and emails the recipient' }),
      ApiParam({ name: 'id', type: String, format: 'uuid' }),
      ApiBody({ type: SendApplicationDto }),
      ApiResponse({ status: 200, description: 'Application sent, email dispatched' }),
      ApiResponse({ status: 404, description: 'Application not found' }),
      ApiResponse({ status: 409, description: 'Invalid status transition' }),
    );

  static readonly decide = () =>
    applyDecorators(
      ApiOperation({ summary: 'Decision on submitted application', description: 'Approve, approve with adjustments, or reject a submitted application' }),
      ApiParam({ name: 'id', type: String, format: 'uuid' }),
      ApiBody({ type: DecideApplicationDto }),
      ApiResponse({ status: 200, description: 'Decision recorded' }),
      ApiResponse({ status: 404, description: 'Application not found' }),
      ApiResponse({ status: 409, description: 'Application is not in submitted status' }),
    );

  static readonly aiSummary = () =>
    applyDecorators(
      ApiOperation({
        summary: 'Generate AI advisory summary',
        description:
          'Uses Google Gemini to draft a short advisory summary for a submitted application. Persists `aiSummary`. Requires GEMINI_API_KEY.',
      }),
      ApiParam({ name: 'id', type: String, format: 'uuid' }),
      ApiResponse({ status: 200, description: 'Summary generated and stored' }),
      ApiResponse({ status: 400, description: 'Not in submitted status or model error' }),
      ApiResponse({ status: 404, description: 'Application not found' }),
      ApiResponse({ status: 503, description: 'GEMINI_API_KEY not configured' }),
    );

  static readonly parsePdf = () =>
    applyDecorators(
      ApiOperation({
        summary: 'Parse credit application PDF',
        description:
          'Upload a PDF file (max 10 MB). Google Gemini extracts application fields and returns them as JSON. Extra fields returned by the model are listed in droppedFields.',
      }),
      ApiConsumes('multipart/form-data'),
      ApiBody({
        schema: {
          type: 'object',
          required: ['file'],
          properties: {
            file: { type: 'string', format: 'binary', description: 'PDF file (max 10 MB)' },
          },
        },
      }),
      ApiResponse({
        status: 200,
        description: 'Parsed fields and any dropped extra fields',
        schema: {
          type: 'object',
          properties: {
            fields: { type: 'object', description: 'Recognised application fields extracted from the PDF' },
            droppedFields: { type: 'array', items: { type: 'string' }, description: 'Extra keys returned by the model that were discarded' },
          },
        },
      }),
      ApiResponse({ status: 400, description: 'Invalid file or parse failure' }),
      ApiResponse({ status: 503, description: 'GEMINI_API_KEY not configured' }),
    );

  static readonly delete = () =>
    applyDecorators(
      ApiOperation({ summary: 'Delete application' }),
      ApiParam({ name: 'id', type: String, format: 'uuid' }),
      ApiResponse({ status: 204, description: 'Application deleted' }),
      ApiResponse({ status: 404, description: 'Application not found' }),
    );
}

export class RecipientDocs {
  static readonly tags = () => applyDecorators(ApiTags('Recipient'));

  static readonly getForm = () =>
    applyDecorators(
      ApiOperation({ summary: 'Get application form by token', description: 'Returns application data for the recipient to fill out' }),
      ApiParam({ name: 'token', type: String, format: 'uuid' }),
      ApiResponse({ status: 200, description: 'Application form data' }),
      ApiResponse({ status: 400, description: 'Token expired or already used' }),
      ApiResponse({ status: 404, description: 'Token not found' }),
    );

  static readonly submit = () =>
    applyDecorators(
      ApiOperation({ summary: 'Submit filled application', description: 'Recipient submits the completed credit application' }),
      ApiParam({ name: 'token', type: String, format: 'uuid' }),
      ApiBody({ type: SubmitApplicationDto }),
      ApiResponse({ status: 200, description: 'Application submitted, vendor notified' }),
      ApiResponse({ status: 400, description: 'Token expired or already used' }),
      ApiResponse({ status: 404, description: 'Token not found' }),
      ApiResponse({ status: 409, description: 'Application not in sent status' }),
    );
}
