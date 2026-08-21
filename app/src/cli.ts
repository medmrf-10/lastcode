#!/usr/bin/env node
import { Command } from 'commander';
import path from 'node:path';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { parseChapterList } from './domain/parseRoadmap.js';
import { preparePlan, type PreparedPlan } from './domain/plan.js';
import { AmbiguityError } from './domain/resolve.js';
import { OpenAiCompatibleClient, type LlmClient } from './llm/client.js';
import { ExtractionValidationError, runExtraction } from './llm/extract.js';
import { writeRejectedArtifact } from './llm/artifact.js';
import { buildReviewHtml } from './review/page.js';
import { startReviewServer, ReviewServerError } from './review/server.js';
import { loadDotEnv, readLlmConfig } from './config.js';
import { detectVaultRoot, loadSystemPrompt, packageRoot } from './paths.js';
import type { ExtractResult } from './schema/proposal.js';
import {
  commitDecisions,
  defaultKbPath,
  KbError,
  loadOrCreateKnowledgeBase,
  loadDecisionsFile,
  loadProposalFile,
  saveKnowledgeBase,
  type CommitSummary,
} from './domain/kb.js';

interface ExtractOptions {
  roadmap: string;
  chapters: string;
  output?: string;
  resolveOnly: boolean;
  vault?: string;
  kb?: string;
}

/** حقن اختباري: عميل/mock واسم موديل بديلان عن قراءة البيئة. */
export interface ExtractDeps {
  client?: LlmClient;
  model?: string;
  now?: () => Date;
}

function printError(message: string): void {
  console.error(`\n✖ ${message}`);
}

function printSummary(plan: PreparedPlan): void {
  const lessons = plan.items.filter((i) => i.kind === 'lesson');
  const recaps = plan.items.filter((i) => i.kind === 'recap');

  console.log(`الخارطة: ${plan.roadmapPath}`);
  console.log(`جذر الـ vault: ${plan.vaultRoot}`);
  console.log(`الفصول المطلوبة: ${plan.chapters.join('، ')}\n`);

  console.log(`الدروس الأساسية (${lessons.length}):`);
  for (const lesson of lessons) {
    console.log(`  [فصل ${lesson.chapter}] ${lesson.text} ← ${lesson.file}`);
  }
  console.log(`\nملفات recap للتحقق (${recaps.length}):`);
  for (const recap of recaps) {
    console.log(`  [فصل ${recap.chapter}] ${recap.text} ← ${recap.file}`);
  }
  console.log(`\nتمارين مستبعدة ❌ (${plan.exercises.length}):`);
  for (const exercise of plan.exercises) {
    console.log(`  [فصل ${exercise.chapter}] ${exercise.title}`);
  }
  console.log(`\nعناصر مفقودة (${plan.missing.length}):`);
  for (const item of plan.missing) {
    console.log(
      `  [فصل ${item.chapter}] ${item.title}${item.link ? ` (رابط بلا ملف: [[${item.link}]])` : ''}`,
    );
  }
  console.log('');
}

