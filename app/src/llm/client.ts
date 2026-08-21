export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmClient {
  complete(messages: ChatMessage[]): Promise<string>;
}

export interface LlmConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  /** مهلة طلب الشبكة بالملي ثانية */
  timeoutMs: number;
}

/**
 * عميل OpenAI-compatible مبني على fetch الأصلية؛ لا مزود محدد داخل الشفرة.
 *
 * يستعمل التدفق (stream: true) لأن التوليدات الكبيرة قد تتجاوز مهلة ترويسات fetch
 * الافتراضية (~300 ث) قبل وصول أول بايت من الرد غير المتدفق؛ مع التدفق تصل الترويسة
 * فورًا ويُجمع المحتوى تدريجيًا. إن أعاد المزود JSON عاديًا (تجاهل stream) يُعامل معه.
 */
export class OpenAiCompatibleClient implements LlmClient {
  constructor(private readonly config: LlmConfig) {}

  async complete(messages: ChatMessage[]): Promise<string> {
    const url = `${this.config.baseUrl.replace(/\/+$/, '')}/chat/completions`;
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          temperature: 0.1,
          stream: true,
        }),
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
    } catch (error) {
      // لا retry متعمد: لا نكرر طلبًا مدفوعًا تلقائيًا
      if (
        error instanceof Error &&
        (error.name === 'TimeoutError' || error.name === 'AbortError')
      ) {
        throw new Error(
          `انتهت مهلة طلب المزود بعد ${this.config.timeoutMs} ملي ثانية (متغير LLM_TIMEOUT_MS).`,
        );
      }
      const cause = (error as { cause?: { code?: unknown; message?: unknown } })?.cause;
      const causeInfo = cause?.code ?? cause?.message ?? '';
      throw new Error(
        `فشل الاتصال بالمزود: ${error instanceof Error ? error.message : String(error)}${causeInfo ? ` (السبب: ${causeInfo})` : ''}`,
      );
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`فشل طلب المزود (${response.status} ${response.statusText}): ${body}`);
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('text/event-stream')) {
      return readSseContent(response);
    }

    // المزود تجاهل stream وأعاد JSON كاملًا
    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: unknown } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      throw new Error('رد المزود لا يحتوي محتوى نصيًا في choices[0].message.content.');
    }
    return content;
  }
}

/** يجمع محتوى تدفق SSE (أسطر data: {...} ثم data: [DONE]). */
async function readSseContent(response: Response): Promise<string> {
  if (!response.body) {
    throw new Error('لا يوجد جسم للاستجابة المتدفقة.');
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let content = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIndex = buffer.indexOf('\n');
    while (newlineIndex >= 0) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);
      newlineIndex = buffer.indexOf('\n');

      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (payload.length === 0 || payload === '[DONE]') continue;
      try {
        const chunk = JSON.parse(payload) as {
          choices?: Array<{ delta?: { content?: unknown } }>;
        };
        const delta = chunk.choices?.[0]?.delta?.content;
        if (typeof delta === 'string') content += delta;
      } catch {
        // سطر غير مكتمل أو تعليق SSE — يُتجاهل
      }
    }
  }

  if (content.length === 0) {
    throw new Error('انتهى التدفق من المزود دون أي محتوى نصي.');
  }
  return content;
}
