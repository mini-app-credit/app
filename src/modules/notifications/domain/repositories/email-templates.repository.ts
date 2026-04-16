import { BaseRepository, UUIDIdentifier } from 'src/shared';
import { EmailTemplate } from '../entities/email-template.entity';

export interface EmailTemplatesRepository extends BaseRepository<EmailTemplate> {
  insert(template: EmailTemplate): Promise<EmailTemplate>;
  findById(id: UUIDIdentifier): Promise<EmailTemplate | null>;
  findByEventName(eventName: string): Promise<EmailTemplate | null>;
  list(limit?: number, offset?: number): Promise<EmailTemplate[]>;
  update(template: EmailTemplate): Promise<EmailTemplate>;
  deleteById(id: UUIDIdentifier): Promise<void>;
}
