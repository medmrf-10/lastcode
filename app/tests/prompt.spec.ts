import { describe, expect, it } from 'vitest';
import {
  buildUserMessage,
  CORE_LESSONS_HEADER,
  RECAP_HEADER,
  formatBlock,
} from '../src/llm/message.js';
import { loadSystemPrompt } from '../src/paths.js';
import { splitSourceBlocks } from '../src/domain/blocks.js';

/**
 * إثبات أن الـ prompt يميز recap والتمارين عن الدروس الأساسية، وأن رسالة المستخدم
 * ترسل الدروس كبلوكات بمعلوماتها الكاملة، وأن قواعد الاكتمال والتغطية والأدلة الحرفية مثبتة.
 */

const LESSON = `# One

HTML is a _markup_ language. It does not contain programming logic.

\`\`\`html
<h1>Hi</h1>
\`\`\`
`;

const RECAP = `# Chapter recap

- HTML is a markup language.
`;

const blocks = splitSourceBlocks('lessons/One.md', LESSON);

describe('prompt الاستخراج', () => {
  it('قواعد النظام تحصر الاستخراج في البلوكات الأساسية وتفرض التغطية', () => {
    const prompt = loadSystemPrompt();

    // البلوكات هي المصدر الوحيد
    expect(prompt).toContain('بلوكات الدروس الأساسية');
    expect(prompt).toContain('هو الحقيقة الوحيدة');
    expect(prompt).toContain('ممنوع إضافة أي معرفة خارجية');

    // التغطية الإلزامية ولا إسقاط صامت
    expect(prompt).toContain('coverage');
    expect(prompt).toMatch(/ممنوع إسقاط أي بلوك بصمت/);
    expect(prompt).toMatch(/افحص كل بلوك أساسي واحدًا واحدًا/);
    expect(prompt).toMatch(/التكرار ليس سبب استبعاد/);

    // أسباب الاستبعاد الثلاثة المحصورة، والمنعَان صراحة
    expect(prompt).toContain('`administrative`');
    expect(prompt).toContain('`course_meta`');
    expect(prompt).toContain('`media_only`');
    expect(prompt).toContain('لا يوجد `duplicate` ولا `low_importance`');

    // الاكتمال: كل معلومة تعليمية، والأمثلة تُربط لا تُستبعد
    expect(prompt).toMatch(/استخرج كل معلومة تعليمية حتى لو كانت تاريخية/);
    expect(prompt).toMatch(/لا تُستبعد لمجرد أنها مثال/);

    // التمارين ❌ لا تتحول إلى ذرات
    expect(prompt).toContain('❌');
    expect(prompt).toMatch(/ممنوع تحويلها إلى ذرات/);

    // recap مادة تحقق لا مصدر ذرات، وتحذيره بعد بحث دلالي
    expect(prompt).toMatch(/recap ليس مصدرًا مستقلًا لذرات جديدة/);
    expect(prompt).toMatch(/لا تنشئ نسخة ثانية|لا يُستشهد به في `sourceRefs`/);
    expect(prompt).toMatch(/قبل البحث الدلالي في كل البلوكات الأساسية/);

    // تجريد المعلومة: الأمثلة دليل لا ذرات، والعناوين أسماء تمييز لا تكرار
    expect(prompt).toMatch(/ما القاعدة أو المفهوم الذي يبقى صحيحًا لو حذفنا المثال/);
    expect(prompt).toMatch(/ممنوع إنشاء ذرة لكل مثال/);
    expect(prompt).toContain('ممنوع فيه الأعلام والمنتجات');

    // استقلال العبارة: تُكتب لقارئ لم يقرأ الدرس، ويُمنع نقل الغمضم كما هو
    expect(prompt).toMatch(/هل تبقى العبارة مفهومة بذاتها/);
    expect(prompt).toMatch(/ممنوع نقل كلمات الدرس الغامضة أو المجازية/);
    expect(prompt).toMatch(/متسامحة مع ماذا/);
    expect(prompt).toMatch(/توضيح المعنى الضمني/);

    // استقلال الذرة عن منصة الكورس: حقائق بيئة الدراسة استبعاد إداري لا ذرات
    expect(prompt).toMatch(/حقائق عن منصة الكورس نفسها/);
    expect(prompt).toMatch(/اختبار الجمهور/);
    expect(prompt).toMatch(/لا يدرس على منصة هذا الكورس/);
    expect(prompt).toMatch(/سياق بيئة دراسة/);
    expect(prompt).toMatch(/محرر سطح المكتب للكورس ولا يعمل من الجوال/);

    // كشف التكرار: داخليًا (اختبار التداخل وفصل التعريف عن القاعدة) ومع قاعدة المعرفة
    expect(prompt).toMatch(/اختبار التداخل قبل التسليم/);
    expect(prompt).toMatch(/التعريف يعرّف/);
    expect(prompt).toMatch(/duplicateOf/);
    expect(prompt).toMatch(/الذرات المعتمدة في قاعدة المعرفة/);
    expect(prompt).toMatch(/ممنوع استعمال معرفات قاعدة المعرفة/);

    // الأنواع الجديدة
    expect(prompt).toContain('`fact`');
    expect(prompt).toContain('`constraint`');

    // عقد الأدلة الحرفي داخل البلوك
    expect(prompt).toMatch(/بلوك أساسي واحد فقط/);
    expect(prompt).toMatch(/ممنوع داخل `evidence`/);
    expect(prompt).toContain('إعادة الصياغة');
    expect(prompt).toMatch(/دمج سطور متباعدة/);
    expect(prompt).toMatch(/`\.\.\.`|`…`/);
    expect(prompt).toMatch(/مرجعين مستقلين في `sourceRefs`/);
    expect(prompt).toMatch(/ممنوع الاستشهاد بملفات recap/);
  });

  it('مثال الرد في الـ prompt يضم coverage وblockId', () => {
    const prompt = loadSystemPrompt();
    expect(prompt).toContain('"blockId"');
    expect(prompt).toContain('"coverage"');
    expect(prompt).toContain('"status": "covered"');
    expect(prompt).toContain('"status": "excluded"');
  });
});

