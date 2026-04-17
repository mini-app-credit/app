import { z, createZodDto } from 'src/shared';

export const tradeReferenceSchema = z.object({
  businessName: z.string().min(1),
  engagementStart: z.string().datetime().optional().nullable(),
  engagementEnd: z.string().datetime().optional().nullable(),
  contactName: z.string().optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
  contactPosition: z.string().optional().nullable(),
});

const applicationFieldsSchema = z.object({
  companyName: z.string().optional().nullable(),
  dba: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  website: z.string().url().optional().nullable(),
  revenueBand: z
    .enum(['under_1m', '1m_10m', '10m_100m', '100m_250m', '250m_500m', 'over_500m'])
    .optional()
    .nullable(),
  creditAmountRequested: z.number().int().positive().optional().nullable(),
  creditTermRequested: z.enum(['net_10', 'net_20', 'net_30']).optional().nullable(),
  billingContactName: z.string().optional().nullable(),
  billingContactEmail: z.string().email().optional().nullable(),
  tradeReferences: z.array(tradeReferenceSchema).max(2).optional().default([]),
});

export const createApplicationSchema = applicationFieldsSchema.extend({
  vendorId: z.string().uuid().optional().nullable(),
});
export class CreateApplicationDto extends createZodDto(createApplicationSchema) { }

export const updateApplicationSchema = applicationFieldsSchema.partial().extend({
  vendorId: z.string().uuid().optional().nullable(),
});
export class UpdateApplicationDto extends createZodDto(updateApplicationSchema) { }

export const sendApplicationSchema = z.object({
  recipientName: z.string().min(1),
  recipientEmail: z.string().email(),
});
export class SendApplicationDto extends createZodDto(sendApplicationSchema) { }

export const submitApplicationSchema = applicationFieldsSchema;
export class SubmitApplicationDto extends createZodDto(submitApplicationSchema) { }

export const decideApplicationSchema = z.object({
  action: z.enum(['approve', 'approve_adjusted', 'reject']),
  decisionAmount: z.number().int().positive().optional().nullable(),
  decisionTerm: z.enum(['net_10', 'net_20', 'net_30']).optional().nullable(),
  rejectionReason: z.string().optional().nullable(),
});
export class DecideApplicationDto extends createZodDto(decideApplicationSchema) { }

export const listApplicationsSchema = z.object({
  status: z
    .enum(['draft', 'sent', 'submitted', 'approved', 'approved_adjusted', 'rejected'])
    .optional(),
  vendorId: z.string().uuid().optional(),
});
export class ListApplicationsDto extends createZodDto(listApplicationsSchema) { }
