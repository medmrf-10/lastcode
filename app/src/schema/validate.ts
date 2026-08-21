import type { LlmResponse, CoverageEntry } from './proposal.js';
import type { SourceBlock } from '../domain/blocks.js';
import { visibleText } from './markdown.js';

/**
 * التحقق الدلالي بعد نجاح تحقق الـ schema:
 *
 * Grounding: كل دليل يُفحص داخل **البلوك** المشار إليه لا في الملف كله.
 * Coverage: كل بلوك أساسي يظهر مرة واحدة بالضبط في coverage، إما covered بذرات
 * معروفة أو excluded بسبب مسموح بملاحظة، وكل ذرة مشمولة ببلوك covered واحد على الأقل.
 *
 * recap مرئي للنموذج للتحقق والتغطية فقط، ولا يقبل كدليل ولا كبلوك.
 * لا إصلاح صامت: أي خطأ يوقف المسار ويُعرض تقرير واضح.
 */

export interface ValidationIssue {
  atomId?: string;
  blockId?: string;
  message: string;
}

export interface ValidationFiles {
  /** البلوكات الأساسية المسموح بها كدليل: blockId -> block */
  evidence: Map<string, SourceBlock>;
  /** مسارات ملفات recap المرئية للنموذج (ليست دليلًا ولا بلوكات) */
  recapFiles: Set<string>;
  /** كل المسارات المرئية للنموذج: الدروس الأساسية + recap */
  visibleFiles: Set<string>;
  /** معرفات الذرات الموجودة في قاعدة المعرفة (للتحقق من duplicateOf) */
  kbIds?: Set<string>;
}

