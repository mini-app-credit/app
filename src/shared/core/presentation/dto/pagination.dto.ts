import z from "zod";
import { extendApi } from '@anatine/zod-openapi';
import { createZodDto } from "@anatine/zod-nestjs";

export const paginationQuerySchema = extendApi(z.object({
    offset: z.coerce.number().min(0).describe('Number of records skipped').default(0),
    limit: z.coerce.number().min(1).max(100).default(1).describe('Maximum number of records returned'),
}), { title: 'Pagination Query', description: 'Query for paginate' })

export const paginationMetaSchema = extendApi(z.object({
    total: z.coerce.number().describe('Total number of records available')
}).merge(paginationQuerySchema), { title: 'Pagination meta', description: 'Pagination metadata' });

export class PaginationQueryDto extends createZodDto(paginationQuerySchema) { };
export class PaginationMetaDto extends createZodDto(paginationMetaSchema) { };

export const cursorQuerySchema = extendApi(z.object({
    cursor: z.string().describe('Cursor for pagination').optional(),
    limit: z.coerce.number().min(1).max(100).default(1).describe('Maximum number of records returned'),
}), { title: 'Cursor Query', description: 'Query for cursor pagination' });

export class CursorQueryDto extends createZodDto(cursorQuerySchema) { };