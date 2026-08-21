import { describe, expect, it } from 'vitest';
import { buildReviewHtml } from '../src/review/page.js';
import type { ExtractResult } from '../src/schema/proposal.js';

/** صفحة المراجعة: مكتفية بذاتها، تعرض كل ذرة بدليلها، وتحفظ قرارات الاعتماد محليًا. */

const RESULT: ExtractResult = {
  schemaVersion: 2,
  generatedAt: '2025-01-01T00:00:00.000Z',
  model: 'test-model',
  roadmap: { path: 'roadmaps/map.md', chapters: [1, 2] },
  coreLessons: ['lessons/One.md'],
  blocks: [
    {
      id: 'lessons/One.md#b001',
      file: 'lessons/One.md',
      section: 'One',
      startLine: 1,
      endLine: 1,
      markdown: 'HTML is a <b>markup</b> language.',
      visibleText: 'HTML is a markup language.',
    },
  ],
  recapFiles: [],
  exercises: [{ chapter: 1, title: 'Do it ❌' }],
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
  coverage: [
    { blockId: 'lessons/One.md#b001', status: 'covered', atomIds: ['a1'] },
    {
      blockId: 'lessons/One.md#b002',
      status: 'excluded',
      reason: 'administrative',
      note: 'سطر تحديث',
    },
  ],
  warnings: [],
};

describe('buildReviewHtml', () => {
  const html = buildReviewHtml(RESULT);

  it('صفحة RTL عربية مكتفية بذاتها (لا سكربتات ولا صور خارجية؛ الخطوط بديلة اختيارية)', () => {
    expect(html).toContain('dir="rtl"');
    expect(html).toContain('<!doctype html>');
    // لا سكربتات خارجية ولا صور/بيانات تُجلب من الشبكة؛ روابط الخطوط فقط ببدائل نظامية
    expect(html).not.toMatch(/<script[^>]+src=["']https?:/);
    expect(html).not.toMatch(/<img[^>]+src=["']https?:/);
    expect(html).toMatch(/fonts\.googleapis\.com|IBM Plex Sans Arabic/);
  });

  it('تتضمن أدوات المراجعة: تقدم وتصفية وبحث وتصدير واختصارات', () => {
    expect(html).toContain('id="fillOk"');
    expect(html).toContain('statusSeg');
    expect(html).toContain('exportBtn');
    expect(html).toMatch(/ArrowDown|keydown/);
  });

  it('تعرض كل ذرة ببيانها الكبير، والدليل مطويًا خلف زر، بلا معرفات صارخة في وجه البطاقة', () => {
    expect(html).toContain('الـ HTML لغة توصيف وليست لغة منطق برمجي.');
    expect(html).toContain('concept');
    // الدليل والبلوك موجودان في بيانات الصفحة ويُعرضان داخل <details> مطوي
    expect(html).toContain('HTML is a markup language.');
    expect(html).toContain('lessons/One.md#b001');
    expect(html).toContain('الدليل والمصدر');
    // ممنوع شرائح العلاقات الخام في الوجه؛ انتقلت داخل الدليل المطوي
    expect(html).not.toContain('requires:');
    expect(html).not.toContain('related:');
  });

  it('تتيح ضبط حجم الخط من الهيدر ومن لوحة المفاتيح', () => {
    expect(html).toContain('id="fsUp"');
    expect(html).toContain('id="fsDown"');
    expect(html).toContain("e.key === '+'");
  });

  it('تشرح الخطوة التالية بعد القرارات: تصدير ثم أمر commit', () => {
    expect(html).toContain('بعد الانتهاء من القرارات');
    expect(html).toContain('learn commit');
    expect(html).toContain('knowledge-base.json');
  });

  it('توسم المكررة لقاعدة المعرفة بشارة واضحة', () => {
    const dup = buildReviewHtml({
      ...RESULT,
      atoms: [{ ...RESULT.atoms[0]!, duplicateOf: 'k0042' }],
    });
    // الشارة تُبنى في السكربت من بيانات الذرة المضمّنة؛ نفحص أجزاءها الثلاثة
    expect(dup).toContain('مكررة لـ ');
    expect(dup).toContain('k0042');
    expect(dup).toContain('is-dup');
    expect(dup).toContain('ستُدمج فيها عند الاعتماد');
  });

  it('تعرض الإحصاءات والاستبعادات', () => {
    expect(html).toContain('1 ذرة');
    expect(html).toContain('administrative');
    expect(html).toContain('سطر تحديث');
  });

  it('تهرب محتوى الذرات (أمان HTML) حتى لو حمل وسومًا', () => {
    const hostile = buildReviewHtml({
      ...RESULT,
      atoms: [{ ...RESULT.atoms[0]!, title: '<script>x</script>', statement: '<img src=x>' }],
      coverage: [{ blockId: 'lessons/One.md#b001', status: 'covered', atomIds: ['a1'] }],
    });
    // لا وسم خام قابل للتنفيذ؛ يظهر مهربًا (كيان HTML أو \u003c داخل JSON)
    expect(hostile).not.toContain('<script>x</script>');
    expect(hostile.includes('&lt;script&gt;') || hostile.includes('\\u003cscript')).toBe(true);
  });
});
