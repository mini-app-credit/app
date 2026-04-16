import z from "zod";

export const amplitudeConfigSchema = z.object({
  AMPLITUDE_API_KEY: z.string(),
});

export type AmplitudeConfig = z.infer<typeof amplitudeConfigSchema>;

export const loadAmplitudeConfig = {
  from: {
    env: (env: NodeJS.ProcessEnv) => {
      const cfg: AmplitudeConfig = {
        AMPLITUDE_API_KEY: env.AMPLITUDE_API_KEY!,
      }
      return loadAmplitudeConfig.from.row(cfg);
    },
    row: (cfg: AmplitudeConfig) => {
      return amplitudeConfigSchema.parse(cfg);
    },
  },
};