describe('رسالة المستخدم (بلوكات + recap منفصل)', () => {
  it('ترسل كل بلوك بمعرفه ومساره وقسمه ونطاق أسطره ومحتواه الخام', () => {
    const message = buildUserMessage(blocks, [
      { file: 'lessons/Chapter recap.md', content: RECAP },
    ]);

    const coreIndex = message.indexOf(CORE_LESSONS_HEADER);
    const recapIndex = message.indexOf(RECAP_HEADER);
    expect(coreIndex).toBeGreaterThan(-1);
    expect(recapIndex).toBeGreaterThan(coreIndex);

    for (const block of blocks) {
      expect(message).toContain(`[${block.id}]`);
      expect(message).toContain(`file: ${block.file}`);
      expect(message).toContain(`section: ${block.section}`);
      expect(message).toContain(`lines: ${block.startLine}-${block.endLine}`);
      expect(message).toContain(block.markdown);
    }
  });

  it('لا تسرب تمارين ❌ ولا تجعل recap ضمن البلوكات', () => {
    const message = buildUserMessage(blocks, [
      { file: 'lessons/Chapter recap.md', content: RECAP },
    ]);
    expect(message).not.toContain('❌');
    // recap قسم خام منفصل، لا بلوكات له
    expect(message).not.toContain('lessons/Chapter recap.md#b');
    const recapFileIndex = message.indexOf('### ملف: lessons/Chapter recap.md');
    expect(recapFileIndex).toBeGreaterThan(message.indexOf(RECAP_HEADER));
  });

  it('formatBlock يسوّر المحتوى بأربعة backticks كي لا تتعارض مع أسوار الدروس', () => {
    const block = blocks.find((b) => b.markdown.includes('```html'))!;
    const formatted = formatBlock(block);
    expect(formatted).toContain('````markdown');
    expect(formatted.split('````').length - 1).toBeGreaterThanOrEqual(2);
  });
});