async function runExtract(options: ExtractOptions, deps: ExtractDeps = {}): Promise<void> {
  const chapters = parseChapterList(options.chapters);
  if (!options.resolveOnly && !options.output) {
    throw new Error('--output إلزامي عند الاستخراج الفعلي (أو استعمل --resolve-only)');
  }

  const roadmapPath = path.resolve(options.roadmap);
  const vaultRoot = path.resolve(options.vault ?? detectVaultRoot(path.dirname(roadmapPath)));

  // قاعدة المعرفة: تُحمّل تلقائيًا إن وُجدت كي لا يكرر الاستخراج ذراتك المعتمدة
  const kbPath = path.resolve(options.kb ?? defaultKbPath(vaultRoot));
  const { kb, existed } = loadOrCreateKnowledgeBase(kbPath);
  if (existed) {
    console.log(`قاعدة المعرفة: ${kb.atoms.length} ذرة معتمدة (${kbPath}) — كشف التكرار مفعّل`);
  }

  // تحضير واحد فقط: نفس الخطة تُعرض ملخصًا وتُستعمل للاستخراج، مع استبعاد مجلد الأداة نفسه
  const plan = preparePlan({ roadmapPath, vaultRoot, chapters, excludedAbsolute: [packageRoot] });

  printSummary(plan);

  if (options.resolveOnly) {
    console.log('وضع --resolve-only: توقف قبل أي اتصال بالشبكة. لم يُعدَّل أي ملف.');
    return;
  }

  let client: LlmClient;
  let model: string;
  if (deps.client && deps.model) {
    client = deps.client;
    model = deps.model;
  } else {
    loadDotEnv();
    const config = readLlmConfig();
    client = deps.client ?? new OpenAiCompatibleClient(config);
    model = deps.model ?? config.model;
  }
  console.log(`الاتصال بالمزود (موديل: ${model}) …`);

  const result: ExtractResult = await runExtraction({
    plan,
    systemPrompt: loadSystemPrompt(),
    client,
    model,
    now: deps.now,
    kbAtoms: kb.atoms.map((a) => ({ id: a.id, statement: a.statement, kind: a.kind })),
  });

  const outputPath = path.resolve(options.output!);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');

  // صفحة مراجعة بشرية بجانب الناتج: الذرات وأدلتها والتغطية، مع اعتماد/استبعاد محلي
  const reviewPath = outputPath.replace(/\.json$/i, '.review.html');
  fs.writeFileSync(reviewPath, buildReviewHtml(result, outputPath), 'utf8');

  console.log(`\n✔ عدد الذرات المقترحة: ${result.atoms.length}`);
  if (result.warnings.length > 0) {
    console.log(`تحذيرات التغطية/التكرار (${result.warnings.length}):`);
    for (const warning of result.warnings) console.log(`  - ${warning}`);
  }
  console.log(`تم حفظ الناتج في: ${outputPath}`);
  console.log(`صفحة المراجعة: ${reviewPath} (افتحها في المتصفح)`);
}

/**
 * معالجة الفشل: كود الخروج، وملف التشخيص .rejected.json فقط لأخطاء «رد المزود بعد استلامه».
 * فشل كتابة ملف التشخيص يُعرض إضافةً إلى الخطأ الأصلي ولا يطمسه.
 */
export function handleExtractFailure(error: unknown, options: ExtractOptions): number {
  const code =
    error instanceof AmbiguityError || error instanceof ExtractionValidationError ? 2 : 1;

  printError(error instanceof Error ? error.message : String(error));

  if (error instanceof ExtractionValidationError && error.diagnostic && options.output) {
    try {
      const artifactPath = writeRejectedArtifact(path.resolve(options.output), error);
      if (artifactPath) {
        console.error(`(حُفظ رد المزود المرفوض للتشخيص في: ${artifactPath})`);
      }
    } catch (saveError) {
      printError(
        `تعذر حفظ ملف التشخيص .rejected.json: ${
          saveError instanceof Error ? saveError.message : String(saveError)
        }`,
      );
    }
  }
  return code;
}

/** نقطة الدخول القابلة للاختبار: ينفذ الأمر ويعيد كود الخروج بدل الرمي. */
export async function runExtractCommand(
  options: ExtractOptions,
  deps: ExtractDeps = {},
): Promise<number> {
  try {
    await runExtract(options, deps);
    return 0;
  } catch (error: unknown) {
    return handleExtractFailure(error, options);
  }
}

interface CommitOptions {
  proposal: string;
  decisions?: string;
  kb?: string;
  vault?: string;
}

function printCommitSummary(summary: CommitSummary, kbPath: string): void {
  console.log(`\nأُضيفت ذرات جديدة (${summary.added.length}):`);
  for (const a of summary.added) console.log(`  ${a.id} ← [${a.clientId}] ${a.title}`);
  if (summary.addedKnown.length > 0) {
    console.log(`\nأعرفها مسبقًا — فاصل أول طويل عند ربط FSRS (${summary.addedKnown.length}):`);
    for (const a of summary.addedKnown) console.log(`  ★ ${a.id} ← [${a.clientId}] ${a.title}`);
  }
  if (summary.merged.length > 0) {
    console.log(`\nدُمجت مصادرها في ذرات قائمة (${summary.merged.length}):`);
    for (const m of summary.merged) console.log(`  ${m.id} ← [${m.clientId}]`);
  }
  const rejected = summary.skipped.filter((s) => s.reason === 'rejected').length;
  const undecided = summary.skipped.filter((s) => s.reason === 'undecided').length;
  const unknown = summary.skipped.filter((s) => s.reason === 'unknown_duplicate').length;
  console.log(`\nتُجاهلت: ${rejected} مرفوضة، ${undecided} بلا قرار`);
  if (unknown > 0) {
    console.log(`⚠ ${unknown} ذرة معتمدة تشير إلى duplicateOf غير موجود في القاعدة — لم تُدمج`);
  }
  console.log(`\nإجمالي قاعدة المعرفة الآن: ${summary.totals.kbAtoms} ذرة`);
  console.log(`حُفظت في: ${kbPath}`);
}

