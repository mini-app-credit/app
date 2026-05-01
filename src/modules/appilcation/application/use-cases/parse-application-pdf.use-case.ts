import { Result, UseCase } from 'src/shared';
import { ParsedApplicationFields, PdfParserPort } from '../ports';

export type ParseApplicationPdf = UseCase<
  { buffer: Buffer },
  Result<{ fields: ParsedApplicationFields; droppedFields: string[] }>
>;

export class ParseApplicationPdfUseCase implements ParseApplicationPdf {
  constructor(private readonly parser: PdfParserPort) {}

  async execute(input: {
    buffer: Buffer;
  }): Promise<Result<{ fields: ParsedApplicationFields; droppedFields: string[] }>> {
    try {
      const res = await this.parser.parse(input.buffer);
      return [null, res];
    } catch (err) {
      return [err instanceof Error ? err : new Error('Unknown error'), null];
    }
  }
}
