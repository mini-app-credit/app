export interface EmailSenderPort {
  send(input: {
    to: string;
    subject: string;
    html: string;
  }): Promise<[Error | null, unknown]>;
}

export interface AiSummarizerPort {
  summarize(payload: Record<string, unknown>): Promise<string>;
}

export interface ParsedApplicationFields {
  companyName?: string;
  dba?: string;
  country?: string;
  website?: string;
  revenueBand?:
    | 'under_1m'
    | '1m_10m'
    | '10m_100m'
    | '100m_250m'
    | '250m_500m'
    | 'over_500m';
  creditAmountRequested?: number;
  creditTermRequested?: 'net_10' | 'net_20' | 'net_30';
  billingContactName?: string;
  billingContactEmail?: string;
  tradeReferences?: {
    businessName: string;
    engagementStart?: string | null;
    engagementEnd?: string | null;
    contactName?: string | null;
    contactEmail?: string | null;
    contactPosition?: string | null;
  }[];
}

export interface PdfParserPort {
  parse(
    buffer: Buffer,
  ): Promise<{ fields: ParsedApplicationFields; droppedFields: string[] }>;
}

export interface PublicUrlPort {
  applicationLink(applicationId: string): string;
  recipientLink(token: string): string;
}
