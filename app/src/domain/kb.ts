import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import {
  AtomKindSchema,
  AtomProposalSchema,
  CoverageEntrySchema,
  type AtomProposal,
} from '../schema/proposal.js';

/**
 * قاعدة المعرفة الدائمة: الذرات التي اعتمدها المستخدم من اقتراحات المراجعة.
 *
 * الدورة: extract ينتج اقتراحًا → المراجعة البشرية تصدّر القرارات →
 * commit يدمج المعتمد هنا (ذرة جديدة أو مصادر إضافية لذرة قائمة عبر duplicateOf) →
 * extract التالي يرى هذه الذرات فلا يكررها.
 */

export const KB_SCHEMA_VERSION = 1;

export const KbSourceSchema = z.object({
  file: z.string().min(1),
  blockId: z.string().min(1),
  section: z.string(),
});
export type KbSource = z.infer<typeof KbSourceSchema>;

export const KbOriginSchema = z.object({
  /** اسم ملف الاقتراح الذي جاءت منه الذرة (بلا امتداد) */
  proposal: z.string().min(1),
  clientId: z.string().min(1),
  decidedAt: z.string().min(1),
  /** قرار الاعتماد: accepted عادي (الافتراضي)، known = «أعرفها» (فاصل أول طويل في FSRS) */
  decision: z.enum(['accepted', 'known']).optional(),
});
export type KbOrigin = z.infer<typeof KbOriginSchema>;

/** قرار أصل الاعتماد مع قيمته الافتراضية للقراءة. */
export function originDecision(origin: KbOrigin): 'accepted' | 'known' {
  return origin.decision ?? 'accepted';
}

export const KbAtomSchema = z.object({
  id: z.string().regex(/^k\d{4}$/, 'معرف الذرة يجب أن يكون بصيغة kNNNN'),
  title: z.string().min(1),
  statement: z.string().min(1),
  kind: AtomKindSchema,
  sources: z.array(KbSourceSchema).min(1),
  origins: z.array(KbOriginSchema).min(1),
});
export type KbAtom = z.infer<typeof KbAtomSchema>;

export const KnowledgeBaseSchema = z.object({
  schemaVersion: z.literal(KB_SCHEMA_VERSION),
  atoms: z.array(KbAtomSchema),
});
export type KnowledgeBase = z.infer<typeof KnowledgeBaseSchema>;

/** ما يُعرض على قاعدة معرفة موجودة */
export const EMPTY_KB: KnowledgeBase = { schemaVersion: KB_SCHEMA_VERSION, atoms: [] };

/** ملف اقتراح كامل كما كتبه extract (نتحقق من الحد الأدنى قبل الاعتماد) */
const ProposalFileSchema = z.object({
  roadmap: z.object({ path: z.string(), chapters: z.array(z.number()) }),
  atoms: z.array(AtomProposalSchema),
  coverage: z.array(CoverageEntrySchema),
});

export type DecisionEntry = {
  decision?: 'accepted' | 'known' | 'rejected' | string | null;
  note?: string | null;
  title?: string;
};
export type DecisionsFile = Record<string, DecisionEntry>;

export class KbError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KbError';
  }
}

export function loadKnowledgeBase(file: string): KnowledgeBase {
  let raw: string;
  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch {
    throw new KbError(`تعذر قراءة ملف قاعدة المعرفة: ${file}`);
  }
  const parsed = KnowledgeBaseSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `${i.path.join('.') || '(جذر)'}: ${i.message}`)
      .join(' | ');
    throw new KbError(`ملف قاعدة المعرفة لا يطابق العقد: ${details}`);
  }
  return parsed.data;
}

export function loadProposalFile(file: string): { proposalName: string; atoms: AtomProposal[] } {
  let raw: string;
  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch {
    throw new KbError(`تعذر قراءة ملف الاقتراح: ${file}`);
  }
  const parsed = ProposalFileSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `${i.path.join('.') || '(جذر)'}: ${i.message}`)
      .join(' | ');
    throw new KbError(`ملف الاقتراح لا يطابق العقد: ${details}`);
  }
  return {
    proposalName: path.basename(file).replace(/\.json$/i, ''),
    atoms: parsed.data.atoms,
  };
}

export function loadDecisionsFile(file: string): DecisionsFile {
  let raw: string;
  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch {
    throw new KbError(
      `تعذر قراءة ملف القرارات: ${file} (صدّره من صفحة المراجعة بزر «تصدير القرارات»)`,
    );
  }
  const parsed = z.record(z.string(), z.unknown()).safeParse(JSON.parse(raw));
  if (!parsed.success) {
    throw new KbError(`ملف القرارات ليس كائن JSON صالحًا: ${file}`);
  }
  const decisions: DecisionsFile = {};
  for (const [clientId, value] of Object.entries(parsed.data)) {
    if (value !== null && typeof value === 'object') {
      const entry = value as DecisionEntry;
      decisions[clientId] = {
        decision: typeof entry.decision === 'string' ? entry.decision : null,
        note: typeof entry.note === 'string' ? entry.note : null,
      };
    }
  }
  return decisions;
}

