import MarkdownIt, { type Token } from 'markdown-it';
import { visibleText } from '../schema/markdown.js';

/**
 * تقسيم درس Markdown إلى وحدات مصدر ثابتة (SourceBlock) عبر parsing حقيقي (markdown-it).
 *
 * الوحدة = أصغر كتلة تعليمية طبيعية: فقرة، أو بند قائمة (بمحتواه الخاص دون بنوده الأبناء)،
 * أو كتلة شفرة مسوّرة/مزاحة. العناوين ليست blocks؛ أقرب عنوان سابق يصبح `section`.
 * نطاقات الأسطر متجاورة بلا تداخل (من خريطة الأسطر التي يعطيها المحلل نفسه لكل فقرة)،
 * والمعرفات deterministic بترتيب المستند.
 */

export interface SourceBlock {
  /** ثابت داخل الملف مثل "lessons/One.md#b001" */
  id: string;
  /** المسار النسبي لجذر الـ vault */
  file: string;
  /** أقرب heading سابق (النص المرئي له)، أو "(المقدمة)" */
  section: string;
  /** 1-based */
  startLine: number;
  /** inclusive */
  endLine: number;
  /** المقطع الخام المتصل من الملف كما ورد */
  markdown: string;
  /** النص المرئي للمقطع */
  visibleText: string;
}

const md = new MarkdownIt('default', { html: false, linkify: false, typographer: false });

const DEFAULT_SECTION = '(المقدمة)';

function pad(n: number): string {
  return String(n).padStart(3, '0');
}

/** يزيل المسافة البادئة المشتركة قبل إعادة تحليل المقطع وحده (للنص المرئي فقط؛ الخام يبقى كما ورد). */
function dedent(raw: string): string {
  const lines = raw.split('\n');
  let min = Infinity;
  for (const line of lines) {
    if (line.trim().length === 0) continue;
    const indent = /^[ \t]*/.exec(line)![0].length;
    if (indent < min) min = indent;
  }
  if (!Number.isFinite(min) || min === 0) return raw;
  return lines.map((line) => (line.trim().length === 0 ? line : line.slice(min))).join('\n');
}

/**
 * يقسم محتوى ملف درس إلى blocks بترتيب المستند.
 * @param file المسار النسبي لجذر الـ vault (يُستعمل في المعرف).
 * @param markdown المحتوى الخام للملف.
 */
export function splitSourceBlocks(file: string, markdown: string): SourceBlock[] {
  const lines = markdown.split(/\r?\n/);
  const tokens = md.parse(markdown, {});

  const blocks: SourceBlock[] = [];
  let section = DEFAULT_SECTION;
  let counter = 0;

  const pushBlock = (map: [number, number]): void => {
    const [start, end] = map;
    if (typeof start !== 'number' || typeof end !== 'number') return;
    if (end <= start) return;

    const raw = lines.slice(start, end).join('\n');
    if (raw.trim().length === 0) return;

    const visible = visibleText(dedent(raw)).trim();
    if (visible.length === 0 && !/!\[[^\]]*\]\(|<img/.test(raw)) return; // فارغ فعلاً بلا وسائط

    counter += 1;
    blocks.push({
      id: `${file}#b${pad(counter)}`,
      file,
      section,
      startLine: start + 1,
      endLine: end, // خريطة المحلل [start, end) والنهاية inclusive
      markdown: raw,
      visibleText: visible,
    });
  };

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i]!;

    if (token.type === 'heading_open') {
      // العنوان ليس blockًا؛ نصه المرئي يصبح section للكتل التالية
      const inline = tokens[i + 1];
      if (inline?.type === 'inline') {
        const heading = visibleText(inline.content).trim();
        if (heading.length > 0) section = heading;
      }
      continue;
    }

    // فقرة (أي عمق: مستوى أعلى، داخل قائمة، داخل blockquote) أو كتلة شفرة
    if (token.type === 'paragraph_open' || token.type === 'fence' || token.type === 'code_block') {
      if (token.map) pushBlock(token.map as [number, number]);
    }
  }

  return blocks;
}
