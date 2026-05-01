import type { ApplicationStatus, CreditTerm, RevenueBand } from '../../domain';
import type { ApplicationMapper } from '../mappers/application.mapper';

export interface TradeReferenceInput {
  businessName: string;
  engagementStart?: string | Date | null;
  engagementEnd?: string | Date | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPosition?: string | null;
}

export interface ApplicationFieldsInput {
  companyName?: string | null;
  dba?: string | null;
  country?: string | null;
  website?: string | null;
  revenueBand?: RevenueBand | null;
  creditAmountRequested?: number | null;
  creditTermRequested?: CreditTerm | null;
  billingContactName?: string | null;
  billingContactEmail?: string | null;
  tradeReferences?: TradeReferenceInput[];
}

export interface CreateApplicationInput extends ApplicationFieldsInput {
  vendorId?: string | null;
}

export interface UpdateApplicationInput extends ApplicationFieldsInput {
  vendorId?: string | null;
}

export interface SendApplicationInput {
  id: string;
  recipientName: string;
  recipientEmail: string;
}

export interface SubmitApplicationInput extends ApplicationFieldsInput {
  token: string;
}

export interface DecideApplicationInput {
  id: string;
  action: 'approve' | 'approve_adjusted' | 'reject';
  decisionAmount?: number | null;
  decisionTerm?: CreditTerm | null;
  rejectionReason?: string | null;
}

export interface ListApplicationsInput {
  status?: ApplicationStatus;
  vendorId?: string;
}

export type ApplicationOutput = ReturnType<typeof ApplicationMapper.toPublicDto>;
