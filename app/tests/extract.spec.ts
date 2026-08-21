import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { preparePlan } from '../src/domain/plan.js';
import { runExtraction, ExtractionValidationError } from '../src/llm/extract.js';
import type { LlmClient } from '../src/llm/client.js';
import { loadSystemPrompt } from '../src/paths.js';
import { CORE_LESSONS_HEADER, KB_HEADER } from '../src/llm/message.js';
import { makeTmpVault } from './helpers.js';
import type { AtomProposal, CoverageEntry, LlmResponse } from '../src/schema/proposal.js';

/**
 * عقد v2: الأدلة تشير إلى بلوكات (blockId)، وكل بلوك أساسي له coverage مرة واحدة بالضبط.
 * يغطي: الرد الصحيح، فشل grounding داخل البلوك، وبلوكات/ملفات مجهولة، وعقد coverage.
 */

const LESSON_ONE = `# One

Last updated October 2023

HTML is a markup language. It does not contain programming logic.

## Headings

The h1 element represents the most important topic of the current page.
`;

const LESSON_TWO = `# Two

Emmet is a code editor plugin.
`;

const RECAP = `# Chapter recap

- HTML is a markup language.
`;

const ROADMAP = `# Fixture map

1. Chapter one
\t1. [[One]]
\t2. [[Two]]
\t3. Do it ❌
\t4. Missing lesson
\t5. [[Chapter recap]]
`;

// البلوكات deterministic: b001 سطر التحديث، b002 الفقرة الأولى، b003 فقرة h1
const ONE_B001 = 'lessons/One.md#b001';
const ONE_B002 = 'lessons/One.md#b002';
const ONE_B003 = 'lessons/One.md#b003';
const TWO_B001 = 'lessons/Two.md#b001';

function atom(overrides: Partial<AtomProposal> = {}): AtomProposal {
  return {
    clientId: 'a1',
    title: 'الـ HTML لغة توصيف',
    statement: 'الـ HTML لغة توصيف وليست لغة منطق برمجي.',
    kind: 'concept',
    sourceRefs: [
      {
        file: 'lessons/One.md',
        blockId: ONE_B002,
        section: 'One',
        evidence: 'HTML is a markup language. It does not contain programming logic.',
      },
    ],
    prerequisites: [],
    related: [],
    confidence: 0.9,
    ...overrides,
  };
}

function fullCoverage(overrides: CoverageEntry[] = []): CoverageEntry[] {
  const base: CoverageEntry[] = [
    {
      blockId: ONE_B001,
      status: 'excluded',
      reason: 'administrative',
      note: 'سطر تاريخ التحديث فقط',
    },
    { blockId: ONE_B002, status: 'covered', atomIds: ['a1'] },
    { blockId: ONE_B003, status: 'covered', atomIds: ['a2'] },
    { blockId: TWO_B001, status: 'covered', atomIds: ['a3'] },
  ];
  const overridden = new Map(overrides.map((o) => [o.blockId, o] as const));
  return base.map((entry) => overridden.get(entry.blockId) ?? entry);
}

function validResponse(): LlmResponse {
  return {
    atoms: [
      atom(),
      atom({
        clientId: 'a2',
        title: 'دور h1 في الصفحة',
        statement: 'عنصر h1 يمثل أهم موضوع في الصفحة الحالية.',
        sourceRefs: [
          {
            file: 'lessons/One.md',
            blockId: ONE_B003,
            section: 'Headings',
            evidence: 'The h1 element represents the most important topic of the current page.',
          },
        ],
      }),
      atom({
        clientId: 'a3',
        title: 'ما هو Emmet',
        statement: 'Emmet إضافة محرر أكواد.',
        kind: 'fact',
        sourceRefs: [
          {
            file: 'lessons/Two.md',
            blockId: TWO_B001,
            section: 'Two',
            evidence: 'Emmet is a code editor plugin.',
          },
        ],
      }),
    ],
    coverage: fullCoverage(),
    warnings: ['تحذير تجريبي للتغطية'],
  };
}

