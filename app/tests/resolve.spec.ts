import { describe, expect, it } from 'vitest';
import { parseRoadmap, selectChapters } from '../src/domain/parseRoadmap.js';
import {
  AmbiguityError,
  extractWikiLink,
  indexVault,
  resolveItems,
  resolveWikiLink,
} from '../src/domain/resolve.js';
import { makeTmpVault } from './helpers.js';

/** الاختبارات 3 و4 و5: حل الروابط عبر الـ vault، العناصر المفقودة، والغموض. */

function resolveFixture(files: Record<string, string>, roadmap: string, chapters: number[]) {
  const vault = makeTmpVault(files);
  try {
    const parsed = parseRoadmap(roadmap);
    const index = indexVault(vault.root);
    return resolveItems(selectChapters(parsed, chapters), index);
  } finally {
    vault.cleanup();
  }
}

describe('حل الروابط داخل الـ vault', () => {
  it('يجد lessons/Intro to HTML.md والملفات الموجودة في الجذر', () => {
    const items = resolveFixture(
      {
        'roadmaps/map.md': '',
        'lessons/Intro to HTML.md': '# Intro to HTML',
        'Readme.md': '# Readme',
      },
      '# map\n\n1. First\n\t1. [[Intro to HTML]]\n\t2. [[Readme]]\n',
      [1],
    );
    expect(items.filter((i) => i.kind === 'lesson').map((l) => l.file)).toEqual([
      'lessons/Intro to HTML.md',
      'Readme.md',
    ]);
  });

  it('يصنف درسًا نصيًا بلا ملف في فصل لاحق كـ missing دون لمس بقية الخارطة', () => {
    const items = resolveFixture(
      { 'lessons/A.md': '# A' },
      '# map\n\n1. First\n\t1. [[A]]\n2. Later\n\t1. Plain lesson no file\n\t2. Another one\n',
      [2],
    );
    expect(items.every((i) => i.kind === 'missing')).toBe(true);
    expect(items.map((i) => i.text)).toEqual(['Plain lesson no file', 'Another one']);
    expect(items.every((i) => i.link === undefined)).toBe(true);
  });

  it('يصنف رابط wiki بلا ملف مقابل كـ missing مع الإبقاء على اسم الرابط', () => {
    const items = resolveFixture(
      { 'lessons/A.md': '# A' },
      '# map\n\n1. First\n\t1. [[No Such Lesson]]\n',
      [1],
    );
    expect(items[0]?.kind).toBe('missing');
    expect(items[0]?.link).toBe('No Such Lesson');
  });

  it('يفشل برسالة ambiguity واضحة عند تعدد الملفات بالاسم نفسه بدل الاختيار العشوائي', () => {
    const vault = makeTmpVault({
      'a/Dup.md': '# Dup',
      'b/Dup.md': '# Dup',
    });
    try {
      const index = indexVault(vault.root);
      const result = resolveWikiLink(index, 'Dup');
      expect(result).toMatchObject({ status: 'ambiguous', candidates: ['a/Dup.md', 'b/Dup.md'] });

      const roadmap = '# map\n\n1. First\n\t1. [[Dup]]\n';
      expect(() => resolveItems(selectChapters(parseRoadmap(roadmap), [1]), index)).toThrowError(
        AmbiguityError,
      );
      expect(() => resolveItems(selectChapters(parseRoadmap(roadmap), [1]), index)).toThrow(/Dup/);
    } finally {
      vault.cleanup();
    }
  });

  it('يعامل العنصر المرتبط الموسوم بـ ❌ كتمرين ولا يحل رابطه كملف درس', () => {
    const items = resolveFixture(
      { 'lessons/A.md': '# A' },
      '# map\n\n1. First\n\t1. [[A]] ❌\n\t2. [[A]]\n',
      [1],
    );
    expect(items[0]?.kind).toBe('exercise');
    expect(items[0]?.file).toBeUndefined();
    expect(items[1]?.kind).toBe('lesson');
    expect(items[1]?.file).toBe('lessons/A.md');
  });

  it('يستخرج أول رابط wiki فقط ويدعم الاسم المستعار والمسار الفرعي', () => {
    expect(extractWikiLink('[[Intro to HTML]]')).toBe('Intro to HTML');
    expect(extractWikiLink('[[Intro to HTML|html intro]]')).toBe('Intro to HTML');
    expect(extractWikiLink('[[Intro to HTML#Syntax]]')).toBe('Intro to HTML');
    expect(extractWikiLink('[[Intro to HTML.md]]')).toBe('Intro to HTML');
    expect(extractWikiLink('نص بلا رابط')).toBeUndefined();
  });
});

describe('حل الروابط ذات المسار عبر الـ vault', () => {
  const PATH_VAULT = {
    'lessons/Nested Lesson.md': '# nested',
    'other/Nested Lesson.md': '# other',
    'Readme.md': '# readme',
  };

  it('يحل [[lessons/Nested Lesson]] بالمسار رغم تعدد الاسم نفسه في مجلدات أخرى', () => {
    const vault = makeTmpVault(PATH_VAULT);
    try {
      const index = indexVault(vault.root);

      // بالاسم وحده غامض
      expect(resolveWikiLink(index, 'Nested Lesson')).toMatchObject({ status: 'ambiguous' });

      // بالمسار يُحل فريدًا
      expect(resolveWikiLink(index, 'lessons/Nested Lesson')).toEqual({
        status: 'resolved',
        path: 'lessons/Nested Lesson.md',
      });
      expect(resolveWikiLink(index, 'other/Nested Lesson')).toEqual({
        status: 'resolved',
        path: 'other/Nested Lesson.md',
      });

      // ضمن تدفق resolveItems مع الاسم المستعار والامتداد
      const items = resolveItems(
        selectChapters(
          parseRoadmap(
            '# map\n\n1. First\n\t1. [[lessons/Nested Lesson.md|الدرس]]\n\t2. [[Readme]]\n',
          ),
          [1],
        ),
        index,
      );
      expect(items.filter((i) => i.kind === 'lesson').map((l) => l.file)).toEqual([
        'lessons/Nested Lesson.md',
        'Readme.md',
      ]);
    } finally {
      vault.cleanup();
    }
  });

  it('يرفض الخروج من الـ vault عبر .. ويعّد الروابط غير الموجودة missing', () => {
    const vault = makeTmpVault(PATH_VAULT);
    try {
      const index = indexVault(vault.root);
      expect(resolveWikiLink(index, '../outside/Lesson')).toEqual({ status: 'missing' });
      expect(resolveWikiLink(index, 'lessons/No Such Lesson')).toEqual({ status: 'missing' });
    } finally {
      vault.cleanup();
    }
  });
});
