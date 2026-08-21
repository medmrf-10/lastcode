import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseRoadmap, selectChapters } from '../src/domain/parseRoadmap.js';
import { indexVault, resolveItems } from '../src/domain/resolve.js';
import { packageRoot } from '../src/paths.js';

/**
 * الاختبارات 1 و2 من المواصفة: تحليل الفصلين 1 و2 من الخارطة الحالية فعلًا،
 * وتصنيف عناصر ❌ كتمارين دون محاولة حلها كملفات دروس.
 */

const repoRoot = path.resolve(packageRoot, '..');
const roadmapPath = path.join(repoRoot, 'roadmaps', 'L-2-frontend-1-jobran-1.md');

function resolveRealChapters(chapters: number[]) {
  const parsed = parseRoadmap(fs.readFileSync(roadmapPath, 'utf8'));
  const index = indexVault(repoRoot, { excludedAbsolute: [packageRoot] });
  return resolveItems(selectChapters(parsed, chapters), index);
}

describe('تحليل الخارطة الحالية (L-2-frontend-1-jobran-1)', () => {
  it('يفهم بنية القائمة المرقمة: فصول بمستوى أول وعناصر بمستوى ثانٍ', () => {
    const parsed = parseRoadmap(fs.readFileSync(roadmapPath, 'utf8'));
    expect(parsed.length).toBe(139);
    expect(parsed[0]?.title).toBe('Intro to HTML');
    expect(parsed[0]?.items.length).toBe(5);
    expect(parsed[1]?.title).toBe('Intro to semantics');
    expect(parsed[1]?.items.length).toBe(7);
  });

  it('يختار الفصول المطلوبة فقط ويرفض أرقامًا غير موجودة', () => {
    const parsed = parseRoadmap(fs.readFileSync(roadmapPath, 'utf8'));
    const selected = selectChapters(parsed, [2, 1]);
    expect(selected.map((c) => c.number)).toEqual([2, 1]);
    expect(() => selectChapters(parsed, [140])).toThrow('فصول غير موجودة');
  });

  it('يحل روابط الفصلين 1 و2: درس واحد في الفصل الأول، وثلاثة دروس وrecap في الثاني', () => {
    const items = resolveRealChapters([1, 2]);
    const ch1 = items.filter((i) => i.chapter === 1 && i.kind === 'lesson');
    expect(ch1.map((l) => l.file)).toEqual(['lessons/Intro to HTML.md']);
    const ch2 = items.filter((i) => i.chapter === 2 && i.kind === 'lesson');
    expect(ch2.map((l) => l.file)).toEqual([
      'lessons/Intro to Semantics.md',
      'lessons/Intro to Headings.md',
      'lessons/Intro to emmet.md',
    ]);
  });

  it('يصنف ملف Chapter N recap كمادة تحقق لا كدرس أساسي', () => {
    const items = resolveRealChapters([1, 2]);
    const recaps = items.filter((i) => i.kind === 'recap');
    expect(recaps.map((r) => r.file)).toEqual(['lessons/Chapter 2 recap.md']);
    expect(items.filter((i) => i.kind === 'lesson').map((l) => l.file)).not.toContain(
      'lessons/Chapter 2 recap.md',
    );
  });

  it('يعتبر العناصر ذات ❌ تمارين ولا يحلها كملفات دروس', () => {
    const items = resolveRealChapters([1, 2]);
    const exercises = items.filter((i) => i.kind === 'exercise');
    expect(exercises.length).toBe(7);
    expect(exercises.map((e) => e.text)).toContain('Welcome! ❌');
    expect(exercises.map((e) => e.text)).toContain('Label the heading I ❌');
    for (const exercise of exercises) {
      expect(exercise.text.includes('❌')).toBe(true);
      expect(exercise.file).toBeUndefined();
    }
    // لا تمارين تتسرب إلى الدروس أو المفقود
    expect(items.filter((i) => i.kind !== 'exercise').every((i) => !i.text.includes('❌'))).toBe(
      true,
    );
  });

  it('لا عناصر مفقودة في الفصلين 1 و2 من الخارطة الحالية', () => {
    const items = resolveRealChapters([1, 2]);
    expect(items.filter((i) => i.kind === 'missing')).toEqual([]);
  });
});