function mockClient(response: LlmResponse | unknown, raw = false): LlmClient {
  return {
    async complete() {
      const body = raw ? String(response) : JSON.stringify(response);
      return `\`\`\`json\n${body}\n\`\`\``;
    },
  };
}

function buildPlan(vaultRoot: string) {
  return preparePlan({
    roadmapPath: path.join(vaultRoot, 'roadmaps', 'map.md'),
    vaultRoot,
    chapters: [1],
  });
}

async function runWith(
  response: unknown,
  raw = false,
  kbAtoms: Array<{ id: string; statement: string; kind: string }> = [],
) {
  const vault = makeTmpVault({
    'roadmaps/map.md': ROADMAP,
    'lessons/One.md': LESSON_ONE,
    'lessons/Two.md': LESSON_TWO,
    'lessons/Chapter recap.md': RECAP,
  });
  try {
    return await runExtraction({
      plan: buildPlan(vault.root),
      systemPrompt: loadSystemPrompt(),
      client: mockClient(response, raw),
      model: 'test-model',
      kbAtoms,
    });
  } finally {
    vault.cleanup();
  }
}

describe('التدفق الكامل مع mock (عقد v2)', () => {
  it('يقبل ردًا صحيحًا ويبني الناتج الكامل مع blocks وcoverage', async () => {
    const result = await runWith(validResponse());

    expect(result.schemaVersion).toBe(2);
    expect(result.coreLessons).toEqual(['lessons/One.md', 'lessons/Two.md']);
    expect(result.blocks.map((b) => b.id)).toEqual([ONE_B001, ONE_B002, ONE_B003, TWO_B001]);
    expect(result.blocks.find((b) => b.id === ONE_B003)?.section).toBe('Headings');
    expect(result.recapFiles).toEqual(['lessons/Chapter recap.md']);
    expect(result.exercises).toEqual([{ chapter: 1, title: 'Do it ❌' }]);
    expect(result.missing).toEqual([{ chapter: 1, title: 'Missing lesson', link: undefined }]);
    expect(result.atoms.length).toBe(3);
    expect(result.coverage.length).toBe(4);
    expect(result.warnings).toEqual(['تحذير تجريبي للتغطية']);
    expect(result.roadmap).toEqual({ path: 'roadmaps/map.md', chapters: [1] });
  });

  it('لا يعدل محتوى ملفات الدروس ولا الخارطة أثناء التدفق', async () => {
    const vault = makeTmpVault({
      'roadmaps/map.md': ROADMAP,
      'lessons/One.md': LESSON_ONE,
      'lessons/Two.md': LESSON_TWO,
      'lessons/Chapter recap.md': RECAP,
    });
    try {
      await runExtraction({
        plan: buildPlan(vault.root),
        systemPrompt: loadSystemPrompt(),
        client: mockClient(validResponse()),
        model: 'test-model',
      });
      expect(fs.readFileSync(path.join(vault.root, 'lessons', 'One.md'), 'utf8')).toBe(LESSON_ONE);
      expect(fs.readFileSync(path.join(vault.root, 'lessons', 'Chapter recap.md'), 'utf8')).toBe(
        RECAP,
      );
      expect(fs.readFileSync(path.join(vault.root, 'roadmaps', 'map.md'), 'utf8')).toBe(ROADMAP);
    } finally {
      vault.cleanup();
    }
  });

  it('fact وconstraint نوعان مقبولان', async () => {
    const result = await runWith({
      ...validResponse(),
      atoms: [
        ...validResponse().atoms,
        atom({
          clientId: 'a4',
          title: 'قيد ملف html',
          statement: 'اختصار Emmet لا يعمل إلا في ملف html.',
          kind: 'constraint',
          sourceRefs: [
            {
              file: 'lessons/Two.md',
              blockId: TWO_B001,
              section: 'Two',
              evidence: 'Emmet is a code editor plugin.',
            },
          ],
        }),
      ],
      coverage: [
        { blockId: ONE_B001, status: 'excluded', reason: 'administrative', note: 'تحديث' },
        { blockId: ONE_B002, status: 'covered', atomIds: ['a1'] },
        { blockId: ONE_B003, status: 'covered', atomIds: ['a2'] },
        { blockId: TWO_B001, status: 'covered', atomIds: ['a3', 'a4'] },
      ],
    });
    expect(result.atoms.map((a) => a.kind)).toContain('fact');
    expect(result.atoms.map((a) => a.kind)).toContain('constraint');
  });
});