async function runCommit(options: CommitOptions): Promise<number> {
  try {
    const proposalPath = path.resolve(options.proposal);
    const vaultRoot = path.resolve(options.vault ?? detectVaultRoot(path.dirname(proposalPath)));
    const kbPath = path.resolve(options.kb ?? defaultKbPath(vaultRoot));

    // الافتراضي: ملف القرارات المباشر الذي يكتبه خادم المراجعة بجانب الاقتراح
    const decisionsPath = path.resolve(
      options.decisions ?? proposalPath.replace(/\.json$/i, '.decisions.json'),
    );
    if (!options.decisions && !fs.existsSync(decisionsPath)) {
      console.error(
        `\n✖ لم أجد ملف قرارات: ${decisionsPath}\n` +
          `  شغّل pnpm learn review لفتح المراجعة (القرارات تُحفظ تلقائيًا)، أو مرّر --decisions <path>.`,
      );
      return 1;
    }

    const { proposalName, atoms } = loadProposalFile(proposalPath);
    const decisions = loadDecisionsFile(decisionsPath);
    const { kb, existed } = loadOrCreateKnowledgeBase(kbPath);

    const accepted = atoms.filter((a) =>
      ['accepted', 'known'].includes(decisions[a.clientId]?.decision ?? ''),
    ).length;
    if (accepted === 0) {
      console.log('لا توجد قرارات «اعتماد» أو «أعرفها» في ملف القرارات؛ لم يتغير شيء.');
      console.log('راجع صفحة المراجعة ثم صدّر القرارات مجددًا.');
      return 0;
    }

    const { kb: updated, summary } = commitDecisions({
      kb,
      proposalName,
      atoms,
      decisions,
      decidedAt: new Date().toISOString(),
    });
    saveKnowledgeBase(kbPath, updated);
    console.log(
      existed ? `قاعدة معرفة موجودة عُدّلت: ${kbPath}` : `أُنشئت قاعدة معرفة جديدة: ${kbPath}`,
    );
    printCommitSummary(summary, kbPath);
    return 0;
  } catch (error: unknown) {
    printError(error instanceof Error ? error.message : String(error));
    return error instanceof KbError ? 2 : 1;
  }
}

const program = new Command();

program
  .name('learn')
  .description('استخراج ذرات معرفية من فصول خارطة Obsidian عبر مزود LLM متوافق مع OpenAI');

interface ReviewOptions {
  proposal: string;
  port?: string;
}

