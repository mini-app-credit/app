import { GoogleGenerativeAI } from '@google/generative-ai';
import { ServiceUnavailableException } from '@nestjs/common';
import { BadRequestError } from 'src/shared';
import { ParsedApplicationFields, PdfParserPort } from '../../application/ports';

const KNOWN_KEYS: (keyof ParsedApplicationFields)[] = [
  'companyName',
  'dba',
  'country',
  'website',
  'revenueBand',
  'creditAmountRequested',
  'creditTermRequested',
  'billingContactName',
  'billingContactEmail',
  'tradeReferences',
];

const PROMPT =
  'Extract credit application fields from this PDF. Return ONLY valid JSON with these exact keys: ' +
  'companyName, dba, country, website, revenueBand (one of: under_1m|1m_10m|10m_100m|100m_250m|250m_500m|over_500m), ' +
  'creditAmountRequested (number), creditTermRequested (one of: net_10|net_20|net_30), ' +
  'billingContactName, billingContactEmail, ' +
  'tradeReferences (array of: businessName, engagementStart, engagementEnd, contactName, contactEmail, contactPosition). ' +
  'If a field is not found, omit it. Do not include any fields outside this list.';

export class GeminiPdfParserAdapter implements PdfParserPort {
  async parse(
    buffer: Buffer,
  ): Promise<{ fields: ParsedApplicationFields; droppedFields: string[] }> {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'GEMINI_API_KEY is not set — add it to the API environment to enable PDF parsing',
      );
    }

    const modelName = process.env.GEMINI_MODEL?.trim() || 'gemini-3-flash-preview';
    const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: modelName });

    const result = await model.generateContent([
      { inlineData: { mimeType: 'application/pdf', data: buffer.toString('base64') } },
      { text: PROMPT },
    ]);

    const raw = result.response.text()?.trim();
    if (!raw) throw new BadRequestError('Empty response from the language model');

    const jsonString = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/, '')
      .trim();
    const parsed: Record<string, unknown> = JSON.parse(jsonString);

    const fields: ParsedApplicationFields = {};
    const droppedFields: string[] = [];
    for (const [key, value] of Object.entries(parsed)) {
      if ((KNOWN_KEYS as string[]).includes(key)) {
        (fields as Record<string, unknown>)[key] = value;
      } else {
        droppedFields.push(key);
      }
    }

    if (Array.isArray(fields.tradeReferences)) {
      fields.tradeReferences = fields.tradeReferences.slice(0, 2);
    }
    return { fields, droppedFields };
  }
}
