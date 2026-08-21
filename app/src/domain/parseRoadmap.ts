/**
 * تحليل بنية الخارطة: قائمة مرقمة من مستويين —
 * المستوى الأول فصول (بلا مسافة بادئة)، والمستوى الثاني عناصر داخل الفصل (بادئة جدولة/مسافات).
 */

export interface RawItem {
  /** رقم الفصل التسلسلي (1-based) */
  chapter: number;
  chapterTitle: string;
  /** ترتيب العنصر داخل فصله (1-based) */
  order: number;
  /** نص العنصر كما ورد (بدون الترقيم) */
  text: string;
}

export interface RawChapter {
  /** رقم الفصل التسلسلي (1-based بترتيب الظهور) */
  number: number;
  title: string;
  items: RawItem[];
}

const LIST_LINE = /^(\s*)\d+\.\s+(.*?)\s*$/;

export function parseRoadmap(content: string): RawChapter[] {
  const chapters: RawChapter[] = [];
  let current: RawChapter | null = null;

  for (const line of content.split(/\r?\n/)) {
    const match = LIST_LINE.exec(line);
    if (!match) continue;
    const indent = match[1] ?? '';
    const text = match[2] ?? '';

    if (indent.length === 0) {
      current = { number: chapters.length + 1, title: text, items: [] };
      chapters.push(current);
    } else if (current) {
      current.items.push({
        chapter: current.number,
        chapterTitle: current.title,
        order: current.items.length + 1,
        text,
      });
    }
  }
  return chapters;
}

export function selectChapters(chapters: RawChapter[], wanted: number[]): RawChapter[] {
  const available = new Set(chapters.map((c) => c.number));
  const missing = wanted.filter((n) => !available.has(n));
  if (missing.length > 0) {
    throw new Error(
      `فصول غير موجودة في الخارطة: ${missing.join(', ')} (المتاح: 1..${chapters.length})`,
    );
  }
  return wanted.map((n) => chapters[n - 1]).filter((c): c is RawChapter => c !== undefined);
}

/**
 * تحليل صارم لقائمة الفصول: أعداد صحيحة موجبة كاملة مفصولة بفواصل، بلا تكرار.
 * يرفض `1abc` و`1.5` و`0` والرموز الفارغة والفصول المكرّرة برسائل واضحة.
 */
export function parseChapterList(raw: string): number[] {
  if (raw.trim() === '') {
    throw new Error('قائمة الفصول فارغة — الصيغة المقبولة مثل 1,2');
  }

  const chapters: number[] = [];
  const seen = new Set<number>();

  for (const token of raw.split(',')) {
    const trimmed = token.trim();
    if (!/^\d+$/.test(trimmed)) {
      throw new Error(
        `قيمة فصل غير صالحة: "${trimmed}" — الصيغة المقبولة أعداد صحيحة موجبة مفصولة بفواصل مثل 1,2`,
      );
    }
    const n = Number(trimmed);
    if (n < 1) {
      throw new Error(`رقم الفصل يجب أن يكون 1 أو أكبر، وصل: ${trimmed}`);
    }
    if (seen.has(n)) {
      throw new Error(`رقم فصل مكرر: ${n}`);
    }
    seen.add(n);
    chapters.push(n);
  }
  return chapters;
}
