import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { DomainError } from '../../domain/errors/domain-error.base';

/**
 * Global exception filter for DomainError
 * Ensures DomainError properties (code, statusCode, message) are properly serialized in HTTP responses
 */
@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = exception.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse = {
      statusCode: status,
      message: exception.message,
      code: exception.code,
      ...(exception.context && { context: exception.context }),
    };

    response.status(status).json(errorResponse);
  }
}