describe('قاعدة المعرفة وduplicateOf', () => {
  it('duplicateOf لمعرف موجود في قاعدة المعرفة يُقبل ويمر للناتج', async () => {
    const base = validResponse();
    const withDup = {
      ...base,
      atoms: base.atoms.map((a, i) => (i === 0 ? { ...a, duplicateOf: 'k0007' } : a)),
    };
    const result = await runWith(withDup, false, [
      { id: 'k0007', statement: 'الـ HTML لغة توصيف.', kind: 'concept' },
    ]);
    expect(result.atoms.find((a) => a.clientId === 'a1')).toMatchObject({ duplicateOf: 'k0007' });
  });

  it('duplicateOf بلا قاعدة معرفة مرسلة (أو بمعرف مجهول) يُرفض', async () => {
    await expect(
      runWith({
        ...validResponse(),
        atoms: validResponse().atoms.map((a, i) => (i === 0 ? { ...a, duplicateOf: 'k0042' } : a)),
      }),
    ).rejects.toThrow(/duplicateOf يشير إلى معرف غير موجود/);
  });

  it('قسم قاعدة المعرفة يُرسل في رسالة المستخدم قبل الدروس', async () => {
    let seen = '';
    const vault = makeTmpVault({
      'roadmaps/map.md': ROADMAP,
      'lessons/One.md': LESSON_ONE,
      'lessons/Two.md': LESSON_TWO,
      'lessons/Chapter recap.md': RECAP,
    });
    try {
      const client: LlmClient = {
        async complete(messages) {
          seen = messages[1]!.content;
          return `\`\`\`json\n${JSON.stringify(validResponse())}\n\`\`\``;
        },
      };
      await runExtraction({
        plan: buildPlan(vault.root),
        systemPrompt: loadSystemPrompt(),
        client,
        model: 'test-model',
        kbAtoms: [{ id: 'k0007', statement: 'الـ HTML لغة توصيف.', kind: 'concept' }],
      });
      const kbIndex = seen.indexOf(KB_HEADER);
      const coreIndex = seen.indexOf(CORE_LESSONS_HEADER);
      expect(kbIndex).toBeGreaterThan(-1);
      expect(kbIndex).toBeLessThan(coreIndex);
      expect(seen).toContain('[k0007] (concept)');
    } finally {
      vault.cleanup();
    }
  });
});

