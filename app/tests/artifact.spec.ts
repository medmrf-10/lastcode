import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runExtractCommand, handleExtractFailure } from '../src/cli.js';
import { buildRejectedArtifact, rejectedArtifactPath } from '../src/llm/artifact.js';
import { ExtractionValidationError } from '../src/llm/extract.js';
import type { LlmClient } from '../src/llm/client.js';
import { makeTmpVault } from './helpers.js';

/**
 * ملف التشخيص .rejected.json: يُكتب بجانب --output فقط عند فشل رد المزود بعد استلامه
 * (json/schema/semantic)، ولا يُكتب الناتج المقبول، ولا يتسرب أي سر أو prompt أو محتوى دروس.
 */

const LESSON = `# One

Last updated October 2023

HTML is a markup language. It does not contain programming logic.
`;

const RECAP = `# Chapter recap

- HTML is a markup language.
`;

const ROADMAP = `# Fixture map

1. Chapter one
\t1. [[One]]
\t2. [[Chapter recap]]
`;

/**
 * فشل دلالي (grounding): بنية الرد صحيحة وcoverage كاملة، لكن evidence مختلق
 * غير موجود داخل البلوك المشار إليه.
 */
const SEMANTIC_BAD_RESPONSE = {
  atoms: [
    {
      clientId: 'a1',
      title: 'عنوان',
      statement: 'عبارة.',
      kind: 'concept',
      sourceRefs: [
        {
          file: 'lessons/One.md',
          blockId: 'lessons/One.md#b002',
          section: 'One',
          evidence: 'CSS is a programming language.',
        },
      ],
      prerequisites: [],
      related: [],
      confidence: 0.9,
    },
  ],
  coverage: [
    {
      blockId: 'lessons/One.md#b001',
      status: 'excluded',
      reason: 'administrative',
      note: 'سطر تحديث',
    },
    { blockId: 'lessons/One.md#b002', status: 'covered', atomIds: ['a1'] },
  ],
  warnings: [],
};

/** فشل تغطية: بلوك أساسي بلا coverage (إسقاط صامت) */
const COVERAGE_BAD_RESPONSE = {
  ...SEMANTIC_BAD_RESPONSE,
  coverage: [
    {
      blockId: 'lessons/One.md#b002',
      status: 'covered',
      atomIds: ['a1'],
    },
  ],
};

const SCHEMA_BAD_OBJECT = { atoms: 'not-an-array', warnings: [] };
const RAW_NOT_JSON = 'هذا رد نصي ليس JSON أصلاً';

function clientReturning(raw: string): LlmClient {
  return {
    async complete() {
      return raw;
    },
  };
}

function semanticRaw(): string {
  return '```json\n' + JSON.stringify(SEMANTIC_BAD_RESPONSE, null, 2) + '\n```';
}

let quietLog: ReturnType<typeof vi.spyOn>;
let quietError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  quietLog = vi.spyOn(console, 'log').mockImplementation(() => {});
  quietError = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

interface Scenario {
  vaultRoot: string;
  outDir: string;
  cleanup: () => void;
}

function setup(): Scenario {
  const vault = makeTmpVault({
    'roadmaps/map.md': ROADMAP,
    'lessons/One.md': LESSON,
    'lessons/Chapter recap.md': RECAP,
  });
  const outDir = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'learn-out-'));
  return {
    vaultRoot: vault.root,
    outDir,
    cleanup: () => {
      vault.cleanup();
      fs.rmSync(outDir, { recursive: true, force: true });
    },
  };
}

function options(scenario: Scenario, outputName = 'result.json') {
  return {
    roadmap: path.join(scenario.vaultRoot, 'roadmaps', 'map.md'),
    chapters: '1',
    output: path.join(scenario.outDir, outputName),
    resolveOnly: false,
    vault: scenario.vaultRoot,
  };
}

function run(opts: ReturnType<typeof options>, raw: string) {
  return runExtractCommand(opts, {
    client: clientReturning(raw),
    model: 'test-model',
  });
}

