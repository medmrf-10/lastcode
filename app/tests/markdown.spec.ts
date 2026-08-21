import { describe, expect, it } from 'vitest';
import { visibleText } from '../src/schema/markdown.js';
import { evidenceMatches, normalizeForEvidence, validateAtoms } from '../src/schema/validate.js';
import type { LlmResponse } from '../src/schema/proposal.js';
import { splitSourceBlocks } from '../src/domain/blocks.js';
import { glmLessonFiles, glmRejectedEvidences } from './fixtures/glm-evidence.fixture.js';

/**
 * مطابقة صارمة للنص المرئي في Markdown:
 * المسار الخام أولًا كما كان، ثم canonicalization مرئي عبر markdown-it (لا regex عام).
 */

describe('visibleText (النص المرئي لـ Markdown)', () => {
  it('يزيل محارف emphasis/strong/inline-code مع إبقاء محتواها', () => {
    expect(visibleText('a _markup_ language')).toBe('a markup language');
    expect(visibleText('**HTML** and *CSS*')).toBe('HTML and CSS');
    expect(visibleText('press the `Tab` key')).toBe('press the Tab key');
    expect(visibleText('`` `code` with ticks ``')).toBe('`code` with ticks');
  });

  it('يحوّل الروابط إلى نص الرابط لا URL', () => {
    expect(visibleText('see [MDN docs](https://developer.mozilla.org) now')).toBe(
      'see MDN docs now',
    );
    expect(visibleText('<https://example.com>')).toBe('https://example.com');
  });

  it('يبقي محتوى code fences وinline code حرفيًا بما فيه _ و*', () => {
    expect(visibleText('```html\n<h1>Hi</h1>\na * b\nsnake_case\n```')).toBe(
      '<h1>Hi</h1>\na * b\nsnake_case\n',
    );
    expect(visibleText('`a * b`')).toBe('a * b');
  });

  it('لا يمس الرموز خارج سياق التنسيق: snake_case و a * b يبقيان كما هما', () => {
    expect(visibleText('a snake_case var and a * b and x_y')).toBe(
      'a snake_case var and a * b and x_y',
    );
  });

  it('يوحد الأسطر والمسافات وNBSP في الإخراج عبر المطبع اللاحق', () => {
    expect(normalizeForEvidence(visibleText('line one\nline two'))).toBe('line one line two');
    expect(normalizeForEvidence(visibleText('heading 1\u00a0`h1`\u00a0element'))).toBe(
      'heading 1 h1 element',
    );
  });

  it('يفك كيانات HTML إلى محارفها المرئية', () => {
    expect(visibleText('a &amp; b')).toBe('a & b');
  });

  it('يبقي الوسوم النصية مثل <h1> في النص العادي كما وردت', () => {
    expect(visibleText('write <h1> here and </h1> there')).toBe('write <h1> here and </h1> there');
  });
});

describe('evidenceMatches (المساران)', () => {
  it('المسار الخام الحالي يبقى ناجحًا دون تغيير', () => {
    const source = 'HTML is a markup language. It does not contain programming logic.';
    expect(evidenceMatches(source, 'a markup language')).toBe(true);
    // بلا أي markdown في الطرفين: المسار الأول يحسم
    expect(evidenceMatches(source, 'a markup language')).toBe(true);
  });

  it('اختلاف backticks/emphasis/strong/NBSP فقط يمر عبر المسار المرئي', () => {
    expect(evidenceMatches('HTML is a _markup_ language.', 'HTML is a markup language.')).toBe(
      true,
    );
    expect(evidenceMatches('press the `Tab` key', 'press the Tab key')).toBe(true);
    expect(evidenceMatches('**bold** and _em_', 'bold and em')).toBe(true);
    expect(evidenceMatches('heading 1\u00a0`h1`\u00a0element', 'heading 1 h1 element')).toBe(true);
    // والاتجاه المعاكس: الدليل يحمل العلامات والمصدر مرئي
    expect(evidenceMatches('HTML is a markup language.', 'HTML is a _markup_ language.')).toBe(
      true,
    );
  });

  it('[label](url) يطابق label فقط: لا URL ولا label مختلف', () => {
    const source = 'Read the [Semantics article](https://erikkroes.nl/blog/semantics/) first.';
    expect(evidenceMatches(source, 'Read the Semantics article first.')).toBe(true);
    expect(evidenceMatches(source, 'Read the https://erikkroes.nl/blog/semantics/ first.')).toBe(
      false,
    );
    expect(evidenceMatches(source, 'Read the Other article first.')).toBe(false);
  });

  it('حذف كلمة أو إعادة ترتيب أو صياغة أو ... تبقى مرفوضة', () => {
    const source = 'HTML is a _markup_ language. It does not contain programming logic.';
    expect(evidenceMatches(source, 'HTML is a language.')).toBe(false); // حذف كلمة
    expect(evidenceMatches(source, 'a markup is HTML language')).toBe(false); // ترتيب
    expect(evidenceMatches(source, 'HTML is a descriptive language.')).toBe(false); // صياغة
    expect(evidenceMatches(source, 'HTML is a ... language.')).toBe(false); // اختصار بـ ...
  });

  it('رموز المحتوى لا تُفقد ولا تسمح باقتباس محرف', () => {
    const source =
      'Use `snake_case` names and compute `a * b` in the ```\nconst x = 1 * 2;\n``` block.';
    expect(evidenceMatches(source, 'Use snake_case names')).toBe(true);
    expect(evidenceMatches(source, 'compute a * b in the')).toBe(true);
    expect(evidenceMatches(source, 'const x = 1 * 2;')).toBe(true);
    // اقتباس محرف: رموز تظهر في العرض لا يعني أنها موجودة كنص خارج الشفرة
    expect(evidenceMatches(source, 'Use snake\u005fcase names and compute a * b nowhere')).toBe(
      false,
    );
    // محرف: الكيان يُفك في الطرفين، فالكلمة غير الموجودة تبقى مرفوضة
    expect(evidenceMatches(source, 'Use snake_case variables')).toBe(false);
  });

  it('اقتباس يختفي كليًا بعد التحويل المرئي يُرفض', () => {
    expect(evidenceMatches('plain source text', '``')).toBe(false);
    expect(evidenceMatches('plain source text', '*')).toBe(false);
  });
});

