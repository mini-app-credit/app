import { GoogleGenerativeAI } from '@google/generative-ai';
import { ServiceUnavailableException } from '@nestjs/common';
import { BadRequestError } from 'src/shared';
import { AiSummarizerPort } from '../../application/ports';

export class GeminiSummarizerAdapter implements AiSummarizerPort {
  private static readonly SYSTEM_INSTRUCTION =
    'You are a credit analyst assistant. Given JSON application data, write a concise advisory summary (4–8 sentences) for the vendor: key strengths, risks, and whether to lean toward approve, reject, or approve with adjusted terms. This is advisory only; the vendor makes the final decision. Plain English, no markdown headings.';

  async summarize(payload: Record<string, unknown>): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'GEMINI_API_KEY is not set — add it to the API environment to enable AI summaries',
      );
    }

    const modelName = process.env.GEMINI_MODEL?.trim() || 'gemini-3-flash-preview';
    const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
      model: modelName,
      systemInstruction: GeminiSummarizerAdapter.SYSTEM_INSTRUCTION,
    });

    const result = await model.generateContent(
      `Application data (JSON):\n${JSON.stringify(payload, null, 2)}`,
    );
    const text = result.response.text()?.trim();
    if (!text) throw new BadRequestError('Empty response from the language model');
    return text;
  }
}
