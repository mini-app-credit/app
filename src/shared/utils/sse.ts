import { Readable } from 'node:stream';

export type SseDataEvent =
  | { type: 'data'; data: string }
  | { type: 'done' };

const DONE = '[DONE]';

export async function* decodeSse(body: ReadableStream<Uint8Array> | NodeJS.ReadableStream): AsyncGenerator<SseDataEvent> {
  const nodeStream: NodeJS.ReadableStream =
    typeof (body as any)?.getReader === 'function'
      ? Readable.fromWeb(body as unknown as any)
      : (body as NodeJS.ReadableStream);

  const decoder = new TextDecoder();
  let buffer = '';

  for await (const chunk of nodeStream as any as AsyncIterable<Uint8Array>) {
    buffer += decoder.decode(chunk, { stream: true });

    while (true) {
      const idx = buffer.indexOf('\n');
      if (idx === -1) break;

      const rawLine = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);

      const line = rawLine.trimEnd();
      if (!line) continue;
      if (!line.startsWith('data:')) continue;

      const data = line.slice('data:'.length).trim();
      if (data === DONE) {
        yield { type: 'done' };
        return;
      }

      yield { type: 'data', data };
    }
  }
}


