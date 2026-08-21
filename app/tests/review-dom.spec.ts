import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import {
  Window,
  type HTMLElement as HHTMLElement,
  type HTMLInputElement as HHTMLInputElement,
} from 'happy-dom';
import { buildReviewHtml } from '../src/review/page.js';
import type { ExtractResult } from '../src/schema/proposal.js';

type Card = HHTMLElement;

/**
 * اختبار الواجهة بمتصفح محاكى (happy-dom): يحمّل صفحة المراجعة الحقيقية وينفذ
 * جافاسكربتها، ثم يؤكد أن الأزرار والاختصارات والفلاتر تعمل فعلًا — لا موتًا صامتًا.
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
    {
      id: 'lessons/One.md#b002',
      file: 'lessons/One.md',
      section: 'One',
      startLine: 3,
      endLine: 3,
      markdown: 'Last updated October 2023',
      visibleText: 'Last updated October 2023',
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
    {
      clientId: 'a2',
      title: 'دور h1',
      statement: 'عنصر h1 يمثل أهم موضوع في الصفحة.',
      kind: 'decision_rule',
      sourceRefs: [
        {
          file: 'lessons/One.md',
          blockId: 'lessons/One.md#b001',
          section: 'One',
          evidence: 'HTML is a markup language.',
        },
      ],
      prerequisites: ['a1'],
      related: [],
      confidence: 0.8,
    },
  ],
  coverage: [
    { blockId: 'lessons/One.md#b001', status: 'covered', atomIds: ['a1', 'a2'] },
    {
      blockId: 'lessons/One.md#b002',
      status: 'excluded',
      reason: 'administrative',
      note: 'سطر تحديث',
    },
  ],
  warnings: [],
};

describe('صفحة المراجعة في متصفح محاكى (happy-dom)', () => {
  let window: Window;

  beforeAll(() => {
    window = new Window({ url: 'file:///review/test.html' });
    // happy-dom لا ينفذ السكربتات المضمنة عبر document.write، فنحمّل الـ DOM
    // ثم ننفذ السكربت داخل سياق النافذة كما يفعل المتصفح — وهذا يكشف أخطاء التهيئة (TDZ)
    const html = buildReviewHtml(RESULT);
    const match = /<script>([\s\S]*?)<\/script>/.exec(html)!;
    window.document.write(html.replace(match[0], ''));
    window.document.close();
    (window as unknown as { eval: (code: string) => void }).eval(match[1]!);
  });

  afterAll(() => {
    window.close();
  });

  const $ = (sel: string) => window.document.querySelector(sel);
  const $$ = (sel: string) => Array.from(window.document.querySelectorAll(sel));

  it('يبني بطاقة لكل ذرة ويكمل عناصر التحكم', () => {
    expect($$('.card')).toHaveLength(2);
    expect($('#okCount')).toBeTruthy();
    expect($('#kindSel')).toBeTruthy();
    expect($('#q')).toBeTruthy();
  });

  it('زر «اعتمد» يغيّر حالة البطاقة ويحدّث شريط التقدم', () => {
    const card = $$('.card')[0]!;
    const btnOk = card.querySelector('.act-ok') as Card;
    btnOk.click();

    expect(card.className).toContain('accepted');
    expect($('#okCount')!.textContent).toContain('1');
    expect(($('.fill-ok') as Card).style.width).toBe('50%');

    // التراجع يعيدها
    (card.querySelector('.act-undo') as Card).click();
    expect(card.className).not.toContain('accepted');
    expect($('#okCount')!.textContent).toContain('0');
  });

  it('زر «أعرفها» يعمل: حالة ذهبية وعداد ★ (بلمس مؤشر التنقل)', () => {
    const card = $$('.card')[0]!;
    (card.querySelector('.act-known') as Card).click();
    expect(card.className).toContain('known');
    expect($('#knownCount')!.textContent).toContain('★ 1');
    expect(($('.fill-known') as Card).style.width).toBe('50%');

    // التراجع بالنقر يمسحها
    (card.querySelector('.act-undo') as Card).click();
    expect(card.className).not.toContain('known');
    expect($('#knownCount')!.textContent).toContain('★ 0');

    // الاختصار W يعمل أيضًا: ننقل ثم نضغط W ثم نعود بـ ↑
    const doc = window.document;
    const down = (key: string) =>
      doc.dispatchEvent(
        new window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
      );
    down('ArrowDown'); // بطاقة أولى
    down('w');
    expect(card.className).toContain('known');
    down('ArrowUp'); // العودة للمؤشر -1 (focusCard يرفض السالب فيمسح التحديد)
    expect($$('.card')[0]!.className).not.toContain('selected');
  });

  it('اختصارات لوحة المفاتيح تعمل: تنقل ثم A ثم R ثم U', () => {
    const doc = window.document;
    const down = (key: string) =>
      doc.dispatchEvent(
        new window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
      );

    down('ArrowDown'); // أول بطاقة
    const card = $$('.card')[0]!;
    expect(card.className).toContain('selected');

    down('a'); // اعتماد
    expect(card.className).toContain('accepted');

    down('r'); // استبعاد يستبدل القرار
    expect(card.className).toContain('rejected');
    expect(card.className).not.toContain('accepted');

    down('u'); // تراجع
    expect(card.className).not.toContain('rejected');
  });

  it('البحث يصفّي البطاقات والفلاتر بالحالة والنوع', () => {
    const q = $('#q') as HHTMLInputElement;
    q.value = 'h1';
    q.dispatchEvent(new window.Event('input', { bubbles: true }));
    expect(($$('.card')[0]! as Card).style.display).toBe('none');
    expect(($$('.card')[1]! as Card).style.display).toBe('');
    expect(($('#noResults') as Card).style.display).toBe('none'); // بطاقة واحدة ظاهرة

    q.value = '';
    q.dispatchEvent(new window.Event('input', { bubbles: true }));

    // فلتر الحالة: معتمدة
    const a1 = $$('.card')[0]!;
    (a1.querySelector('.act-ok') as Card).click();
    const segBtn = $$('[data-f="accepted"]')[0] as Card;
    segBtn.click();
    expect((a1 as Card).style.display).toBe('');
    expect(($$('.card')[1]! as Card).style.display).toBe('none');

    // فلتر النوع
    const kindSel = $('#kindSel') as HHTMLInputElement;
    kindSel.value = 'decision_rule';
    kindSel.dispatchEvent(new window.Event('change', { bubbles: true }));
    expect((a1 as Card).style.display).toBe('none'); // a1 مفهوم لا قاعدة
  });

  it('البلوكات المستبعدة تُعرض بسببها', () => {
    const excItems = $$('.exc-item');
    expect(excItems).toHaveLength(1);
    expect(excItems[0]!.textContent).toContain('إداري'); // الترجمة العربية للسبب
    expect(excItems[0]!.textContent).toContain('سطر تحديث');
  });

  it('الدليل مطوي افتراضيًا والعلاقات داخله لا في وجه البطاقة', () => {
    const card1 = $$('.card')[0]!;
    const src = card1.querySelector('details.src');
    expect(src).toBeTruthy();
    expect(src!.hasAttribute('open')).toBe(false);
    expect(src!.textContent).toContain('HTML is a markup language.');
    expect(src!.textContent).toContain('lessons/One.md');
    // العنوان المميز tooltip فقط
    expect(card1.getAttribute('title')).toBe('الـ HTML لغة توصيف');

    const card2 = $$('.card')[1]!;
    const rel = card2.querySelector('.rel-line');
    expect(rel).toBeTruthy();
    expect(rel!.textContent).toContain('يتطلب');
    expect(rel!.textContent).toContain('a1');
    // سطر العلاقات داخل الدليل المطوي لا في وجه البطاقة
    expect(card2.querySelector('details.src')!.contains(rel!)).toBe(true);
  });

  it('ضبط حجم الخط يعمل ويُحفظ', () => {
    const before = window.document.documentElement.style.fontSize;
    expect(before).toBe('19px');
    ($('#fsUp') as Card).click();
    expect(window.document.documentElement.style.fontSize).toBe('20px');
    ($('#fsDown') as Card).click();
    ($('#fsDown') as Card).click();
    expect(window.document.documentElement.style.fontSize).toBe('18px');
  });
});
