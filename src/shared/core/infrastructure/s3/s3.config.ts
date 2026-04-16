import z from "zod";

export const s3ConfigSchema = z.object({
    S3_ENDPOINT: z.string(),
    S3_BUCKET_NAME: z.string(),
    S3_REGION: z.string(),
    S3_ROLE_ARN: z.string().optional(),
    S3_FORCE_PATH_STYLE: z.boolean().optional().default(false),
})

export type S3Config = z.infer<typeof s3ConfigSchema>;

export const loadS3Config = {
    from: {
        env: (env: NodeJS.ProcessEnv) => {
            const config: S3Config = {
                S3_ENDPOINT: env.S3_ENDPOINT!,
                S3_BUCKET_NAME: env.S3_BUCKET_NAME!,
                S3_REGION: env.S3_REGION!,
                S3_ROLE_ARN: env.S3_ROLE_ARN,
                S3_FORCE_PATH_STYLE: env.S3_FORCE_PATH_STYLE === 'true',
            }

            return loadS3Config.from.row(config);
        },
        row: (config: S3Config) => {
            return s3ConfigSchema.parse(config);
        }
    }
}