/** تطبيع معقول للمسافات وأحرف العرض الصفري قبل مقارنة الاقتباس بالمصدر. */
export function normalizeForEvidence(text: string): string {
  return text
    .replace(/[\u200b\u200c\u200d\u2060\ufeff]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * مقارنة evidence بالمصدر بمسارين:
 * 1. المطابقة الحالية: substring بعد تطبيع المسافات (النص الخام كما ورد).
 * 2. إن فشلت: مطابقة substring بعد تحويل الطرفين إلى النص المرئي لـ Markdown
 *    (إزالة محارف emphasis/strong/inline-code، تحويل الروابط إلى نصها، توحيد NBSP)
 *    ثم تطبيع المسافات نفسه.
 * الفروق المتعارف عليها في العرض فقط تمر؛ حذف كلمة أو إعادة ترتيب أو صياغة تبقى مرفوضة.
 */
export function evidenceMatches(source: string, evidence: string): boolean {
  const needle = normalizeForEvidence(evidence);
  if (needle.length === 0) return false;
  if (normalizeForEvidence(source).includes(needle)) return true;

  const visibleNeedle = normalizeForEvidence(visibleText(evidence));
  if (visibleNeedle.length === 0) return false; // اقتباس يختفي كليًا بعد التحويل المرئي
  return normalizeForEvidence(visibleText(source)).includes(visibleNeedle);
}

function truncate(text: string, max = 80): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  return normalized.length > max ? `${normalized.slice(0, max)}…` : normalized;
}

/** grounding: فحص ذرة واحدة وأدلتها مقابل البلوكات الأساسية. */
function validateAtomGrounding(
  atom: LlmResponse['atoms'][number],
  files: ValidationFiles,
  issues: ValidationIssue[],
): void {
  for (const ref of atom.sourceRefs) {
    if (!files.visibleFiles.has(ref.file)) {
      issues.push({
        atomId: atom.clientId,
        message: `مرجع ملف غير موجود ضمن الملفات المرسلة: "${ref.file}".`,
      });
      continue;
    }
    if (files.recapFiles.has(ref.file)) {
      issues.push({
        atomId: atom.clientId,
        message: `recap ليس مصدر دليل — ممنوع الاستشهاد بـ "${ref.file}"؛ الدروس الأساسية فقط.`,
      });
      continue;
    }
    const block = files.evidence.get(ref.blockId);
    if (!block) {
      issues.push({
        atomId: atom.clientId,
        message: `بلوك مجهول: "${ref.blockId}" ليس ضمن البلوكات الأساسية المرسلة.`,
      });
      continue;
    }
    if (block.file !== ref.file) {
      issues.push({
        atomId: atom.clientId,
        message: `البلوك "${ref.blockId}" لا يخص الملف "${ref.file}" (يخص "${block.file}").`,
      });
      continue;
    }
    if (normalizeForEvidence(ref.evidence).length === 0) {
      issues.push({ atomId: atom.clientId, message: 'اقتباس evidence فارغ.' });
    } else if (!evidenceMatches(block.markdown, ref.evidence)) {
      issues.push({
        atomId: atom.clientId,
        message: `اقتباس غير موجود حرفيًا داخل البلوك "${ref.blockId}" (حتى بعد توحيد النص المرئي لـ Markdown): «${truncate(ref.evidence)}»`,
      });
    }
  }
}

/** coverage: كل بلوك أساسي مرة واحدة بالضبط، وكل ذرة مشمولة، ولا إسقاط صامت. */
function validateCoverage(
  response: LlmResponse,
  files: ValidationFiles,
  issues: ValidationIssue[],
): void {
  const knownAtomIds = new Set(response.atoms.map((a) => a.clientId));
  const seenBlocks = new Set<string>();
  const coveredAtoms = new Set<string>();

  for (const entry of response.coverage) {
    if (!files.evidence.has(entry.blockId)) {
      issues.push({
        blockId: entry.blockId,
        message: `بلوك مجهول في coverage: "${entry.blockId}" ليس ضمن البلوكات الأساسية المرسلة.`,
      });
      continue;
    }
    if (seenBlocks.has(entry.blockId)) {
      issues.push({
        blockId: entry.blockId,
        message: `تكرار في coverage: البلوك "${entry.blockId}" ظهر أكثر من مرة.`,
      });
      continue;
    }
    seenBlocks.add(entry.blockId);

    if (entry.status === 'covered') {
      for (const atomId of entry.atomIds) {
        if (!knownAtomIds.has(atomId)) {
          issues.push({
            blockId: entry.blockId,
            message: `coverage يشير إلى clientId مجهول: "${atomId}".`,
          });
          continue;
        }
        coveredAtoms.add(atomId);
      }
    }
    // excluded: reason محصور بالقائمة وnote غير فارغ يضمنهما الـ schema
  }

  for (const blockId of files.evidence.keys()) {
    if (!seenBlocks.has(blockId)) {
      issues.push({
        blockId,
        message: `بلوك أساسي بلا coverage: "${blockId}" — ممنوع إسقاط بلوك بصمت.`,
      });
    }
  }

  for (const atom of response.atoms) {
    if (!coveredAtoms.has(atom.clientId)) {
      issues.push({
        atomId: atom.clientId,
        message: `الذرة "${atom.clientId}" لا يشير إليها أي بلوك covered في coverage.`,
      });
    }
  }
}

/**
 * @param response رد LLM بعد اجتياز Zod.
 * @param files البلوكات الأساسية المسموح بها كدليل + المسارات المرئية للنموذج.
 */
export function validateAtoms(response: LlmResponse, files: ValidationFiles): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (response.atoms.length === 0) {
    issues.push({ message: 'الرد لا يحتوي أي ذرات؛ رفض النتيجة.' });
  }

  const knownIds = new Set(response.atoms.map((a) => a.clientId));
  const seenIds = new Set<string>();

  for (const atom of response.atoms) {
    if (seenIds.has(atom.clientId)) {
      issues.push({ atomId: atom.clientId, message: 'تكرار clientId داخل الرد.' });
    }
    seenIds.add(atom.clientId);

    validateAtomGrounding(atom, files, issues);

    if (atom.duplicateOf && !files.kbIds?.has(atom.duplicateOf)) {
      issues.push({
        atomId: atom.clientId,
        message: `duplicateOf يشير إلى معرف غير موجود في قاعدة المعرفة المرسلة: "${atom.duplicateOf}".`,
      });
    }

    const relationChecks: Array<[string, string[]]> = [
      ['prerequisites', atom.prerequisites],
      ['related', atom.related],
    ];
    for (const [field, ids] of relationChecks) {
      for (const id of ids) {
        if (!knownIds.has(id)) {
          issues.push({
            atomId: atom.clientId,
            message: `${field} يشير إلى clientId غير موجود في الرد: "${id}".`,
          });
        }
      }
    }
  }

  validateCoverage(response, files, issues);

  return issues;
}

export type { CoverageEntry };