describe('رفض الردود غير الصالحة (لا إصلاح صامت)', () => {
  it('يرفض evidence مختلقًا غير موجود حرفيًا داخل البلوك المشار إليه', async () => {
    await expect(
      runWith({
        ...validResponse(),
        atoms: [
          atom({
            sourceRefs: [
              {
                file: 'lessons/One.md',
                blockId: ONE_B002,
                section: 'One',
                evidence: 'CSS is a programming language.',
              },
            ],
          }),
        ],
      }),
    ).rejects.toThrow(/اقتباس غير موجود حرفيًا داخل البلوك/);
  });

  it('يرفض evidence موجودًا في الملف لكن في بلوك آخر', async () => {
    await expect(
      runWith({
        ...validResponse(),
        atoms: [
          atom({
            sourceRefs: [
              {
                file: 'lessons/One.md',
                blockId: ONE_B002, // الدليل من b003 لا من b002
                section: 'One',
                evidence: 'The h1 element represents the most important topic of the current page.',
              },
            ],
          }),
        ],
      }),
    ).rejects.toThrow(/داخل البلوك/);
  });

  it('يقبل evidence بعد تطبيع المسافات فقط', async () => {
    const result = await runWith({
      ...validResponse(),
      atoms: [
        atom({
          sourceRefs: [
            {
              file: 'lessons/One.md',
              blockId: ONE_B002,
              section: 'One',
              evidence: 'HTML is a markup language.   It does not contain\nprogramming logic.',
            },
          ],
        }),
      ],
      coverage: fullCoverage([
        { blockId: ONE_B003, status: 'excluded', reason: 'course_meta', note: 'لا معرفة' },
        { blockId: TWO_B001, status: 'excluded', reason: 'course_meta', note: 'لا معرفة' },
      ]),
    });
    expect(result.atoms.length).toBe(1);
  });

  it('يرفض مرجع ملف مجهول خارج الملفات المرسلة', async () => {
    await expect(
      runWith({
        ...validResponse(),
        atoms: [
          atom({
            sourceRefs: [
              { file: 'lessons/Unknown.md', blockId: 'x', section: 's', evidence: 'anything' },
            ],
          }),
        ],
      }),
    ).rejects.toThrow(/مرجع ملف غير موجود ضمن الملفات المرسلة/);
  });

  it('يرفض الاستشهاد بملف recap حتى ببلوك ما', async () => {
    await expect(
      runWith({
        ...validResponse(),
        atoms: [
          atom({
            sourceRefs: [
              {
                file: 'lessons/Chapter recap.md',
                blockId: 'lessons/Chapter recap.md#b001',
                section: 'Chapter recap',
                evidence: 'HTML is a markup language.',
              },
            ],
          }),
        ],
      }),
    ).rejects.toThrow(/recap ليس مصدر دليل/);
  });

  it('يرفض بلوكًا مجهولًا في sourceRefs', async () => {
    await expect(
      runWith({
        ...validResponse(),
        atoms: [
          atom({
            sourceRefs: [
              {
                file: 'lessons/One.md',
                blockId: 'lessons/One.md#b999',
                section: 's',
                evidence: 'HTML is a markup language.',
              },
            ],
          }),
        ],
      }),
    ).rejects.toThrow(/بلوك مجهول/);
  });

  it('يرفض blockId لا يخص الملف المذكور في sourceRef', async () => {
    await expect(
      runWith({
        ...validResponse(),
        atoms: [
          atom({
            sourceRefs: [
              {
                file: 'lessons/One.md', // البلوك يخص Two
                blockId: TWO_B001,
                section: 'Two',
                evidence: 'Emmet is a code editor plugin.',
              },
            ],
          }),
        ],
      }),
    ).rejects.toThrow(/لا يخص الملف/);
  });

  it('يرفض علاقة إلى clientId مجهول', async () => {
    await expect(
      runWith({ ...validResponse(), atoms: [atom({ related: ['a99'] })] }),
    ).rejects.toThrow(/related يشير إلى clientId غير موجود/);
    await expect(
      runWith({ ...validResponse(), atoms: [atom({ prerequisites: ['ghost'] })] }),
    ).rejects.toThrow(/prerequisites يشير إلى clientId غير موجود/);
  });

  it('يرفض تكرار clientId', async () => {
    await expect(runWith({ ...validResponse(), atoms: [atom(), atom()] })).rejects.toThrow(
      /تكرار clientId/,
    );
  });

  it('يرفض ردًا بلا ذرات', async () => {
    await expect(
      runWith({ ...validResponse(), atoms: [], coverage: fullCoverage() }),
    ).rejects.toThrow(/لا يحتوي أي ذرات/);
  });

  it('يرفض ثقة خارج المجال وحقل kind غير معروف عبر الـ schema', async () => {
    await expect(
      runWith({ ...validResponse(), atoms: [atom({ confidence: 1.5 })] }),
    ).rejects.toThrow(/schema/);
    await expect(
      runWith({
        ...validResponse(),
        atoms: [atom({ kind: 'flashcard' as AtomProposal['kind'] })],
      }),
    ).rejects.toThrow(/schema/);
  });

  it('يرفض سبب استبعاد خارج القائمة (duplicate/low_importance) وnote فارغة عبر الـ schema', async () => {
    await expect(
      runWith({
        ...validResponse(),
        coverage: fullCoverage([
          {
            blockId: ONE_B001,
            status: 'excluded',
            reason: 'duplicate' as never,
            note: 'مكرر',
          },
        ]),
      }),
    ).rejects.toThrow(/schema/);
    await expect(
      runWith({
        ...validResponse(),
        coverage: fullCoverage([
          { blockId: ONE_B001, status: 'excluded', reason: 'low_importance' as never, note: 'x' },
        ]),
      }),
    ).rejects.toThrow(/schema/);
    await expect(
      runWith({
        ...validResponse(),
        coverage: fullCoverage([
          { blockId: ONE_B001, status: 'excluded', reason: 'administrative', note: '' },
        ]),
      }),
    ).rejects.toThrow(/schema/);
  });

  it('يرفض ردًا ليس JSON أصلًا', async () => {
    await expect(runWith('هذا نص حر ليس JSON', true)).rejects.toThrow(/ليس JSON صالحًا/);
  });
});

