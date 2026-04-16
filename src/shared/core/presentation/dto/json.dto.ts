import { z } from 'zod/v4';

export const jsonValueSchema: z.ZodType<JSONValue> = z.lazy(() =>
  z.union([
    z.null(),
    z.string(),
    z.number(),
    z.boolean(),
    z.record(z.string(), jsonValueSchema),
    z.array(jsonValueSchema),
  ]),
);

export type JSONValue =
  | null
  | string
  | number
  | boolean
  | { [k: string]: JSONValue }
  | JSONValue[];