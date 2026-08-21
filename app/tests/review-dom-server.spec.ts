import { describe, expect, it, beforeAll, afterAll, vi } from 'vitest';
import { Window, type HTMLElement as HHTMLElement } from 'happy-dom';
import { buildReviewHtml } from '../src/review/page.js';
import type { ExtractResult } from '../src/schema/proposal.js';

/**
 * وضع الخادم في صفحة المراجعة: كل قرار يُرسل فورًا عبر POST /decisions،
 * وزر التصدير يختفي، ومؤشر الحفظ يتبدّل بين المحفوظ/يُحفظ/الخطأ.
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

function bootWindow(
  html: string,
  fetchMock: (input: string, init?: RequestInit) => Promise<unknown>,
) {
  const window = new Window({ url: 'http://localhost:4173/' });
  const match = /<script>([\s\S]*?)<\/script>/.exec(html)!;
  window.document.write(html.replace(match[0], ''));
  window.document.close();
  const winWithEval = window as unknown as {
    eval: (code: string) => void;
    fetch: typeof fetch;
  };
  winWithEval.fetch = fetchMock as unknown as typeof fetch;
  winWithEval.eval(match[1]!);
  return window;
}

describe('صفحة المراجعة في وضع الخادم', () => {
  let window: Window;
  const postedBodies: unknown[] = [];
  let failNext = false;

  beforeAll(() => {
    const html = buildReviewHtml(RESULT, 'p.json', { serverMode: true });
    window = bootWindow(html, async (_url, init) => {
      if (failNext) throw new Error('network down');
      postedBodies.push(JSON.parse(String(init?.body)));
      return { ok: true, status: 200 };
    });
  });

  afterAll(() => {
    window.close();
  });

  const $ = (sel: string) => window.document.querySelector(sel);
  const $$ = (sel: string) => Array.from(window.document.querySelectorAll(sel));

  it('لا زر تصدير، وهناك مؤشر حفظ تلقائي', () => {
    expect($('#exportBtn')).toBeNull();
    expect($('#saveState')!.textContent).toContain('محفوظ تلقائيًا');
  });

  it('كل قرار يُرسل فورًا بجسم صحيح ويحدّث المؤشر', async () => {
    const card = $$('.card')[0]!;
    (card.querySelector('.act-ok') as HHTMLElement).click();
    await vi.waitFor(() => expect(postedBodies).toHaveLength(1));

    expect(postedBodies[0]).toEqual({ clientId: 'a1', decision: 'accepted', note: null });
    await vi.waitFor(() => expect($('#saveState')!.className).not.toContain('saving'));
    expect($('#saveState')!.textContent).toContain('محفوظ تلقائيًا');
  });

  it('التراجع يُرسل قرارًا فارغًا (null) كي يحذفه الخادم', async () => {
    const card = $$('.card')[0]!;
    (card.querySelector('.act-undo') as HHTMLElement).click();
    await vi.waitFor(() => expect(postedBodies).toHaveLength(2));
    expect(postedBodies[1]).toEqual({ clientId: 'a1', decision: null, note: null });
  });

  it('زر «أعرفها» يُرسل known ويحدّث العداد الذهبي والشريط', async () => {
    const card = $$('.card')[0]!;
    (card.querySelector('.act-known') as HHTMLElement).click();
    await vi.waitFor(() => expect(postedBodies).toHaveLength(3));
    expect(postedBodies[2]).toEqual({ clientId: 'a1', decision: 'known', note: null });

    expect(card.className).toContain('known');
    expect($('#knownCount')!.textContent).toContain('★ 1');
    // ذرة واحدة إجمالًا → الشريط الذهبي 100%
    expect(($('#fillKnown') as HHTMLElement).style.width).toBe('100%');
  });

  it('فشل الشبكة يظهر حالة خطأ ولا يفقد القرار محليًا', async () => {
    failNext = true;
    const card = $$('.card')[0]!;
    (card.querySelector('.act-no') as HHTMLElement).click();
    await vi.waitFor(() => expect($('#saveState')!.className).toContain('error'));
    expect(card.className).toContain('rejected'); // القرار باقٍ محليًا
    expect($('#saveState')!.textContent).toContain('تعذر الحفظ');
    failNext = false;

    // قرار تالٍ ناجح يعيد المؤشر للحالة السليمة
    (card.querySelector('.act-ok') as HHTMLElement).click();
    await vi.waitFor(() => expect($('#saveState')!.className).not.toContain('error'));
  });
});
