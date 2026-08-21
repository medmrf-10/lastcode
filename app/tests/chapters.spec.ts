import { describe, expect, it } from 'vitest';
import { parseChapterList } from '../src/domain/parseRoadmap.js';

/** التحليل الصارم لخيار --chapters: أعداد صحيحة موجبة كاملة بلا تكرار. */

describe('parseChapterList', () => {
  it('يقبل القوائم الصحيحة مع مسافات اختيارية', () => {
    expect(parseChapterList('1,2')).toEqual([1, 2]);
    expect(parseChapterList(' 1 , 2 ')).toEqual([1, 2]);
    expect(parseChapterList('3')).toEqual([3]);
    expect(parseChapterList('1,2,10')).toEqual([1, 2, 10]);
  });

  it('يرفض الرموز غير الصحيحة برسائل واضحة', () => {
    expect(() => parseChapterList('1abc,2')).toThrow(/قيمة فصل غير صالحة/);
    expect(() => parseChapterList('1.5')).toThrow(/قيمة فصل غير صالحة/);
    expect(() => parseChapterList('-1')).toThrow(/قيمة فصل غير صالحة/);
    expect(() => parseChapterList('1,,2')).toThrow(/قيمة فصل غير صالحة/);
    expect(() => parseChapterList('a')).toThrow(/قيمة فصل غير صالحة/);
  });

  it('يرفض الصفر والأرقام غير الموجبة', () => {
    expect(() => parseChapterList('0')).toThrow(/1 أو أكبر/);
  });

  it('يرفض الفصول المكررة بدل إرسال الدرس مرتين', () => {
    expect(() => parseChapterList('2,2')).toThrow(/فصل مكرر/);
    expect(() => parseChapterList('1,2,01')).toThrow(/فصل مكرر/);
  });

  it('يرفض القائمة الفارغة', () => {
    expect(() => parseChapterList('')).toThrow(/قائمة الفصول فارغة/);
    expect(() => parseChapterList('   ')).toThrow(/قائمة الفصول فارغة/);
  });
});
