import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import {
  startReviewServer,
  ReviewServerError,
  DecisionEntrySchema,
  type StartedReviewServer,
} from '../src/review/server.js';
import { makeTmpVault } from './helpers.js';
import { buildReviewHtml } from '../src/review/page.js';
import type { ExtractResult } from '../src/schema/proposal.js';

/**
 * خادم المراجعة: كل قرار يصل عبر POST /decisions فيُكتب فورًا في ملف القرارات،
 * والكتابة ذرّية، والتراجع يحذف المدخل، والمعرف المجهول يُرفض برسالة عربية.
 */

const RESULT: ExtractResult = {
  schemaVersion: 2,
  generatedAt: '2025-01-01T00:00:00.000Z',
  model: 'test-model',
  roadmap: { path: 'roadmaps/map.md', chapters: [1] },
  coreLessons: ['lessons/One.md'],
  blocks: [
    {
      id: 'lessons/One.md#b001',
      file: 'lessons/One.md',
      section: 'One',
      startLine: 1,
      endLine: 1,
      markdown: 'HTML is a markup language.',
      visibleText: 'HTML is a markup language.',
    },
  ],
  recapFiles: [],
  exercises: [],
  missing: [],
  atoms: [
    {
      clientId: 'a1',
      title: 'الـ HTML لغة توصيف',
      statement: 'الـ HTML لغة توصيف وليست لغة منطق برمجي.',
      kind: 'concept',
      sourceRefs: [
        {
          file: 'lessons/One.md',
          blockId: 'lessons/One.md#b001',
          section: 'One',
          evidence: 'HTML is a markup language.',
        },
      ],
      prerequisites: [],
      related: [],
      confidence: 0.9,
    },
  ],
  coverage: [{ blockId: 'lessons/One.md#b001', status: 'covered', atomIds: ['a1'] }],
  warnings: [],
};

async function post(
  base: string,
  body: unknown,
): Promise<{ status: number; json: Record<string, unknown> }> {
  const res = await fetch(`${base}/decisions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
  return { status: res.status, json: (await res.json()) as Record<string, unknown> };
}

describe('خادم المراجعة', () => {
  let vault: ReturnType<typeof makeTmpVault>;
  let server: StartedReviewServer;
  let decisionsPath: string;
  const base = () => `http://127.0.0.1:${server.port}`;

  beforeAll(async () => {
    vault = makeTmpVault({});
    decisionsPath = path.join(vault.root, 'p.decisions.json');
    server = await startReviewServer({
      html: buildReviewHtml(RESULT, 'p.json', { serverMode: true }),
      decisionsPath,
      atoms: [{ clientId: 'a1', title: 'الـ HTML لغة توصيف' }],
    });
  });

  afterAll(async () => {
    await server.close();
    vault.cleanup();
  });

  it('GET / يخدم صفحة HTML بوضع الخادم (بلا زر تصدير ومع مؤشر حفظ)', async () => {
    const res = await fetch(base());
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
    expect(html).toContain('محفوظ تلقائيًا');
    expect(html).not.toContain('id="exportBtn"'); // الزر نفسه غائب
    expect(html).toContain('SERVER_MODE = true');
  });

  it('قرار مقبول يُكتب فورًا في الملف بالصيغة التي يستهلكها commit', async () => {
    const { status, json } = await post(base(), {
      clientId: 'a1',
      decision: 'accepted',
      note: null,
    });
    expect(status).toBe(200);
    expect(json).toMatchObject({ ok: true, clientId: 'a1' });

    const file = JSON.parse(fs.readFileSync(decisionsPath, 'utf8'));
    expect(file.a1).toEqual({
      decision: 'accepted',
      note: null,
      title: 'الـ HTML لغة توصيف',
      duplicateOf: null,
    });
  });

  it('تعديل الملاحظة يحدّث المدخل نفسه دون تكرار', async () => {
    await post(base(), { clientId: 'a1', decision: 'accepted', note: 'ملاحظة أولى' });
    const file = JSON.parse(fs.readFileSync(decisionsPath, 'utf8'));
    expect(Object.keys(file)).toEqual(['a1']);
    expect(file.a1.note).toBe('ملاحظة أولى');
  });

  it('التراجع (decision وnote معًا null) يحذف المدخل', async () => {
    await post(base(), { clientId: 'a1', decision: 'rejected', note: null });
    let file = JSON.parse(fs.readFileSync(decisionsPath, 'utf8'));
    expect(file.a1.decision).toBe('rejected');

    await post(base(), { clientId: 'a1', decision: null, note: null });
    file = JSON.parse(fs.readFileSync(decisionsPath, 'utf8'));
    expect(file.a1).toBeUndefined();
  });

  it('معرف ذرة مجهول يُرفض 400 برسالة عربية ولا يكتب في الملف', async () => {
    const before = fs.existsSync(decisionsPath) ? fs.readFileSync(decisionsPath, 'utf8') : '';
    const { status, json } = await post(base(), {
      clientId: 'zz',
      decision: 'accepted',
      note: null,
    });
    expect(status).toBe(400);
    expect(String(json.error)).toContain('غير معروف');
    expect(fs.existsSync(decisionsPath) ? fs.readFileSync(decisionsPath, 'utf8') : '').toBe(before);
  });

  it('قرار خارج القائمة يُرفض 400', async () => {
    const { status } = await post(base(), { clientId: 'a1', decision: 'maybe', note: null });
    expect(status).toBe(400);
  });

  it('قرار known («أعرفها») يُقبل ويُكتب في الملف كما هو', async () => {
    const { status, json } = await post(base(), {
      clientId: 'a1',
      decision: 'known',
      note: null,
    });
    expect(status).toBe(200);
    expect(json).toMatchObject({ ok: true, clientId: 'a1' });
    const file = JSON.parse(fs.readFileSync(decisionsPath, 'utf8'));
    expect(file.a1.decision).toBe('known');
  });

  it('جسم غير JSON يُرفض 400 برسالة عربية', async () => {
    const { status, json } = await post(base(), '{not json');
    expect(status).toBe(400);
    expect(String(json.error)).toContain('ليس JSON صالحًا');
  });

  it('مسار آخر غير / و/decisions يعيد 404', async () => {
    const res = await fetch(`${base()}/nope`);
    expect(res.status).toBe(404);
  });

  it('القرارات السابقة في الملف تُحمّل وتُدمج (استئناف جلسة)', async () => {
    fs.writeFileSync(
      decisionsPath,
      JSON.stringify({ a1: { decision: 'accepted', note: null } }),
      'utf8',
    );
    const { status } = await post(base(), { clientId: 'a1', decision: 'rejected', note: null });
    expect(status).toBe(200);
    const file = JSON.parse(fs.readFileSync(decisionsPath, 'utf8'));
    expect(file.a1.decision).toBe('rejected');
  });
});