describe('أدلة GLM الثمانية من أول طلب حقيقي (fixtures مجمّدة)', () => {
  // البلوكات الحقيقية للملفات الثلاثة كما يقسمها النظام
  const blocks = Object.entries(glmLessonFiles).flatMap(([file, content]) =>
    splitSourceBlocks(file, content),
  );

  function buildResponse(evidences: Array<{ atomId: string; file: string; evidence: string }>) {
    const coveredBlockIds = new Set<string>();
    const atoms = evidences.map((pair) => {
      // البلوك الذي يحتوي الدليل فعلاً (بعد canonicalization) هو المرجع الصحيح
      const block = blocks.find(
        (b) => b.file === pair.file && evidenceMatches(b.markdown, pair.evidence),
      );
      expect(block, `بلوك الدليل غير موجود: ${pair.atomId}`).toBeDefined();
      coveredBlockIds.add(block!.id);
      return {
        clientId: pair.atomId,
        title: `عنوان ${pair.atomId}`,
        statement: 'عبارة.',
        kind: 'concept' as const,
        sourceRefs: [
          { file: pair.file, blockId: block!.id, section: block!.section, evidence: pair.evidence },
        ],
        prerequisites: [],
        related: [],
        confidence: 0.9,
      };
    });
    // coverage كامل: المطابق covered والباقي excluded administrative
    const coverage = blocks.map((b) =>
      coveredBlockIds.has(b.id)
        ? {
            blockId: b.id,
            status: 'covered' as const,
            atomIds: evidences
              .filter(
                (p) =>
                  blocks.find((x) => x.file === p.file && evidenceMatches(x.markdown, p.evidence))
                    ?.id === b.id,
              )
              .map((p) => p.atomId),
          }
        : {
            blockId: b.id,
            status: 'excluded' as const,
            reason: 'administrative' as const,
            note: 'سطر تشغيلي/تحديث لا معرفة فيه',
          },
    );
    const response: LlmResponse = { atoms, coverage, warnings: [] };
    return { response, blocks };
  }

  it('كل الأدلة الثمانية المرفوضة سابقًا لاختلاف Markdown فقط تمر الآن داخل بلوكاتها', () => {
    const { response, blocks } = buildResponse(glmRejectedEvidences);
    const files = {
      evidence: new Map(blocks.map((b) => [b.id, b] as const)),
      recapFiles: new Set<string>(),
      visibleFiles: new Set(Object.keys(glmLessonFiles)),
    };
    const issues = validateAtoms(response, files);
    expect(issues).toEqual([]);
  });

  it('تظل الأدلة مرفوضة إن حُذفت كلمة حقيقية من منتصفها', () => {
    // حذف كلمة من المنتصف يكسر التتابع الحرفي بالضرورة (حذف البادئة/اللاحقة يبقى substring!)
    const dropMiddleWord = (text: string): string => {
      const words = text.split(' ');
      if (words.length < 3) return text;
      words.splice(Math.floor(words.length / 2), 1);
      return words.join(' ');
    };
    const mutated = glmRejectedEvidences.slice(0, 3).map((pair) => ({
      ...pair,
      evidence: dropMiddleWord(pair.evidence),
    }));
    // بعد التحريف قد يوجد بلوك "مطابق" جزئيًا أو لا يوجد؛ كلاهما يجب أن ينتهي برفض
    const atoms = mutated.map((pair, i) => ({
      clientId: pair.atomId,
      title: 't',
      statement: 's',
      kind: 'concept' as const,
      sourceRefs: [
        {
          file: pair.file,
          blockId: blocks.find((b) => b.file === pair.file)?.id ?? 'unknown',
          section: 's',
          evidence: pair.evidence,
        },
      ],
      prerequisites: [],
      related: [],
      confidence: 0.9,
    }));
    const coverage = blocks.map((b) =>
      atoms.some((a) => a.sourceRefs[0]?.blockId === b.id)
        ? {
            blockId: b.id,
            status: 'covered' as const,
            atomIds: atoms.filter((a) => a.sourceRefs[0]?.blockId === b.id).map((a) => a.clientId),
          }
        : {
            blockId: b.id,
            status: 'excluded' as const,
            reason: 'administrative' as const,
            note: 'غير معرفي',
          },
    );
    const issues = validateAtoms(
      { atoms, coverage, warnings: [] },
      {
        evidence: new Map(blocks.map((b) => [b.id, b] as const)),
        recapFiles: new Set<string>(),
        visibleFiles: new Set(Object.keys(glmLessonFiles)),
      },
    );
    expect(issues.length).toBeGreaterThanOrEqual(3);
    for (const issue of issues) {
      if (issue.message.includes('اقتباس')) {
        expect(issue.message).toContain('حتى بعد توحيد النص المرئي لـ Markdown');
      }
    }
  });
});
