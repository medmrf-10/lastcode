import path from 'node:path';
import fs from 'node:fs';
import { parseRoadmap, selectChapters, type RawChapter } from './parseRoadmap.js';
import { indexVault, resolveItems, type ResolvedItem } from './resolve.js';

/**
 * التحضير الموحد: دالة واحدة تقرأ الخارطة وتفهرس الـ vault وتحل العناصر مرة واحدة،
 * ويستهلكها كل من ملخص CLI والاستخراج الفعلي، فلا تحليل مزدوج ولا انحراف بين المعروض والمُرسل.
 */

export interface PreparedPlan {
  /** مسار الخارطة المطلق */
  roadmapPath: string;
  /** جذر الـ vault المطلق */
  vaultRoot: string;
  chapters: number[];
  selectedChapters: RawChapter[];
  items: ResolvedItem[];
  /** مسارات الدروس الأساسية (نسبيًا لجذر الـ vault) — المصدر الوحيد المسموح كدليل */
  coreLessonFiles: string[];
  /** مسارات ملفات recap — مرئية للنموذج للتحقق والتغطية فقط */
  recapFiles: string[];
  exercises: Array<{ chapter: number; title: string }>;
  missing: Array<{ chapter: number; title: string; link?: string }>;
}

export interface PreparePlanInput {
  roadmapPath: string;
  vaultRoot: string;
  chapters: number[];
  /** مسارات مطلقة تُستبعد من الفهرسة (مثل جذر حزمة الأداة) */
  excludedAbsolute?: string[];
}

export function preparePlan(input: PreparePlanInput): PreparedPlan {
  const roadmapPath = path.resolve(input.roadmapPath);
  const vaultRoot = path.resolve(input.vaultRoot);
  const chapters = [...input.chapters];

  const allChapters = parseRoadmap(fs.readFileSync(roadmapPath, 'utf8'));
  const selected = selectChapters(allChapters, chapters);
  if (selected.length === 0) {
    throw new Error('لم تُحدد أي فصول.');
  }

  const index = indexVault(vaultRoot, { excludedAbsolute: input.excludedAbsolute ?? [] });
  const items = resolveItems(selected, index);

  return {
    roadmapPath,
    vaultRoot,
    chapters,
    selectedChapters: selected,
    items,
    coreLessonFiles: items.filter((i) => i.kind === 'lesson' && i.file).map((i) => i.file!),
    recapFiles: items.filter((i) => i.kind === 'recap' && i.file).map((i) => i.file!),
    exercises: items
      .filter((i) => i.kind === 'exercise')
      .map((i) => ({ chapter: i.chapter, title: i.text })),
    missing: items
      .filter((i) => i.kind === 'missing')
      .map((i) => ({ chapter: i.chapter, title: i.text, link: i.link })),
  };
}