describe('عقد القرار وملف القرارات', () => {
  it('DecisionEntrySchema يقبل accepted/known/rejected/null ويرفض غيرها', () => {
    expect(
      DecisionEntrySchema.safeParse({ clientId: 'a', decision: null, note: null }).success,
    ).toBe(true);
    expect(
      DecisionEntrySchema.safeParse({ clientId: 'a', decision: 'accepted', note: 'x' }).success,
    ).toBe(true);
    expect(
      DecisionEntrySchema.safeParse({ clientId: 'a', decision: 'known', note: null }).success,
    ).toBe(true);
    expect(
      DecisionEntrySchema.safeParse({ clientId: 'a', decision: 'rejected', note: null }).success,
    ).toBe(true);
    expect(
      DecisionEntrySchema.safeParse({ clientId: 'a', decision: 'maybe', note: null }).success,
    ).toBe(false);
    expect(
      DecisionEntrySchema.safeParse({ clientId: '', decision: null, note: null }).success,
    ).toBe(false);
  });

  it('ملف قرارات فاسد يفشل أي قرار برسالة عربية (الفساد لا يُخفى)', async () => {
    const v = makeTmpVault({ 'bad.decisions.json': '{"a1": "not an object"}' });
    try {
      const s = await startReviewServer({
        html: '<html></html>',
        decisionsPath: path.join(v.root, 'bad.decisions.json'),
        atoms: [{ clientId: 'a1', title: 't' }],
      });
      try {
        // حتى التراجع عن ذرة مجهولة يقرأ الملف أولًا فيكشف الفساد
        const res = await fetch(`http://127.0.0.1:${s.port}/decisions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId: 'zz', decision: null, note: null }),
        });
        const json = (await res.json()) as { error?: string };
        expect(res.status).toBe(400);
        expect(json.error).toContain('لا يطابق العقد');
      } finally {
        await s.close();
      }
    } finally {
      v.cleanup();
    }
  });

  it('ReviewServerError نوع مستقل يمكن تمييزه', () => {
    const e = new ReviewServerError('رسالة');
    expect(e.name).toBe('ReviewServerError');
  });
});
