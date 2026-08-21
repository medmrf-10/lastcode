import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  commitDecisions,
  defaultKbPath,
  EMPTY_KB,
  loadDecisionsFile,
  loadKnowledgeBase,
  loadOrCreateKnowledgeBase,
  loadProposalFile,
  originDecision,
  saveKnowledgeBase,
  type KnowledgeBase,
} from '../src/domain/kb.js';
import type { AtomProposal } from '../src/schema/proposal.js';
import { makeTmpVault } from './helpers.js';

/**
 * عقد قاعدة المعرفة: commit يحوّل قرارات المراجعة إلى ذرات دائمة،
 * ويدمج مصادر duplicateOf في الذرة القائمة، ولا يكرر الالتزام لنفس الاقتراح.
 */

const DECIDED_AT = '2026-08-21T00:00:00.000Z';

function atom(overrides: Partial<AtomProposal> = {}): AtomProposal {
  return {
    clientId: 'a1',
    title: 'الـ HTML لغة توصيف',
    statement: 'الـ HTML لغة توصيف وليست لغة منطق برمجي.',
    kind: 'concept',
    sourceRefs: [
      {
        file: 'lessons/One.md',
        blockId: 'lessons/One.md#b002',
        section: 'One',
        evidence: 'HTML is a markup language.',
      },
    ],
    prerequisites: [],
    related: [],
    confidence: 0.9,
    ...overrides,
  };
}

const PROPOSAL_ATOMS = [
  atom(), // a1
  atom({
    clientId: 'a2',
    title: 'بنية عنصر HTML',
    statement: 'عنصر HTML يتكون من وسم فتح ومحتوى ووسم إغلاق.',
    kind: 'concept',
    sourceRefs: [
      {
        file: 'lessons/One.md',
        blockId: 'lessons/One.md#b003',
        section: 'One',
        evidence: 'opening tag and closing tag',
      },
    ],
  }),
  atom({
    clientId: 'a3',
    title: 'مكررة',
    statement: 'HTML لغة توصيف.',
    kind: 'concept',
    duplicateOf: 'k0001',
    sourceRefs: [
      {
        file: 'lessons/One.md',
        blockId: 'lessons/One.md#b004',
        section: 'One',
        evidence: 'markup language again',
      },
    ],
  }),
  atom({
    clientId: 'a4',
    title: 'مرفوضة',
    statement: 'ذرة سيرفضها المستخدم.',
    kind: 'fact',
    sourceRefs: [
      {
        file: 'lessons/One.md',
        blockId: 'lessons/One.md#b005',
        section: 'One',
        evidence: 'rejected evidence',
      },
    ],
  }),
];

const DECISIONS = {
  a1: { decision: 'accepted' },
  a2: { decision: 'accepted' },
  a3: { decision: 'accepted' },
  a4: { decision: 'rejected' },
};

