import { patchNestjsSwagger } from '@anatine/zod-nestjs';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export class Swagger {
  private static readonly config = {
    title: 'Legaltech Document Analyzer',
    description: 'Legaltech Document Analyzer',
    version: '0.0.1',
    tags: [],
  };

  static apply(app: INestApplication) {
    const documentConfig = new DocumentBuilder()
      .setTitle(this.config.title)
      .setDescription(this.config.description)
      .setVersion(this.config.version)
      .addTag(
        'Notifications',
        'Email template mappings: link domain event names to React Email templates for outbound mail',
      )
      .addTag('Applications', 'Vendor CRUD and lifecycle management for credit applications')
      .addTag('Recipient', 'Public endpoints for recipients to view and submit credit application forms')
      .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Bearer token for authentication',
        in: 'header',
      }, 'jwt-access')
      .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Bearer token for authentication',
        in: 'header',
      }, 'jwt-refresh')
      .build();

    patchNestjsSwagger();

    const document = SwaggerModule.createDocument(app, documentConfig);

    SwaggerModule.setup('docs', app, document);
  }
}
