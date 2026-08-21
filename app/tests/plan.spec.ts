import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { preparePlan } from '../src/domain/plan.js';
import { AmbiguityError } from '../src/domain/resolve.js';
import { runExtraction } from '../src/llm/extract.js';
import type { LlmClient } from '../src/llm/client.js';
import { loadSystemPrompt } from '../src/paths.js';
import { makeTmpVault } from './helpers.js';
import type { LlmResponse } from '../src/schema/proposal.js';

/**
 * إثبات أن ملفًا داخل مجلد الأداة يحمل اسم درس لا يغيّر الخطة (الملخص والاستخراج معًا)
 * ولا يسبب غموضًا، وأن التحضير الواحد هو مصدر الحقيقة للاثنين.
 */

const LESSON = `# One

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

const VALID_RESPONSE = {
  atoms: [
    {
      clientId: 'a1',
      title: 'الـ HTML لغة توصيف',
      statement: 'الـ HTML لغة توصيف وليست لغة منطق برمجي.',
      kind: 'concept',
      sourceRefs: [
        {
          file: 'lessons/One.md',
          blockId: 'lessons/One.md#b001',
          section: 'One',
          evidence: 'HTML is a markup language. It does not contain programming logic.',
        },
      ],
      prerequisites: [],
      related: [],
      confidence: 0.9,
    },
  ],
  coverage: [{ blockId: 'lessons/One.md#b001', status: 'covered', atomIds: ['a1'] }],
  warnings: [],
} satisfies LlmResponse;

const stubClient: LlmClient = {
  async complete() {
    return JSON.stringify(VALID_RESPONSE);
  },
};

describe('التحضير الموحد واستبعاد مجلد الأداة', () => {
  it('بدون استبعاد: مكرر داخل مجلد الأداة يسبب غموضًا', () => {
    const vault = makeTmpVault({
      'roadmaps/map.md': ROADMAP,
      'lessons/One.md': LESSON,
      'tool/lessons/One.md': 'نسخة من الأداة تحمل نفس اسم الدرس',
    });
    try {
      expect(() =>
        preparePlan({
          roadmapPath: path.join(vault.root, 'roadmaps', 'map.md'),
          vaultRoot: vault.root,
          chapters: [1],
        }),
      ).toThrowError(AmbiguityError);
    } finally {
      vault.cleanup();
    }
  });

  it('مع استبعاد مجلد الأداة: الخطة والاستخراج يتجاهلان المكرر تمامًا', async () => {
    const vault = makeTmpVault({
      'roadmaps/map.md': ROADMAP,
      'lessons/One.md': LESSON,
      'lessons/Chapter recap.md': RECAP,
      'tool/lessons/One.md': 'نسخة من الأداة تحمل نفس اسم الدرس',
      'tool/lessons/Chapter recap.md': 'نسخة recap من الأداة',
    });
    try {
      const plan = preparePlan({
        roadmapPath: path.join(vault.root, 'roadmaps', 'map.md'),
        vaultRoot: vault.root,
        chapters: [1],
        excludedAbsolute: [path.join(vault.root, 'tool')],
      });

      // نفس الخطة تُغذي «الملخص» (الحقول) و«الاستخراج» (runExtraction) دون إعادة تحليل
      expect(plan.coreLessonFiles).toEqual(['lessons/One.md']);
      expect(plan.recapFiles).toEqual(['lessons/Chapter recap.md']);
      expect(plan.exercises).toEqual([]);
      expect(plan.missing).toEqual([]);

      const result = await runExtraction({
        plan,
        systemPrompt: loadSystemPrompt(),
        client: stubClient,
        model: 'test-model',
      });
      expect(result.coreLessons).toEqual(['lessons/One.md']);
      expect(result.recapFiles).toEqual(['lessons/Chapter recap.md']);
      expect(result.atoms.length).toBe(1);
      expect(result.atoms[0]?.sourceRefs[0]?.file).toBe('lessons/One.md');
    } finally {
      vault.cleanup();
    }
  });
});
