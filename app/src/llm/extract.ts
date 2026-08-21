import path from 'node:path';
import fs from 'node:fs';
import { LlmResponseSchema, SCHEMA_VERSION, type ExtractResult } from '../schema/proposal.js';
import { validateAtoms, type ValidationIssue } from '../schema/validate.js';
import { splitSourceBlocks, type SourceBlock } from '../domain/blocks.js';
import type { PreparedPlan } from '../domain/plan.js';
import type { LlmClient } from './client.js';
import { buildUserMessage, type KbAtomRef, type SentFile } from './message.js';

/** مرحلة فشل رد المزود بعد استلامه. */
export type RejectionStage = 'json' | 'schema' | 'semantic';

/** بيانات تشخيصية منظمة يحملها خطأ التحقق؛ تُستعمل لبناء ملف .rejected.json في طبقة CLI. */
export interface RejectionDiagnostic {
  stage: RejectionStage;
  model: string;
  /** الرد كما أعاده المزود حرفيًا، بلا أي معالجة */
  rawResponse: string;
  /** الرد بعد JSON.parse إن نجح، قبل التحقق */
  parsedResponse?: unknown;
}

/** يُرمى عند فشل تحقق الـ schema أو التحقق الدلالي؛ لا إصلاح صامت. */
export class ExtractionValidationError extends Error {
  constructor(
    message: string,
    public readonly issues: ValidationIssue[] = [],
    public readonly diagnostic?: RejectionDiagnostic,
  ) {
    super(message);
    this.name = 'ExtractionValidationError';
  }
}

export interface ExtractionInput {
  /** الخطة المحضرة مسبقًا عبر preparePlan — لا تحليل أو فهرسة ثانية هنا */
  plan: PreparedPlan;
  systemPrompt: string;
  client: LlmClient;
  model: string;
  now?: () => Date;
  /** الذرات المعتمدة في قاعدة المعرفة (إن وُجدت) لكشف التكرار عبر duplicateOf */
  kbAtoms?: KbAtomRef[];
}

/** يزيل أسوار الكود إن وُجدت. */
export function stripCodeFences(raw: string): string {
  const text = raw.trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/.exec(text);
  return fenced ? (fenced[1] ?? '') : text;
}

/** يحلل JSON الرد بعد إزالة أسوار الكود؛ يرمي SyntaxError كما هي عند الفشل. */
export function parseLlmJson(raw: string): unknown {
  return JSON.parse(stripCodeFences(raw));
}

export async function runExtraction(input: ExtractionInput): Promise<ExtractResult> {
  const { plan } = input;

  if (plan.coreLessonFiles.length === 0) {
    throw new Error(
      'لا توجد دروس أساسية محلولة في الفصول المطلوبة؛ لا شيء يمكن استخراجه (تحقق من العناصر المفقودة).',
    );
  }

  // تقسيم الدروس الأساسية إلى بلوكات ثابتة (المصدر الوحيد للأدلة والتغطية)
  const blocks: SourceBlock[] = [];
  for (const file of plan.coreLessonFiles) {
    const content = fs.readFileSync(path.join(plan.vaultRoot, file), 'utf8');
    blocks.push(...splitSourceBlocks(file, content));
  }
  if (blocks.length === 0) {
    throw new Error('لم ينتج تقسيم الدروس الأساسية أي بلوك؛ لا شيء يمكن استخراجه.');
  }

  const recaps: SentFile[] = plan.recapFiles.map((file) => ({
    file,
    content: fs.readFileSync(path.join(plan.vaultRoot, file), 'utf8'),
  }));

  const messages = [
    { role: 'system' as const, content: input.systemPrompt },
    { role: 'user' as const, content: buildUserMessage(blocks, recaps, input.kbAtoms ?? []) },
  ];

  const raw = await input.client.complete(messages);

  let parsedJson: unknown;
  try {
    parsedJson = parseLlmJson(raw);
  } catch (error) {
    throw new ExtractionValidationError(
      `رد المزود ليس JSON صالحًا (${(error as Error).message}). أول 200 حرف: ${stripCodeFences(raw).slice(0, 200)}`,
      [],
      { stage: 'json', model: input.model, rawResponse: raw },
    );
  }

  const parsed = LlmResponseSchema.safeParse(parsedJson);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `${i.path.join('.') || '(جذر)'}: ${i.message}`)
      .join(' | ');
    throw new ExtractionValidationError(`رد المزود لا يطابق الـ schema: ${details}`, [], {
      stage: 'schema',
      model: input.model,
      rawResponse: raw,
      parsedResponse: parsedJson,
    });
  }

  // الدروس الأساسية فقط مصدر دليل (كبلوكات)؛ recap مرئي للنموذج لكنه ليس دليلًا ولا بلوكات
  const files = {
    evidence: new Map<string, SourceBlock>(blocks.map((b) => [b.id, b] as const)),
    recapFiles: new Set<string>(plan.recapFiles),
    visibleFiles: new Set<string>([...plan.coreLessonFiles, ...plan.recapFiles]),
    kbIds: new Set<string>((input.kbAtoms ?? []).map((a) => a.id)),
  };

  const issues = validateAtoms(parsed.data, files);
  if (issues.length > 0) {
    const report = issues
      .map((issue) =>
        [
          issue.atomId ? `[${issue.atomId}]` : '',
          issue.blockId ? `{${issue.blockId}}` : '',
          issue.message,
        ]
          .filter(Boolean)
          .join(' '),
      )
      .join('\n');
    throw new ExtractionValidationError(`فشل التحقق الدلالي من رد المزود:\n${report}`, issues, {
      stage: 'semantic',
      model: input.model,
      rawResponse: raw,
      parsedResponse: parsedJson,
    });
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: (input.now ?? (() => new Date()))().toISOString(),
    model: input.model,
    roadmap: {
      path: path.relative(plan.vaultRoot, plan.roadmapPath) || plan.roadmapPath,
      chapters: [...plan.chapters],
    },
    coreLessons: [...plan.coreLessonFiles],
    blocks: blocks.map((b) => ({ ...b })),
    recapFiles: plan.recapFiles.map((f) => f),
    exercises: plan.exercises.map((e) => ({ ...e })),
    missing: plan.missing.map((m) => ({ ...m })),
    atoms: parsed.data.atoms,
    coverage: parsed.data.coverage,
    warnings: parsed.data.warnings,
  };
}
