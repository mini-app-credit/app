import { createZodDto } from '@anatine/zod-nestjs';
import { z, paginationQuerySchema, metaSchema } from 'src/shared';

export const createEmailTemplateBodySchema = z.object({
  eventName: z.string().min(1).max(255),
  templatePath: z.string().min(1).max(255),
});

export class CreateEmailTemplateBodyDto extends createZodDto(createEmailTemplateBodySchema) { }

export const updateEmailTemplateBodySchema = z.object({
  eventName: z.string().min(1).max(255).optional(),
  templatePath: z.string().min(1).max(255).optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: 'At least one field is required',
});

export class UpdateEmailTemplateBodyDto extends createZodDto(updateEmailTemplateBodySchema) { }

export const emailTemplateSchema = z.object({
  id: z.string().uuid(),
  eventName: z.string(),
  templatePath: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export class EmailTemplateResponseDto extends createZodDto(emailTemplateSchema) { }

export const listEmailTemplatesQuerySchema = paginationQuerySchema;
export class ListEmailTemplatesQueryDto extends createZodDto(listEmailTemplatesQuerySchema) { }

export const listEmailTemplatesResponseSchema = z.object({
  data: z.array(emailTemplateSchema),
  meta: metaSchema,
});

export class ListEmailTemplatesResponseDto extends createZodDto(listEmailTemplatesResponseSchema) { }
