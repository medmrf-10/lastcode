import { afterEach, describe, expect, it, vi } from 'vitest';
import { OpenAiCompatibleClient } from '../src/llm/client.js';

/** عميل الشبكة: نجاح مبطن بلا شبكة حقيقية، ورسالة مهلة عربية مفهومة. */

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

interface FetchInitLike {
  method?: string;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  body?: string;
}

function makeClient(timeoutMs: number): OpenAiCompatibleClient {
  return new OpenAiCompatibleClient({
    apiKey: 'test-key',
    baseUrl: 'http://localhost:9/v1',
    model: 'test-model',
    timeoutMs,
  });
}

describe('OpenAiCompatibleClient', () => {
  it('يبني الطلب ويعيد محتوى الرد (fetch مبطن)', async () => {
    let capturedInit: FetchInitLike | undefined;
    globalThis.fetch = (async (_input: unknown, init?: FetchInitLike) => {
      capturedInit = init;
      return new Response(JSON.stringify({ choices: [{ message: { content: 'hi' } }] }), {
        status: 200,
      });
    }) as unknown as typeof fetch;

    const content = await makeClient(5_000).complete([{ role: 'user', content: 'x' }]);

    expect(content).toBe('hi');
    expect(capturedInit?.method).toBe('POST');
    expect(capturedInit?.headers?.Authorization).toBe('Bearer test-key');
    expect(capturedInit?.signal).toBeTruthy();
  });

  it('يرمي رسالة عربية مفهومة عند انتهاء المهلة (بلا شبكة حقيقية)', async () => {
    // fetch مزيف ينتظر إشارة الإلغاء ثم يرفض بخطأ مهلة كما تفعل fetch الحقيقية
    globalThis.fetch = (async (_input: unknown, init?: FetchInitLike) => {
      const signal = init?.signal;
      await new Promise<never>((_resolve, reject) => {
        if (signal?.aborted) {
          reject(new DOMException('The operation was aborted due to timeout', 'TimeoutError'));
          return;
        }
        signal?.addEventListener('abort', () => {
          reject(new DOMException('The operation was aborted due to timeout', 'TimeoutError'));
        });
      });
    }) as unknown as typeof fetch;

    await expect(makeClient(25).complete([{ role: 'user', content: 'x' }])).rejects.toThrow(
      /انتهت مهلة طلب المزود بعد 25 ملي ثانية/,
    );
  }, 10_000);

  it('يمرر أخطاء الشبكة الأخرى كما هي دون تحويلها إلى مهلة', async () => {
    globalThis.fetch = (async () => {
      throw new TypeError('fetch failed');
    }) as unknown as typeof fetch;

    await expect(makeClient(5_000).complete([{ role: 'user', content: 'x' }])).rejects.toThrow(
      /fetch failed/,
    );
  });
});

describe('التدفق (SSE)', () => {
  function sseResponse(chunks: string[]): Response {
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
        controller.close();
      },
    });
    return new Response(stream, {
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
    });
  }

  it('يجمع محتوى التدفق من أسطر data: ويتوقف عند [DONE]', async () => {
    globalThis.fetch = (async () =>
      sseResponse([
        'data: {"choices":[{"delta":{"content":"{\\"atoms\\":"}}]}\n\n',
        ': keep-alive comment\n\n',
        'data: {"choices":[{"delta":{"content":"[]}"}}]}\n\n',
        'data: [DONE]\n\n',
      ])) as unknown as typeof fetch;

    const content = await makeClient(5_000).complete([{ role: 'user', content: 'x' }]);
    expect(content).toBe('{"atoms":[]}');
  });

  it('يرفض تدفقًا ينتهي دون أي محتوى', async () => {
    globalThis.fetch = (async () => sseResponse(['data: [DONE]\n\n'])) as unknown as typeof fetch;
    await expect(makeClient(5_000).complete([{ role: 'user', content: 'x' }])).rejects.toThrow(
      /دون أي محتوى نصي/,
    );
  });

  it('يتعامل مع موزع تجاهل stream وأعاد JSON عاديًا', async () => {
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ choices: [{ message: { content: 'full' } }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })) as unknown as typeof fetch;

    const content = await makeClient(5_000).complete([{ role: 'user', content: 'x' }]);
    expect(content).toBe('full');
  });

  it('يرسل stream: true في جسم الطلب', async () => {
    let capturedBody: unknown;
    globalThis.fetch = (async (_input: unknown, init?: FetchInitLike) => {
      capturedBody = JSON.parse(String(init?.body));
      return new Response(JSON.stringify({ choices: [{ message: { content: 'ok' } }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as unknown as typeof fetch;

    await makeClient(5_000).complete([{ role: 'user', content: 'x' }]);
    expect((capturedBody as { stream?: boolean }).stream).toBe(true);
  });
});
