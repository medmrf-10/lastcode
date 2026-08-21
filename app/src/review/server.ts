import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

/**
 * خادم مراجعة محلي (localhost فقط): يخدم صفحة المراجعة في وضع الخادم،
 * ويستقبل كل قرار لحظة صنعه فيكتبه فورًا في ملف القرارات على القرص.
 *
 * - لا تبعيات جديدة: node:http + Zod الموجود أصلًا.
 * - يسمع على 127.0.0.1 حصرًا — لا وصول من خارج الجهاز.
 * - ملف القرارات بصيغة review-decisions.json نفسها التي يستهلكها learn commit،
 *   والكتابة ذرّية (ملف مؤقت ثم rename) كي لا يتلف ملفًا نصف مكتوب.
 */

export const DecisionEntrySchema = z.object({
  clientId: z.string().min(1),
  /** accepted: اعتماد عادي، known: «أعرفها» (فاصل أول طويل)، rejected: استبعاد، null: تراجع */
  decision: z.enum(['accepted', 'known', 'rejected']).nullable(),
  note: z.string().nullable(),
});
export type DecisionPayload = z.infer<typeof DecisionEntrySchema>;

/** ملف القرارات: clientId -> { decision, note, title, duplicateOf } */
const DecisionsFileSchema = z.record(
  z.string(),
  z.object({
    decision: z.string().nullable(),
    note: z.string().nullable(),
    title: z.string().optional(),
    duplicateOf: z.string().nullable().optional(),
  }),
);
type DecisionsFile = z.infer<typeof DecisionsFileSchema>;

export class ReviewServerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReviewServerError';
  }
}

function readDecisionsFile(file: string): DecisionsFile {
  if (!fs.existsSync(file)) return {};
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    throw new ReviewServerError(`ملف القرارات ليس JSON صالحًا: ${file}`);
  }
  const parsed = DecisionsFileSchema.safeParse(parsedJson);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => i.path.join('.') || '(جذر)').join(', ');
    throw new ReviewServerError(`ملف القرارات لا يطابق العقد المتوقع: ${details}`);
  }
  return parsed.data;
}

function writeDecisionsAtomic(file: string, decisions: DecisionsFile): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tmp, JSON.stringify(decisions, null, 2), 'utf8');
  fs.renameSync(tmp, file);
}

export interface ReviewServerOptions {
  /** صفحة HTML الكاملة المبنية بوضع الخادم */
  html: string;
  /** مسار ملف القرارات الذي يُكتب لحظيًا */
  decisionsPath: string;
  /** ذرات الاقتراح: لتغنية المدخلات بالعنوان وduplicateOf كما يفعل زر التصدير */
  atoms: Array<{ clientId: string; title: string; duplicateOf?: string }>;
  port?: number;
}

export interface StartedReviewServer {
  port: number;
  close: () => Promise<void>;
}

/**
 * يشغل خادم المراجعة ويعيد المنفذ الفعلي ودالة الإيقاف.
 * المنفذ 0 يعني «اختر منفذًا حرًا» — مفيد للاختبارات.
 */
export function startReviewServer(options: ReviewServerOptions): Promise<StartedReviewServer> {
  const { html, decisionsPath, atoms } = options;
  const metaByClientId = new Map(atoms.map((a) => [a.clientId, a]));

  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1');

    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }

    if (req.method === 'POST' && url.pathname === '/decisions') {
      let body = '';
      req.on('data', (chunk: Buffer) => {
        body += chunk;
        if (body.length > 64 * 1024) req.destroy(); // طلب شاذ ضخم: اقطعه
      });
      req.on('end', () => {
        try {
          const payload = applyDecision(body);
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: true, ...payload }));
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: false, error: message }));
        }
      });
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404');
  });

  /** يتحقق من الطلب ويطبقه على ملف القرارات ويعيد ملخصًا للرد. */
  function applyDecision(body: string): { clientId: string; saved: number } {
    let raw: unknown;
    try {
      raw = JSON.parse(body);
    } catch {
      throw new ReviewServerError('جسم الطلب ليس JSON صالحًا.');
    }
    const parsed = DecisionEntrySchema.safeParse(raw);
    if (!parsed.success) {
      const details = parsed.error.issues
        .map((i) => `${i.path.join('.') || '(جذر)'}: ${i.message}`)
        .join(' | ');
      throw new ReviewServerError(`قرار غير صالح: ${details}`);
    }
    const { clientId, decision, note } = parsed.data;

    // اقرأ الملف أولًا: ملف فاسد يفشل بصوت عالٍ على أي قرار، لا يُخفى خلف أخطاء أخرى
    const current = readDecisionsFile(decisionsPath);

    if (!decision && !note) {
      // تراجع كامل: احذف المدخل إن وجد
      delete current[clientId];
      writeDecisionsAtomic(decisionsPath, current);
      return { clientId, saved: Object.keys(current).length };
    }

    const meta = metaByClientId.get(clientId);
    if (!meta) {
      throw new ReviewServerError(`معرف ذرة غير معروف في هذا الاقتراح: "${clientId}".`);
    }

    current[clientId] = {
      decision,
      note,
      title: meta.title,
      duplicateOf: meta.duplicateOf ?? null,
    };
    writeDecisionsAtomic(decisionsPath, current);
    return { clientId, saved: Object.keys(current).length };
  }

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(options.port ?? 0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : (options.port ?? 0);
      resolve({
        port,
        close: () =>
          new Promise<void>((resolveClose, rejectClose) => {
            server.close((error) => (error ? rejectClose(error) : resolveClose()));
          }),
      });
    });
  });
}