describe('commitDecisions', () => {
  it('يضيف المعتمد بمعرفات تسلسلية ويتجاهل المرفوض', () => {
    const { kb, summary } = commitDecisions({
      kb: EMPTY_KB,
      proposalName: 'test',
      atoms: PROPOSAL_ATOMS,
      decisions: DECISIONS,
      decidedAt: DECIDED_AT,
    });

    expect(summary.added.map((a) => a.id)).toEqual(['k0001', 'k0002']);
    expect(summary.added.map((a) => a.clientId)).toEqual(['a1', 'a2']);
    expect(summary.skipped).toEqual([{ clientId: 'a4', reason: 'rejected' }]);
    expect(kb.atoms).toHaveLength(2);
    const k1 = kb.atoms[0]!;
    expect(k1.id).toBe('k0001');
    expect(k1.title).toBe('الـ HTML لغة توصيف');
    // a3 (duplicateOf k0001) دُمجت في نفس الالتزام فأضافت أصلًا ثانيًا
    expect(k1.origins.map((o) => o.clientId)).toEqual(['a1', 'a3']);
    expect(k1.origins[0]).toMatchObject({ proposal: 'test', decidedAt: DECIDED_AT });
  });

  it('يدمج مصادر duplicateOf في الذرة القائمة بلا تكرار بلوك', () => {
    const base: KnowledgeBase = {
      schemaVersion: 1,
      atoms: [
        {
          id: 'k0001',
          title: 'الـ HTML لغة توصيف',
          statement: 'الـ HTML لغة توصيف وليست لغة منطق برمجي.',
          kind: 'concept',
          sources: [{ file: 'lessons/One.md', blockId: 'lessons/One.md#b002', section: 'One' }],
          origins: [{ proposal: 'old', clientId: 'x1', decidedAt: '2020-01-01T00:00:00.000Z' }],
        },
      ],
    };

    const { kb, summary } = commitDecisions({
      kb: base,
      proposalName: 'test',
      atoms: [PROPOSAL_ATOMS[2]!, PROPOSAL_ATOMS[3]!],
      decisions: DECISIONS,
      decidedAt: DECIDED_AT,
    });

    expect(summary.merged).toEqual([{ id: 'k0001', clientId: 'a3' }]);
    expect(summary.added).toEqual([]);
    const k1 = kb.atoms[0]!;
    expect(k1.sources.map((s) => s.blockId)).toEqual([
      'lessons/One.md#b002',
      'lessons/One.md#b004',
    ]);
    expect(k1.origins).toHaveLength(2);
    expect(k1.origins[1]).toMatchObject({ proposal: 'test', clientId: 'a3' });
    // القاعدة الأصلية لم تُmutate
    expect(base.atoms[0]!.sources).toHaveLength(1);
  });

  it('idempotent: إعادة الالتزام لنفس الاقتراح لا تضيف ولا تكرر', () => {
    const first = commitDecisions({
      kb: EMPTY_KB,
      proposalName: 'test',
      atoms: PROPOSAL_ATOMS,
      decisions: DECISIONS,
      decidedAt: DECIDED_AT,
    });
    const second = commitDecisions({
      kb: first.kb,
      proposalName: 'test',
      atoms: PROPOSAL_ATOMS,
      decisions: DECISIONS,
      decidedAt: DECIDED_AT,
    });

    expect(second.summary.added).toEqual([]);
    expect(second.summary.merged).toEqual([]);
    expect(second.kb.atoms).toHaveLength(first.kb.atoms.length);
    expect(second.kb).toEqual(first.kb);
  });

  it('duplicateOf لمعرف غير موجود يُسجل متجاهلًا ولا يفشل الصمت', () => {
    const { summary } = commitDecisions({
      kb: EMPTY_KB,
      proposalName: 'test',
      atoms: [PROPOSAL_ATOMS[2]!],
      decisions: { a3: { decision: 'accepted' } },
      decidedAt: DECIDED_AT,
    });
    expect(summary.skipped).toEqual([{ clientId: 'a3', reason: 'unknown_duplicate' }]);
  });

  it('بلا قرار: السبب undecided لا rejected', () => {
    const { summary } = commitDecisions({
      kb: EMPTY_KB,
      proposalName: 'p1',
      atoms: [PROPOSAL_ATOMS[0]!],
      decisions: {},
      decidedAt: DECIDED_AT,
    });
    expect(summary.skipped).toEqual([{ clientId: 'a1', reason: 'undecided' }]);
  });

  it('قرار known («أعرفها»): يُعتمد دائمًا مع تسجيل decision في الأصل', () => {
    const { kb, summary } = commitDecisions({
      kb: EMPTY_KB,
      proposalName: 'p1',
      atoms: PROPOSAL_ATOMS,
      decisions: {
        a1: { decision: 'known' },
        a2: { decision: 'accepted' },
        a3: { decision: 'rejected' },
        a4: { decision: 'rejected' },
      },
      decidedAt: DECIDED_AT,
    });

    // a1 (known) وa2 (accepted) كلاهما ذرتان جديدتان؛ a1 في addedKnown
    expect(summary.added.map((a) => a.clientId)).toEqual(['a2']);
    expect(summary.addedKnown.map((a) => a.clientId)).toEqual(['a1']);
    expect(kb.atoms).toHaveLength(2);

    // a1 اعتمدت أولًا فحصلت على k0001، وa2 على k0002
    const knownAtom = kb.atoms.find((a) => a.id === 'k0001')!;
    expect(knownAtom.origins[0]).toMatchObject({
      proposal: 'p1',
      clientId: 'a1',
      decision: 'known',
      decidedAt: DECIDED_AT,
    });
    // ذرة accepted العادية: decision الافتراضي accepted (يُقرأ عبر originDecision)
    const normalAtom = kb.atoms.find((a) => a.id === 'k0002')!;
    expect(originDecision(normalAtom.origins[0]!)).toBe('accepted');
  });
});

