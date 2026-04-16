import { PaginatedResponse } from 'src/shared';

export interface EmailTemplateDto {
  id: string;
  eventName: string;
  templatePath: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEmailTemplateInput {
  eventName: string;
  templatePath: string;
}

export interface UpdateEmailTemplateInput {
  id: string;
  eventName?: string;
  templatePath?: string;
}

export interface DeleteEmailTemplateInput {
  id: string;
}

export interface ListEmailTemplatesInput {
  limit?: number;
  offset?: number;
}

export type ListEmailTemplatesOutput = PaginatedResponse<EmailTemplateDto>;

export interface ProcessEventNotificationInput {
  eventName: string;
  payload: Record<string, unknown>;
  eventId?: string;
  userId: string | null;
}