describe('ملف التشخيص .rejected.json', () => {
  it('فشل دلالي: يكتب artifact يحوي الرد الخام والـ parsed والأخطاء كاملة، ولا يكتب الناتج المقبول', async () => {
    const scenario = setup();
    try {
      const code = await run(options(scenario), semanticRaw());

      expect(code).toBe(2);
      const artifactFile = path.join(scenario.outDir, 'result.rejected.json');
      expect(fs.existsSync(artifactFile)).toBe(true);
      expect(fs.existsSync(options(scenario).output)).toBe(false);

      const artifact = JSON.parse(fs.readFileSync(artifactFile, 'utf8'));
      expect(artifact.schemaVersion).toBe(1);
      expect(artifact.kind).toBe('rejected-llm-response');
      expect(artifact.stage).toBe('semantic');
      expect(artifact.model).toBe('test-model');
      expect(Number.isNaN(Date.parse(artifact.generatedAt))).toBe(false);

      // الرد الخام كما أعاده المزود حرفيًا (بالأسوار)، والـ parsed كما فُهم
      expect(artifact.rawResponse).toBe(semanticRaw());
      expect(artifact.parsedResponse).toEqual(SEMANTIC_BAD_RESPONSE);

      // الأخطاء كاملة بلا اختصار
      expect(artifact.error).toContain('فشل التحقق الدلالي');
      expect(artifact.issues.length).toBeGreaterThan(0);
      expect(artifact.issues[0].message).toMatch(/اقتباس غير موجود حرفيًا/);
      expect(artifact.issues[0].atomId).toBe('a1');
    } finally {
      scenario.cleanup();
    }
  });

  it('فشل coverage (بلوك مسقوط): يكتب artifact بمشكلة التغطية كاملة', async () => {
    const scenario = setup();
    try {
      const code = await run(
        options(scenario),
        '```json\n' + JSON.stringify(COVERAGE_BAD_RESPONSE) + '\n```',
      );

      expect(code).toBe(2);
      const artifact = JSON.parse(
        fs.readFileSync(path.join(scenario.outDir, 'result.rejected.json'), 'utf8'),
      );
      expect(artifact.stage).toBe('semantic');
      const coverageIssue = (artifact.issues as Array<{ message: string }>).find((i) =>
        i.message.includes('بلوك أساسي بلا coverage'),
      );
      expect(coverageIssue).toBeDefined();
      expect(coverageIssue!.message).toContain('lessons/One.md#b001');
      expect(fs.existsSync(options(scenario).output)).toBe(false);
    } finally {
      scenario.cleanup();
    }
  });

  it('فشل schema: يحفظ raw وparsed معًا', async () => {
    const scenario = setup();
    try {
      const raw = '```json\n' + JSON.stringify(SCHEMA_BAD_OBJECT) + '\n```';
      const code = await run(options(scenario), raw);

      expect(code).toBe(2);
      const artifact = JSON.parse(
        fs.readFileSync(path.join(scenario.outDir, 'result.rejected.json'), 'utf8'),
      );
      expect(artifact.stage).toBe('schema');
      expect(artifact.rawResponse).toBe(raw);
      expect(artifact.parsedResponse).toEqual(SCHEMA_BAD_OBJECT);
      expect(artifact.error).toContain('schema');
      expect(fs.existsSync(options(scenario).output)).toBe(false);
    } finally {
      scenario.cleanup();
    }
  });

  it('فشل JSON: يحفظ raw من دون parsed إطلاقًا', async () => {
    const scenario = setup();
    try {
      const code = await run(options(scenario), RAW_NOT_JSON);

      expect(code).toBe(2);
      const artifact = JSON.parse(
        fs.readFileSync(path.join(scenario.outDir, 'result.rejected.json'), 'utf8'),
      );
      expect(artifact.stage).toBe('json');
      expect(artifact.rawResponse).toBe(RAW_NOT_JSON);
      expect('parsedResponse' in artifact).toBe(false);
      expect(artifact.error).toContain('ليس JSON صالحًا');
    } finally {
      scenario.cleanup();
    }
  });

  it('أخطاء التحضير لا تنشئ artifact ولا تكتب ناتجًا', async () => {
    const scenario = setup();
    try {
      const badOptions = options(scenario);
      badOptions.roadmap = path.join(scenario.vaultRoot, 'roadmaps', 'لا-موجود.md');
      const code = await runExtractCommand(badOptions, {
        client: clientReturning(semanticRaw()),
        model: 'test-model',
      });

      expect(code).toBe(1);
      expect(fs.existsSync(path.join(scenario.outDir, 'result.rejected.json'))).toBe(false);
      expect(fs.existsSync(badOptions.output)).toBe(false);
    } finally {
      scenario.cleanup();
    }
  });

  it('أخطاء الشبكة/الإعداد (بلا diagnostic) لا تنشئ artifact وتبقي الرسالة الأصلية', async () => {
    const outDir = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'learn-out-'));
    try {
      const opts = {
        roadmap: 'whatever.md',
        chapters: '1',
        output: path.join(outDir, 'result.json'),
        resolveOnly: false,
      };
      const code = handleExtractFailure(new Error('انتهت مهلة طلب المزود بعد 25 ملي ثانية'), opts);
      expect(code).toBe(1);
      expect(quietError.mock.calls.flat().join('\n')).toContain('انتهت مهلة طلب المزود');
      expect(fs.existsSync(path.join(outDir, 'result.rejected.json'))).toBe(false);
    } finally {
      fs.rmSync(outDir, { recursive: true, force: true });
    }
  });

  it('لا يتسرب للـ artifact مفتاح أو prompt أو محتوى دروس من التطبيق', async () => {
    const scenario = setup();
    try {
      await run(options(scenario), semanticRaw());
      const text = fs.readFileSync(path.join(scenario.outDir, 'result.rejected.json'), 'utf8');

      // لا متغيرات بيئة ولا مفاتيح
      expect(text).not.toContain('LLM_API_KEY');
      expect(text).not.toContain('test-key');
      // لا prompts (النظام أو رسالة المستخدم)
      expect(text).not.toContain('قواعد استخراج الذرات'); // عنوان prompt النظام
      expect(text).not.toContain('الدروس الأساسية (مصدر الاستخراج الوحيد)'); // ترويسة رسالة المستخدم
      // لا محتوى ملفات الدروس من التطبيق (mock لم يعد أي نص منها)
      expect(text).not.toContain('HTML is a markup language');
      expect(text).not.toContain('# Chapter recap');
    } finally {
      scenario.cleanup();
    }
  });

  it('فشل كتابة الـ artifact لا يستبدل رسالة فشل validation الأصلية', async () => {
    const scenario = setup();
    try {
      // مجلد الإخراج محجوز بملف عادي => mkdir يفشل
      const blocker = path.join(scenario.outDir, 'blocker');
      fs.writeFileSync(blocker, 'not a directory', 'utf8');
      const opts = options(scenario, 'blocker/result.json');

      const code = await run(opts, semanticRaw());

      expect(code).toBe(2);
      const printed = quietError.mock.calls.flat().join('\n');
      expect(printed).toContain('فشل التحقق الدلالي');
      expect(printed).toContain('اقتباس غير موجود حرفيًا');
      expect(printed).toContain('تعذر حفظ ملف التشخيص');
    } finally {
      scenario.cleanup();
    }
  });
});

describe('بناء الـ artifact مباشرة', () => {
  it('يعيد null لخطأ بلا diagnostic (ليس فشل رد مزود)', () => {
    const error = new ExtractionValidationError('فشل التحقق الدلالي من رد المزود.');
    expect(buildRejectedArtifact(error)).toBeNull();
  });

  it('مسار الـ artifact يستبدل امتداد .json ويصلح أي امتداد آخر', () => {
    expect(rejectedArtifactPath('/tmp/x/out.json')).toBe('/tmp/x/out.rejected.json');
    expect(rejectedArtifactPath('/tmp/x/out')).toBe('/tmp/x/out.rejected.json');
    expect(rejectedArtifactPath('/tmp/x/out.data.json')).toBe('/tmp/x/out.data.rejected.json');
  });
});
