import { Result } from 'src/shared';

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export interface EmailSenderService {
  send(input: SendEmailInput): Promise<Result<null>>;
}
