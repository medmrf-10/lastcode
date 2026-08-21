import { z } from 'zod';

/**
 * عقد ناتج الاستخراج (v2). اقتراح LLM ليس نصًا حرًا؛ يُتحقق منه بـ Zod ثم بالتحقق الدلالي
 * (grounding داخل البلوك المشار إليه + تغطية كل بلوك أساسي مرة واحدة بالضبط).
 *
 * تغيير v2: إرسال الدروس كـ source blocks ثابتة، مرجعية الأدلة بالبلوك (blockId)،
 * ومصفوفة coverage إلزامية لكل بلوك أساسي، ونوعا ذرة جديدان fact/constraint.
 */

export const AtomKindSchema = z.enum([
  'concept',
  'distinction',
  'decision_rule',
  'tool_skill',
  'causal_relation',
  'fact',
  'constraint',
]);
export type AtomKind = z.infer<typeof AtomKindSchema>;

export const SourceRefSchema = z.object({
  /** مسار نسبي لجذر الـ vault، يجب أن يكون ضمن الدروس الأساسية المرسلة */
  file: z.string().min(1),
  /** معرف البلوك المرسل مثل "lessons/One.md#b001" */
  blockId: z.string().min(1),
  /** اسم العنوان/القسم داخل الملف */
  section: z.string(),
  /** اقتباس قصير حرفي من المصدر */
  evidence: z.string().min(1),
});
export type SourceRef = z.infer<typeof SourceRefSchema>;

export const AtomProposalSchema = z.object({
  clientId: z.string().min(1),
  title: z.string().min(1),
  statement: z.string().min(1),
  kind: AtomKindSchema,
  sourceRefs: z.array(SourceRefSchema).min(1),
  prerequisites: z.array(z.string()),
  related: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  /** إن كانت الفكرة موجودة سلفًا في قاعدة المعرفة: معرف الذرة القائمة (مثل k0007) */
  duplicateOf: z.string().min(1).optional(),
});
export type AtomProposal = z.infer<typeof AtomProposalSchema>;

/** أسباب الاستبعاد المسموحة وحدها لبلوك أساسي */
export const ExclusionReasonSchema = z.enum(['administrative', 'course_meta', 'media_only']);
export type ExclusionReason = z.infer<typeof ExclusionReasonSchema>;

export const CoverageEntrySchema = z.discriminatedUnion('status', [
  z.object({
    blockId: z.string().min(1),
    status: z.literal('covered'),
    atomIds: z.array(z.string().min(1)).min(1),
  }),
  z.object({
    blockId: z.string().min(1),
    status: z.literal('excluded'),
    reason: ExclusionReasonSchema,
    note: z.string().min(1),
  }),
]);
export type CoverageEntry = z.infer<typeof CoverageEntrySchema>;

/** غلاف رد LLM: ذرات + تغطية كل بلوك أساسي + تحذيرات */
export const LlmResponseSchema = z.object({
  atoms: z.array(AtomProposalSchema),
  coverage: z.array(CoverageEntrySchema),
  warnings: z.array(z.string()).default([]),
});
export type LlmResponse = z.infer<typeof LlmResponseSchema>;

export const SCHEMA_VERSION = 2;

/** ملف الناتج الكامل الذي يُكتب إلى --output */
export interface ExtractResult {
  schemaVersion: typeof SCHEMA_VERSION;
  generatedAt: string;
  model: string;
  roadmap: {
    path: string;
    chapters: number[];
  };
  /** ملفات الدروس الأساسية (مصدر الذرات) */
  coreLessons: string[];
  /** blocks الدروس الأساسية كما أُرسلت للمزود — للمراجعة */
  blocks: Array<{
    id: string;
    file: string;
    section: string;
    startLine: number;
    endLine: number;
    markdown: string;
    visibleText: string;
  }>;
  /** ملفات recap المستعملة للتحقق والتغطية فقط */
  recapFiles: string[];
  /** عناصر التمارين المستبعدة (❌) */
  exercises: Array<{ chapter: number; title: string }>;
  /** العناصر المفقودة: بلا رابط أو رابط بلا ملف */
  missing: Array<{ chapter: number; title: string; link?: string }>;
  atoms: AtomProposal[];
  /** تغطية كل بلوك أساسي كما أعادها المزود */
  coverage: CoverageEntry[];
  /** تحذيرات التغطية والتكرار من المزود أو من خط التحليل */
  warnings: string[];
}
