import path from 'node:path';
import fs from 'node:fs';
import type { ExtractionValidationError } from './extract.js';

/**
 * ملف التشخيص `.rejected.json`: يُكتب بجانب `--output` فقط عندما يصل رد من المزود
 * ثم يفشل JSON/schema/semantic validation، حتى لا يضيع الرد المرفوض قبل مراجعته.
 *
 * يحتوي فقط على ما أنتجه المزود وما استنتجه التحقق منه: لا prompts، لا محتوى دروس،
 * لا متغيرات بيئة أو base URL أو مفاتيح. كتابته ليست نجاحًا؛ كود الخروج يبقى 2.
 */

export const REJECTED_ARTIFACT_SCHEMA_VERSION = 1;

export interface RejectedArtifact {
  schemaVersion: number;
  kind: 'rejected-llm-response';
  generatedAt: string;
  model: string;
  stage: 'json' | 'schema' | 'semantic';
  /** رسالة الخطأ الكاملة بلا اختصار */
  error: string;
  issues: unknown[];
  /** الرد كما أعاده المزود حرفيًا */
  rawResponse: string;
  /** الرد بعد JSON.parse إن نجح؛ يغيب تمامًا عند فشل الـ JSON */
  parsedResponse?: unknown;
}

/** مسار ملف الرفض بجانب مسار الإخراج: يُستبدل الامتداد بـ .rejected.json */
export function rejectedArtifactPath(outputPath: string): string {
  return /\.json$/i.test(outputPath)
    ? outputPath.replace(/\.json$/i, '.rejected.json')
    : `${outputPath}.rejected.json`;
}

export function buildRejectedArtifact(
  error: ExtractionValidationError,
  now: () => Date = () => new Date(),
): RejectedArtifact | null {
  const diagnostic = error.diagnostic;
  if (!diagnostic) return null;

  const artifact: RejectedArtifact = {
    schemaVersion: REJECTED_ARTIFACT_SCHEMA_VERSION,
    kind: 'rejected-llm-response',
    generatedAt: now().toISOString(),
    model: diagnostic.model,
    stage: diagnostic.stage,
    error: error.message,
    issues: error.issues,
    rawResponse: diagnostic.rawResponse,
  };
  if (diagnostic.parsedResponse !== undefined) {
    artifact.parsedResponse = diagnostic.parsedResponse;
  }
  return artifact;
}

/**
 * يكتب ملف التشخيص بجانب مسار الإخراج ويعيد مساره المطلق.
 * يعيد null إن لم يكن الخطأ حمل بيانات تشخيص (ليس فشل رد مزود).
 * يرمي أخطاء الكتابة كما هي؛ المتCaller مسؤول عن عرضها دون طمس الخطأ الأصلي.
 */
export function writeRejectedArtifact(
  outputPath: string,
  error: ExtractionValidationError,
  now: () => Date = () => new Date(),
): string | null {
  const artifact = buildRejectedArtifact(error, now);
  if (!artifact) return null;

  const target = path.resolve(rejectedArtifactPath(outputPath));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, JSON.stringify(artifact, null, 2), 'utf8');
  return target;
}