async function runReview(options: ReviewOptions): Promise<number> {
  const proposalPath = path.resolve(options.proposal);
  if (!fs.existsSync(proposalPath)) {
    printError(`ملف الاقتراح غير موجود: ${proposalPath} — نفّذ learn extract أولًا.`);
    return 1;
  }

  let result: ExtractResult;
  try {
    result = JSON.parse(fs.readFileSync(proposalPath, 'utf8')) as ExtractResult;
  } catch (error) {
    printError(`تعذر قراءة ملف الاقتراح: ${error instanceof Error ? error.message : error}`);
    return 1;
  }

  // ملف القرارات المباشر بجانب الاقتراح: frontend-1-ch1-2.json → frontend-1-ch1-2.decisions.json
  const decisionsPath = proposalPath.replace(/\.json$/i, '.decisions.json');

  const html = buildReviewHtml(result, proposalPath, { serverMode: true });
  const port = options.port ? Number(options.port) : 0;
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    printError(`منفذ غير صالح: "${options.port}" — استعمل رقمًا بين 0 و65535.`);
    return 1;
  }

  const { port: actualPort, close } = await startReviewServer({
    html,
    decisionsPath,
    atoms: result.atoms.map((a) => ({
      clientId: a.clientId,
      title: a.title,
      duplicateOf: a.duplicateOf,
    })),
  });

  const existing = fs.existsSync(decisionsPath);
  console.log(`صفحة المراجعة تعمل الآن: http://localhost:${actualPort}`);
  console.log(`الاقتراح: ${proposalPath}`);
  console.log(
    existing
      ? `قرارات سابقة محمّلة من: ${decisionsPath}`
      : `ملف القرارات (يُكتب تلقائيًا مع كل نقرة): ${decisionsPath}`,
  );
  console.log('كل ضغطة «اعتمد/استبعد» تُحفظ فورًا على القرص. اضغط Ctrl+C للخروج.');

  const open = await import('node:child_process').then((cp) => cp.default);
  open.spawn('open', [`http://localhost:${actualPort}`], { stdio: 'ignore' }).on('error', () => {
    console.log('(لم أستطع فتح المتصفح تلقائيًا — انسخ العنوان أعلاه يدويًا.)');
  });

  const waitForever = new Promise<never>(() => {});
  await waitForever;
  void close;
  return 0; // غير قابل للوصول: الخادم يعمل حتى Ctrl+C
}

program
  .command('review')
  .description(
    'يفتح صفحة المراجعة من خادم محلي؛ كل قرار يُكتب فورًا في ملف القرارات بجانب الاقتراح',
  )
  .requiredOption('--proposal <path>', 'مسار ملف JSON الاقتراح من أمر extract')
  .option('--port <number>', 'منفذ الخادم (الافتراضي: منفذ حر تلقائي)')
  .action(async (options: ReviewOptions) => {
    process.exitCode = await runReview(options).catch((error: unknown) => {
      printError(error instanceof Error ? error.message : String(error));
      return error instanceof ReviewServerError ? 2 : 1;
    });
  });

program
  .command('commit')
  .description(
    'يعتمد القرارات من ملف الاقتراح وملف القرارات المصدّر من صفحة المراجعة في قاعدة المعرفة الدائمة',
  )
  .requiredOption('--proposal <path>', 'مسار ملف JSON الاقتراح من أمر extract')
  .option(
    '--decisions <path>',
    'مسار ملف القرارات (الافتراضي: <proposal>.decisions.json بجانبه — ملف خادم المراجعة)',
  )
  .option(
    '--kb <path>',
    'مسار قاعدة المعرفة (الافتراضي: .learn/knowledge-base.json تحت جذر الـ vault)',
  )
  .option('--vault <path>', 'جذر الـ vault (الافتراضي: أقرب أبٍ للخارطة يحتوي .obsidian)')
  .action(async (options: CommitOptions) => {
    process.exitCode = await runCommit(options);
  });

program
  .command('extract')
  .description('يحلل الخارطة ويحل الروابط ثم يطلب اقتراح ذرات من المزود ويتحقق منها')
  .requiredOption('--roadmap <path>', 'مسار ملف الخارطة')
  .requiredOption('--chapters <list>', 'أرقام الفصول مفصولة بفواصل، مثل 1,2')
  .option('--output <path>', 'مسار ملف JSON الناتج (إلزامي إلا مع --resolve-only)')
  .option('--resolve-only', 'حلل واحلل الروابط واعرض الملخص دون أي اتصال بالشبكة', false)
  .option('--vault <path>', 'جذر الـ vault (الافتراضي: أقرب أبٍ يحتوي .obsidian)')
  .option(
    '--kb <path>',
    'مسار قاعدة المعرفة لكشف التكرار (الافتراضي: .learn/knowledge-base.json وتُحمّل تلقائيًا إن وُجدت)',
  )
  .action(async (options: ExtractOptions) => {
    process.exitCode = await runExtractCommand(options);
  });

function isMainModule(): boolean {
  const entry = process.argv[1];
  return typeof entry === 'string' && import.meta.url === pathToFileURL(entry).href;
}

if (isMainModule()) {
  await program.parseAsync().catch((error: unknown) => {
    printError(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
