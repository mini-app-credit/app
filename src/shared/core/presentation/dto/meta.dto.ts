import { extendApi } from '@anatine/zod-openapi';
import z from "zod";
import { paginationMetaSchema } from "./pagination.dto";
import { createZodDto } from '@anatine/zod-nestjs';

export const metaSchema = extendApi(z.object({ pagination: paginationMetaSchema }), { title: 'Metadata', description: 'Contains metadata such as pagination' })

export class MetaDto extends createZodDto(metaSchema) {}