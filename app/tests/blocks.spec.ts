import { describe, expect, it } from 'vitest';
import { splitSourceBlocks } from '../src/domain/blocks.js';

/** تقسيم الدروس إلى بلوكات: فقرات/قوائم/متداخلة/fence/عناوين/أسطر/ثبات المعرفات. */

const SAMPLE = `# Lesson title

Intro paragraph line one.

Last updated October 2023

## Section A

- item one
- item two
\t- nested child
- item three with continuation
  on two lines

\`\`\`html
<h1>code block</h1>
a * b
\`\`\`

> a quoted paragraph

Plain paragraph after.

![Standalone image alt text](https://example.com/i.png)

Closing paragraph.
`;

describe('splitSourceBlocks', () => {
  const blocks = splitSourceBlocks('lessons/Sample.md', SAMPLE);

  it('يولّد بلوكات غير فارغة بمعرفات ثابتة وخطوطًا متجاورة داخل الملف', () => {
    expect(blocks.length).toBeGreaterThan(0);
    const totalLines = SAMPLE.split('\n').length;
    const ids = new Set<string>();
    let prevEnd = 0;
    for (const block of blocks) {
      expect(block.markdown.trim().length).toBeGreaterThan(0);
      expect(block.id.startsWith('lessons/Sample.md#b')).toBe(true);
      expect(ids.has(block.id)).toBe(false);
      ids.add(block.id);
      expect(block.startLine).toBeGreaterThan(prevEnd); // لا تداخل وترتيب صاعد
      expect(block.endLine).toBeGreaterThanOrEqual(block.startLine);
      expect(block.endLine).toBeLessThanOrEqual(totalLines);
      prevEnd = block.endLine;
    }
  });

  it('المعرفات deterministic: تشغيلان متطابقان تمامًا', () => {
    const again = splitSourceBlocks('lessons/Sample.md', SAMPLE);
    expect(again).toEqual(blocks);
  });

  it('العنوان ليس بلوكًا؛ يصبح section أقرب عنوان سابق، والمقدمة قبل أول عنوان', () => {
    expect(blocks.some((b) => b.markdown.trim().startsWith('#'))).toBe(false);
    const intro = blocks.find((b) => b.visibleText.includes('Intro paragraph'))!;
    expect(intro.section).toBe('Lesson title');
    const inSectionA = blocks.find((b) => b.visibleText.includes('item one'))!;
    expect(inSectionA.section).toBe('Section A');
  });

  it('بنود القائمة بلوكات مستقلة، والمتداخل لا يكرر نص الأب ولا العكس', () => {
    const itemOne = blocks.find((b) => b.visibleText === 'item one')!;
    const nested = blocks.find((b) => b.visibleText === 'nested child')!;
    expect(itemOne).toBeDefined();
    expect(nested).toBeDefined();
    // بند الأب لا يتضمن نص الابن، والابن لا يتضمن نص الأب
    expect(itemOne.visibleText).not.toContain('nested child');
    expect(nested.visibleText).not.toContain('item two');
    // نطاقاتهما لا تتداخل
    expect(nested.startLine).toBeGreaterThan(itemOne.endLine);
  });

  it('البند متعدد الأسطر يبقى بلوكًا واحدًا بنطاق كامل', () => {
    const multi = blocks.find((b) => b.visibleText.includes('two lines'))!;
    expect(multi.endLine).toBeGreaterThan(multi.startLine);
    expect(multi.visibleText).toContain('item three with continuation');
  });

  it('كتلة الشفرة المسوّرة بلوك واحد بمحتواها الحرفي بما فيه *', () => {
    const fence = blocks.find((b) => b.markdown.includes('```html'))!;
    expect(fence).toBeDefined();
    expect(fence.visibleText).toContain('<h1>code block</h1>');
    expect(fence.visibleText).toContain('a * b');
    expect(fence.endLine - fence.startLine).toBeGreaterThanOrEqual(2);
  });

  it('فقرة داخل blockquote بلوك بالنص المرئي دون علامات الاقتباس', () => {
    const quoted = blocks.find((b) => b.visibleText.includes('quoted paragraph'))!;
    expect(quoted).toBeDefined();
    expect(quoted.visibleText).not.toContain('>');
  });

  it('صورة منفردة تُمثل ببلوك نصه المرئي هو الـ alt', () => {
    const image = blocks.find((b) => b.markdown.includes('!['))!;
    expect(image).toBeDefined();
    expect(image.visibleText).toBe('Standalone image alt text');
  });

  it('لا ينتج بلوكات فارغة أصلًا (الأسطر الفارغة لا تظهر)', () => {
    expect(blocks.every((b) => b.visibleText.length > 0 || b.markdown.includes('!['))).toBe(true);
  });
});
