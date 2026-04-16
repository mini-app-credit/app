import { z } from 'zod';

const envBoolean = z.preprocess((val: unknown) => {
    if (val === true || val === 'true' || val === '1') return true;
    return false;
}, z.boolean());

export const smtpConfigSchema = z.object({
    SMTP_HOST: z.string().default(''),
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_SECURE: envBoolean,
    SMTP_USER: z.string().default(''),
    SMTP_PASSWORD: z.string().default(''),
    SMTP_FROM: z.string().email(),
});

export type SmtpConfig = z.infer<typeof smtpConfigSchema>;