/** يبني قاعدة المعرفة من ملف موجود أو فارغة إن لم يوجد بعد. */
export function loadOrCreateKnowledgeBase(file: string): { kb: KnowledgeBase; existed: boolean } {
  if (!fs.existsSync(file)) return { kb: EMPTY_KB, existed: false };
  return { kb: loadKnowledgeBase(file), existed: true };
}

function nextKbId(atoms: KbAtom[]): string {
  const max = atoms.reduce((acc, a) => Math.max(acc, Number(a.id.slice(1)) || 0), 0);
  return `k${String(max + 1).padStart(4, '0')}`;
}

export interface CommitSummary {
  added: Array<{ id: string; clientId: string; title: string }>;
  /** ذرات «أعرفها»: معتمدة دائمًا لكن بفاصل أول طويل عند ربط FSRS */
  addedKnown: Array<{ id: string; clientId: string; title: string }>;
  merged: Array<{ id: string; clientId: string }>;
  /** الذرات المعتمدة التي دُمجت مصادرها في ذرة قائمة عبر duplicateOf */
  skipped: Array<{ clientId: string; reason: 'rejected' | 'undecided' | 'unknown_duplicate' }>;
  totals: { kbAtoms: number };
}

export interface CommitInput {
  kb: KnowledgeBase;
  proposalName: string;
  atoms: AtomProposal[];
  decisions: DecisionsFile;
  decidedAt: string;
}

/**
 * يدمج القرارات في قاعدة المعرفة:
 * - accepted/known بلا duplicateOf → ذرة جديدة بمعرف تسلسلي (known = «أعرفها»، فاصل أول طويل لاحقًا).
 * - المقبولة بـ duplicateOf → دمج مصادرها في الذرة القائمة (بلا تكرار blockId) مع تسجيل الأصل.
 * - المرفوضة/بلا قرار → تُتجاهل.
 * Idempotent: إعادة تنفيذ الالتزام على نفس الاقتراح لا تضيف شيئًا (الأصل مسجل مسبقًا).
 */
export function commitDecisions(input: CommitInput): { kb: KnowledgeBase; summary: CommitSummary } {
  const { kb, proposalName, atoms, decisions, decidedAt } = input;
  const result: KnowledgeBase = {
    schemaVersion: KB_SCHEMA_VERSION,
    atoms: kb.atoms.map((a) => ({ ...a, sources: [...a.sources], origins: [...a.origins] })),
  };
  const summary: CommitSummary = {
    added: [],
    addedKnown: [],
    merged: [],
    skipped: [],
    totals: { kbAtoms: 0 },
  };

  const alreadyCommitted = (clientId: string): boolean =>
    result.atoms.some((a) =>
      a.origins.some((o) => o.proposal === proposalName && o.clientId === clientId),
    );

  const byId = new Map(result.atoms.map((a) => [a.id, a]));

  for (const atom of atoms) {
    const decision = decisions[atom.clientId]?.decision;
    const isAccepted = decision === 'accepted' || decision === 'known';
    if (!isAccepted) {
      summary.skipped.push({
        clientId: atom.clientId,
        reason: decision === 'rejected' ? 'rejected' : 'undecided',
      });
      continue;
    }
    if (alreadyCommitted(atom.clientId)) continue; // التزام سابق لنفس الاقتراح

    if (atom.duplicateOf) {
      const existing = byId.get(atom.duplicateOf);
      if (!existing) {
        summary.skipped.push({ clientId: atom.clientId, reason: 'unknown_duplicate' });
        continue;
      }
      const knownBlocks = new Set(existing.sources.map((s) => s.blockId));
      for (const ref of atom.sourceRefs) {
        if (knownBlocks.has(ref.blockId)) continue;
        existing.sources.push({ file: ref.file, blockId: ref.blockId, section: ref.section });
        knownBlocks.add(ref.blockId);
      }
      existing.origins.push({ proposal: proposalName, clientId: atom.clientId, decidedAt });
      summary.merged.push({ id: existing.id, clientId: atom.clientId });
      continue;
    }

    const id = nextKbId(result.atoms);
    const kbAtom: KbAtom = {
      id,
      title: atom.title,
      statement: atom.statement,
      kind: atom.kind,
      sources: atom.sourceRefs.map((r) => ({
        file: r.file,
        blockId: r.blockId,
        section: r.section,
      })),
      origins: [
        {
          proposal: proposalName,
          clientId: atom.clientId,
          decidedAt,
          ...(decision === 'known' ? { decision: 'known' as const } : {}),
        },
      ],
    };
    result.atoms.push(kbAtom);
    byId.set(id, kbAtom);
    (decision === 'known' ? summary.addedKnown : summary.added).push({
      id,
      clientId: atom.clientId,
      title: atom.title,
    });
  }

  summary.totals.kbAtoms = result.atoms.length;
  return { kb: result, summary };
}

/** المسار الافتراضي لقاعدة المعرفة داخل جذر الـ vault. */
export function defaultKbPath(vaultRoot: string): string {
  return path.join(vaultRoot, '.learn', 'knowledge-base.json');
}

export function saveKnowledgeBase(file: string, kb: KnowledgeBase): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(kb, null, 2), 'utf8');
}
