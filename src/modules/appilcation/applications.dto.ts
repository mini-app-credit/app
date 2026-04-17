import { z, createZodDto } from 'src/shared';

export const tradeReferenceSchema = z.object({
  businessName: z.string().min(1).openapi({ example: 'Global Supplies Ltd' }),
  engagementStart: z
    .string()
    .datetime()
    .optional()
    .nullable()
    .openapi({ example: '2022-01-15T00:00:00.000Z' }),
  engagementEnd: z
    .string()
    .datetime()
    .optional()
    .nullable()
    .openapi({ example: '2024-06-30T00:00:00.000Z' }),
  contactName: z.string().optional().nullable().openapi({ example: 'Jane Smith' }),
  contactEmail: z
    .string()
    .email()
    .optional()
    .nullable()
    .openapi({ example: 'jane.smith@globalsupplies.com' }),
  contactPosition: z.string().optional().nullable().openapi({ example: 'Accounts Manager' }),
});

const applicationFieldsSchema = z.object({
  companyName: z.string().optional().nullable().openapi({ example: 'Acme Corporation' }),
  dba: z.string().optional().nullable().openapi({ example: 'Acme Corp' }),
  country: z.string().optional().nullable().openapi({ example: 'United States' }),
  website: z.string().url().optional().nullable().openapi({ example: 'https://acmecorp.com' }),
  revenueBand: z
    .enum(['under_1m', '1m_10m', '10m_100m', '100m_250m', '250m_500m', 'over_500m'])
    .optional()
    .nullable()
    .openapi({ example: '10m_100m' }),
  creditAmountRequested: z
    .number()
    .int()
    .positive()
    .optional()
    .nullable()
    .openapi({ example: 50000 }),
  creditTermRequested: z
    .enum(['net_10', 'net_20', 'net_30'])
    .optional()
    .nullable()
    .openapi({ example: 'net_30' }),
  billingContactName: z.string().optional().nullable().openapi({ example: 'John Doe' }),
  billingContactEmail: z
    .string()
    .email()
    .optional()
    .nullable()
    .openapi({ example: 'john.doe@acmecorp.com' }),
  tradeReferences: z
    .array(tradeReferenceSchema)
    .max(2)
    .optional()
    .default([])
    .openapi({
      example: [
        {
          businessName: 'Global Supplies Ltd',
          engagementStart: '2022-01-15T00:00:00.000Z',
          engagementEnd: '2024-06-30T00:00:00.000Z',
          contactName: 'Jane Smith',
          contactEmail: 'jane.smith@globalsupplies.com',
          contactPosition: 'Accounts Manager',
        },
      ],
    }),
});

// --- Create ---
export const createApplicationSchema = applicationFieldsSchema
  .extend({
    vendorId: z
      .string()
      .uuid()
      .optional()
      .nullable()
      .openapi({ example: '00000000-0000-0000-0000-000000000001' }),
  })
  .openapi({
    description: 'Create a new credit application in draft status',
    example: {
      companyName: 'Acme Corporation',
      dba: 'Acme Corp',
      country: 'United States',
      website: 'https://acmecorp.com',
      revenueBand: '10m_100m',
      creditAmountRequested: 50000,
      creditTermRequested: 'net_30',
      billingContactName: 'John Doe',
      billingContactEmail: 'john.doe@acmecorp.com',
      vendorId: '00000000-0000-0000-0000-000000000001',
      tradeReferences: [
        {
          businessName: 'Global Supplies Ltd',
          engagementStart: '2022-01-15T00:00:00.000Z',
          engagementEnd: '2024-06-30T00:00:00.000Z',
          contactName: 'Jane Smith',
          contactEmail: 'jane.smith@globalsupplies.com',
          contactPosition: 'Accounts Manager',
        },
      ],
    },
  });
export class CreateApplicationDto extends createZodDto(createApplicationSchema) { }

// --- Update (vendor patches draft) ---
export const updateApplicationSchema = applicationFieldsSchema
  .partial()
  .extend({
    vendorId: z.string().uuid().optional().nullable(),
  })
  .openapi({
    description: 'Partial update of application fields',
    example: {
      companyName: 'Acme Corporation Updated',
      creditAmountRequested: 75000,
      creditTermRequested: 'net_30',
    },
  });
export class UpdateApplicationDto extends createZodDto(updateApplicationSchema) { }

// --- Send to recipient ---
export const sendApplicationSchema = z
  .object({
    recipientName: z.string().min(1).openapi({ example: 'Alice Johnson' }),
    recipientEmail: z.string().email().openapi({ example: 'alice.johnson@buyer.com' }),
  })
  .openapi({
    description: 'Send application to recipient — generates a unique link and emails it',
    example: {
      recipientName: 'Alice Johnson',
      recipientEmail: 'alice.johnson@buyer.com',
    },
  });
export class SendApplicationDto extends createZodDto(sendApplicationSchema) { }

// --- Recipient submits ---
export const submitApplicationSchema = applicationFieldsSchema.openapi({
  description: 'Recipient fills out and submits the credit application form',
  example: {
    companyName: 'Buyer Co LLC',
    dba: 'BuyerCo',
    country: 'United States',
    website: 'https://buyerco.com',
    revenueBand: '1m_10m',
    creditAmountRequested: 50000,
    creditTermRequested: 'net_30',
    billingContactName: 'Alice Johnson',
    billingContactEmail: 'alice.johnson@buyer.com',
    tradeReferences: [
      {
        businessName: 'Global Supplies Ltd',
        engagementStart: '2022-01-15T00:00:00.000Z',
        engagementEnd: '2024-06-30T00:00:00.000Z',
        contactName: 'Jane Smith',
        contactEmail: 'jane.smith@globalsupplies.com',
        contactPosition: 'Accounts Manager',
      },
    ],
  },
});
export class SubmitApplicationDto extends createZodDto(submitApplicationSchema) { }

export const decideApplicationSchema = z
  .object({
    action: z.enum(['approve', 'approve_adjusted', 'reject']).openapi({ example: 'approve_adjusted' }),
    decisionAmount: z.number().int().positive().optional().nullable().openapi({ example: 40000 }),
    decisionTerm: z
      .enum(['net_10', 'net_20', 'net_30'])
      .optional()
      .nullable()
      .openapi({ example: 'net_20' }),
    rejectionReason: z.string().optional().nullable().openapi({ example: null }),
  })
  .openapi({
    description: 'Approve, approve with adjusted terms, or reject a submitted application',
    example: {
      action: 'approve_adjusted',
      decisionAmount: 40000,
      decisionTerm: 'net_20',
      rejectionReason: null,
    },
  });
export class DecideApplicationDto extends createZodDto(decideApplicationSchema) { }

export const listApplicationsSchema = z
  .object({
    status: z
      .enum(['draft', 'sent', 'submitted', 'approved', 'approved_adjusted', 'rejected'])
      .optional()
      .openapi({ example: 'submitted' }),
    vendorId: z
      .string()
      .uuid()
      .optional()
      .openapi({ example: '00000000-0000-0000-0000-000000000001' }),
  })
  .openapi({ description: 'Filter applications by status and/or vendor' });
export class ListApplicationsDto extends createZodDto(listApplicationsSchema) { }
