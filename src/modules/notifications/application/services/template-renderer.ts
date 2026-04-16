import { Result } from 'src/shared';

export interface RenderTemplateInput {
  templatePath: string;
  props: Record<string, unknown>;
}

export interface TemplateRendererService {
  render(input: RenderTemplateInput): Promise<Result<{ html: string; subject: string }>>;
}
