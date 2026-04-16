import { PinoLogger } from 'nestjs-pino';
import { z } from 'zod';
import { Result, withRetry } from 'src/shared';
import { TemplateRenderFailedError, TemplatesServiceUnavailableError } from '../../domain/errors';
import { NotificationsConfig } from '../configs';
import { RenderTemplateInput, TemplateRendererService } from '../../application/services/template-renderer';

const RenderResponseSchema = z.object({
  html: z.string().min(1),
  subject: z.string().min(1),
});

export class ReactEmailRendererService implements TemplateRendererService {
  constructor(
    private readonly config: NotificationsConfig,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ReactEmailRendererService.name);
  }

  private async fetchRender(url: string, input: RenderTemplateInput): Promise<Response> {
    const response = await withRetry(
      () => fetch(url, {
        method: 'POST',
        body: JSON.stringify({
          template: input.templatePath,
          props: input.props,
        }),
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(this.config.TEMPLATES_SERVICE_TIMEOUT_MS),
      }),
      {
        attempts: 3,
        factor: 2,
        minTimeout: 100,
        maxTimeout: 1000,
      },
    ) as Response;
    return response;
  }

  private async parseRenderBody(
    response: Response,
    templatePath: string,
  ): Promise<{ html: string; subject: string }> {
    const data: z.infer<typeof RenderResponseSchema> = await response.json();

    const parsed = RenderResponseSchema.safeParse(data);
    if (!parsed.success) {
      throw new TemplateRenderFailedError(templatePath, parsed.error.message);
    }
    return parsed.data;
  }

  async render(input: RenderTemplateInput): Promise<Result<{ html: string; subject: string }>> {
    const base = this.config.TEMPLATES_SERVICE_URL.replace(/\/?$/, '/');
    const url = new URL('render', base).href;

    try {
      const response = await this.fetchRender(url, input);
      const rendered = await this.parseRenderBody(response, input.templatePath);

      return [null, rendered];
    } catch (error) {
      if (error instanceof TemplateRenderFailedError) {
        return [error, null];
      }
      if (error instanceof Error) {
        this.logger.error(
          { err: error, templatePath: input.templatePath },
          'Template service unavailable after retries',
        );
        return [new TemplatesServiceUnavailableError(error.message), null];
      }
      return [new Error('Unknown error'), null];
    }
  }
}