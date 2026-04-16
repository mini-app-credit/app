import { randomUUID } from 'node:crypto';
import { AggregateRoot, EntityProps } from 'src/shared';
import { InvalidEmailTemplateError } from '../errors';

export interface EmailTemplateProps extends EntityProps {
  id: string;
  eventName: string;
  templatePath: string;
}

export type EmailTemplateCreateProps = Pick<EmailTemplateProps, 'eventName' | 'templatePath'>;

export class EmailTemplate extends AggregateRoot<EmailTemplateProps> {
  constructor(props: EmailTemplateProps) {
    super(props);
  }

  get props(): Readonly<EmailTemplateProps> {
    return { ...this._props };
  }

  get eventName(): string {
    return this._props.eventName;
  }

  get templatePath(): string {
    return this._props.templatePath;
  }

  static create(input: EmailTemplateCreateProps): EmailTemplate {
    const now = new Date();
    return new EmailTemplate({
      id: randomUUID(),
      eventName: input.eventName,
      templatePath: input.templatePath,
      createdAt: now,
      updatedAt: now,
    });
  }

  static restore(props: EmailTemplateProps): EmailTemplate {
    return new EmailTemplate(props);
  }

  protected validate(): void {
    if (!this._props.eventName?.trim()) {
      throw new InvalidEmailTemplateError('eventName is required');
    }
    if (this._props.eventName.length > 255) {
      throw new InvalidEmailTemplateError('eventName must be at most 255 characters');
    }
    if (!this._props.templatePath?.trim()) {
      throw new InvalidEmailTemplateError('templatePath is required');
    }
    if (this._props.templatePath.length > 255) {
      throw new InvalidEmailTemplateError('templatePath must be at most 255 characters');
    }
  }
}
