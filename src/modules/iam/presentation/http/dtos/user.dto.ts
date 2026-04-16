import { z, createZodDto, metaSchema, extendApi } from "src/shared"

export const userParamsSchema = z.object({
  id: z.string().uuid().openapi({
    description: 'The id of the user',
    example: '123e4567-e89b-12d3-a456-426614174000',
  }),
  unitAmount: z.number().openapi({
    description: 'User credits amount',
    example: 10000,
  }),
  createdAt: z.date().openapi({
    description: 'The date and time the user was created',
    example: '2021-01-01T00:00:00.000Z',
  }),
  updatedAt: z.date().openapi({
    description: 'The date and time the user was updated',
    example: '2021-01-01T00:00:00.000Z',
  }),
}).openapi({
  description: 'The user',
  example: {
    id: '123e4567-e89b-12d3-a456-426614174000',
    unitAmount: 10000,
    createdAt: '2021-01-01T00:00:00.000Z',
    updatedAt: '2021-01-01T00:00:00.000Z',
  },
});

export class UserParamsDto extends createZodDto(userParamsSchema) { }

export const listUsersResponseSchema = extendApi(metaSchema.extend({
  data: z.array(userParamsSchema),
}), { title: 'List users response', description: 'List users response' });

export class ListUsersResponseDto extends createZodDto(listUsersResponseSchema) { }