describe('عقد coverage', () => {
  it('يرفض بلوكًا أساسيًا بلا coverage (إسقاط صامت)', async () => {
    await expect(
      runWith({
        ...validResponse(),
        coverage: fullCoverage().filter((c) => c.blockId !== ONE_B001),
      }),
    ).rejects.toThrow(/بلوك أساسي بلا coverage/);
  });

  it('يرفض تكرار بلوك في coverage', async () => {
    await expect(
      runWith({
        ...validResponse(),
        coverage: [...fullCoverage(), { blockId: ONE_B002, status: 'covered', atomIds: ['a1'] }],
      }),
    ).rejects.toThrow(/تكرار في coverage/);
  });

  it('يرفض بلوكًا مجهولًا في coverage', async () => {
    await expect(
      runWith({
        ...validResponse(),
        coverage: [
          ...fullCoverage(),
          { blockId: 'lessons/One.md#b999', status: 'covered', atomIds: ['a1'] },
        ],
      }),
    ).rejects.toThrow(/بلوك مجهول في coverage/);
  });

  it('يرفض atomIds فارغة عبر الـ schema ومجهولة عبر التحقق الدلالي', async () => {
    await expect(
      runWith({
        ...validResponse(),
        coverage: fullCoverage([{ blockId: ONE_B002, status: 'covered', atomIds: [] }]),
      }),
    ).rejects.toThrow(ExtractionValidationError);

    await expect(
      runWith({
        ...validResponse(),
        coverage: fullCoverage([{ blockId: ONE_B002, status: 'covered', atomIds: ['ghost'] }]),
      }),
    ).rejects.toThrow(/clientId مجهول/);
  });

  it('يرفض ذرة لا يشير إليها أي بلوك covered', async () => {
    await expect(
      runWith({
        ...validResponse(),
        coverage: fullCoverage([
          // a2 و a3 موجودان لكن b003 وb002 يستبعدان: تبقى a2/a3 بلا تغطية
          { blockId: ONE_B002, status: 'excluded', reason: 'course_meta', note: 'x' },
          { blockId: ONE_B003, status: 'excluded', reason: 'course_meta', note: 'x' },
          { blockId: TWO_B001, status: 'excluded', reason: 'course_meta', note: 'x' },
        ]),
      }),
    ).rejects.toThrow(/لا يشير إليها أي بلوك covered/);
  });

  it('يقبل عدة بلوكات تغطي الذرة نفسها وذرة بعدة sourceRefs', async () => {
    const result = await runWith({
      ...validResponse(),
      atoms: [
        atom({
          sourceRefs: [
            {
              file: 'lessons/One.md',
              blockId: ONE_B002,
              section: 'One',
              evidence: 'HTML is a markup language. It does not contain programming logic.',
            },
            {
              file: 'lessons/Two.md',
              blockId: TWO_B001,
              section: 'Two',
              evidence: 'Emmet is a code editor plugin.',
            },
          ],
        }),
      ],
      coverage: [
        { blockId: ONE_B001, status: 'excluded', reason: 'administrative', note: 'تحديث' },
        { blockId: ONE_B002, status: 'covered', atomIds: ['a1'] },
        { blockId: ONE_B003, status: 'excluded', reason: 'course_meta', note: 'لا معرفة جديدة' },
        { blockId: TWO_B001, status: 'covered', atomIds: ['a1'] },
      ],
    });
    expect(result.atoms[0]?.sourceRefs.length).toBe(2);
    expect(result.coverage.filter((c) => c.status === 'covered')).toHaveLength(2);
  });
});
