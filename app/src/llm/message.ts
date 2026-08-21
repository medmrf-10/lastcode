import type { SourceBlock } from '../domain/blocks.js';

/**
 * بناء رسالة المستخدم: الدروس الأساسية تُرسل كـ source blocks ثابتة (id/section/lines/markdown)
 * كي تُراجع كل وحدة وتُغطى، وملفات recap قسمًا منفصلًا للتحقق فقط. التمارين ❌ لا تُرسل إطلاقًا.
 */

export interface SentFile {
  /** المسار النسبي لجذر الـ vault */
  file: string;
  content: string;
}

export const CORE_LESSONS_HEADER = '## الدروس الأساسية كبلوكات مصدر (مصدر الاستخراج الوحيد)';
export const RECAP_HEADER =
  '## ملفات التحقق (recap) — ليست مصدرًا لذرات جديدة؛ للتغطية والتحقق فقط';
export const KB_HEADER = '## الذرات المعتمدة في قاعدة المعرفة — ممنوع تكرارها';

/** ذرة قائمة في قاعدة المعرفة تُعرض على المزود لكشف التكرار */
export interface KbAtomRef {
  id: string;
  statement: string;
  kind: string;
}

export function formatBlock(block: SourceBlock): string {
  return [
    `#### [${block.id}] | file: ${block.file} | section: ${block.section} | lines: ${block.startLine}-${block.endLine}`,
    '````markdown',
    block.markdown,
    '````',
  ].join('\n');
}

export function buildUserMessage(
  coreBlocks: SourceBlock[],
  recaps: SentFile[],
  kbAtoms: KbAtomRef[] = [],
): string {
  const parts: string[] = [];

  if (kbAtoms.length > 0) {
    parts.push(KB_HEADER);
    for (const atom of kbAtoms) {
      parts.push(`- [${atom.id}] (${atom.kind}) ${atom.statement}`);
    }
    parts.push('');
  }

  parts.push(CORE_LESSONS_HEADER);
  if (coreBlocks.length === 0) {
    parts.push('(لا توجد بلوكات أساسية)');
  }
  let currentFile = '';
  for (const block of coreBlocks) {
    if (block.file !== currentFile) {
      currentFile = block.file;
      parts.push(`\n### ملف الدرس: ${currentFile}`);
    }
    parts.push(formatBlock(block));
  }

  parts.push(RECAP_HEADER);
  if (recaps.length === 0) {
    parts.push('(لا توجد ملفات recap)');
  }
  for (const recap of recaps) {
    parts.push(`\n### ملف: ${recap.file}\n\n${recap.content.trim()}\n`);
  }

  return parts.join('\n');
}