describe('ملفات قاعدة المعرفة', () => {
  it('defaultKbPath تحت .learn في جذر الـ vault', () => {
    expect(defaultKbPath('/vault')).toBe(path.join('/vault', '.learn', 'knowledge-base.json'));
  });

  it('loadOrCreate: غائبة → فارغة، موجودة → تُحمّل، فاسدة → خطأ واضح', () => {
    const vault = makeTmpVault({
      '.learn/knowledge-base.json': JSON.stringify({
        schemaVersion: 1,
        atoms: [
          {
            id: 'k0001',
            title: 't',
            statement: 's',
            kind: 'concept',
            sources: [{ file: 'f', blockId: 'f#b1', section: 'S' }],
            origins: [{ proposal: 'p', clientId: 'a1', decidedAt: DECIDED_AT }],
          },
        ],
      }),
    });
    try {
      const root = vault.root;
      const missing = path.join(root, '.learn', 'nope.json');
      expect(loadOrCreateKnowledgeBase(missing)).toEqual({ kb: EMPTY_KB, existed: false });

      const { kb, existed } = loadOrCreateKnowledgeBase(defaultKbPath(root));
      expect(existed).toBe(true);
      expect(kb.atoms[0]!.id).toBe('k0001');

      const bad = path.join(root, '.learn', 'bad.json');
      fs.writeFileSync(bad, '{"schemaVersion": 1, "atoms": [{"id": "xx"}]}', 'utf8');
      expect(() => loadKnowledgeBase(bad)).toThrow(/لا يطابق العقد/);
    } finally {
      vault.cleanup();
    }
  });

  it('save ثم load ذهابًا وعودة', () => {
    const vault = makeTmpVault({});
    try {
      const file = defaultKbPath(vault.root);
      const { kb } = commitDecisions({
        kb: EMPTY_KB,
        proposalName: 'p1',
        atoms: [PROPOSAL_ATOMS[0]!],
        decisions: { a1: { decision: 'accepted' } },
        decidedAt: DECIDED_AT,
      });
      saveKnowledgeBase(file, kb);
      expect(loadKnowledgeBase(file)).toEqual(kb);
    } finally {
      vault.cleanup();
    }
  });

  it('loadProposalFile وloadDecisionsFile يرفضان الملفات الفاسدة برسائل عربية', () => {
    const vault = makeTmpVault({
      'proposal.json': '{"atoms": "nope"}',
      'decisions.json': '[1,2,3]',
    });
    try {
      expect(() => loadProposalFile(path.join(vault.root, 'proposal.json'))).toThrow(
        /ملف الاقتراح لا يطابق العقد/,
      );
      expect(() => loadDecisionsFile(path.join(vault.root, 'decisions.json'))).toThrow(
        /ليس كائن JSON/,
      );
      expect(() => loadDecisionsFile(path.join(vault.root, 'missing.json'))).toThrow(
        /من صفحة المراجعة/,
      );
    } finally {
      vault.cleanup();
    }
  });
});
