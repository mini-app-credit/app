import { extendApi, extendZodWithOpenApi, generateSchema } from '@anatine/zod-openapi';
import { createZodDto } from '@anatine/zod-nestjs';
import {z} from 'zod';

extendZodWithOpenApi(z);

export { extendApi, generateSchema, z, createZodDto }