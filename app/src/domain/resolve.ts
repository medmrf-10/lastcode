import path from 'node:path';
import fs from 'node:fs';
import type { RawChapter, RawItem } from './parseRoadmap.js';

/**
 * فهرسة الـ vault وحل روابط Obsidian:
 * - `[[Name]]` بالاسم (basename) عبر كامل الـ vault، مع فشل واضح عند الغموض.
 * - `[[path/Name]]` بالمسار النسبي لجذر الـ vault (مع الاسم المستعار والامتداد اختياريين)،
 *   وممنوع الخروج من الـ vault عبر `..`.
 */

export interface VaultIndex {
  /** basename (بدون الامتداد) كما ورد -> مسارات vault-relative */
  exact: Map<string, string[]>;
  /** نفس الفهرس بأحرف صغيرة للمطابقة غير الحساسة لحالة الأحرف */
  lower: Map<string, string[]>;
  /** مسار vault-relative كما ورد -> نفسه (لحل الروابط ذات المسار) */
  paths: Map<string, string>;
  /** نفس فهرس المسارات بأحرف صغيرة */
  pathsLower: Map<string, string>;
}

const DEFAULT_EXCLUDED_DIRS = new Set([
  'node_modules',
  'dist',
  'coverage',
  '.learn',
  '.git',
  '.obsidian',
]);

export interface IndexOptions {
  /** مجلدات إضافية تُستبعد بالاسم */
  excludedDirs?: string[];
  /** مسارات مطلقة تُستبعد كاملة (مثل جذر حزمة الأداة نفسها) */
  excludedAbsolute?: string[];
}

export function indexVault(root: string, options: IndexOptions = {}): VaultIndex {
  const excludedNames = new Set([...DEFAULT_EXCLUDED_DIRS, ...(options.excludedDirs ?? [])]);
  const excludedAbs = new Set((options.excludedAbsolute ?? []).map((p) => path.resolve(p)));
  const exact = new Map<string, string[]>();
  const lower = new Map<string, string[]>();
  const paths = new Map<string, string>();
  const pathsLower = new Map<string, string>();

  const push = (map: Map<string, string[]>, key: string, rel: string) => {
    const list = map.get(key);
    if (list) list.push(rel);
    else map.set(key, [rel]);
  };

  const walk = (dir: string) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name.startsWith('.') || excludedNames.has(entry.name)) continue;
        if (excludedAbs.has(abs)) continue;
        walk(abs);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
        const rel = path.relative(root, abs).split(path.sep).join('/');
        const base = entry.name.replace(/\.md$/i, '');
        push(exact, base, rel);
        push(lower, base.toLowerCase(), rel);
        // مفاتيح المسارات بلا امتداد .md لتطابق الروابط المكتوبة بدونه أو به
        const pathKey = rel.replace(/\.md$/i, '');
        if (!paths.has(pathKey)) paths.set(pathKey, rel);
        const pathKeyLower = pathKey.toLowerCase();
        if (!pathsLower.has(pathKeyLower)) pathsLower.set(pathKeyLower, rel);
      }
    }
  };

  walk(path.resolve(root));
  return { exact, lower, paths, pathsLower };
}

const WIKI_LINK = /\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]/;

/** يستخرج هدف أول رابط [[wiki]] من نص العنصر: اسمًا كان أم مسارًا، مع دعم `|alias` و`#heading`. */
export function extractWikiLink(text: string): string | undefined {
  const match = WIKI_LINK.exec(text);
  if (!match) return undefined;
  const name = (match[1] ?? '').trim().replace(/\.md$/i, '');
  return name.length > 0 ? name : undefined;
}

/**
 * يوحّد مسار رابط نسبي داخل الـ vault: شرطات مائلة أمامية، بلا امتداد، بلا خروج عبر `..`.
 * يعيد undefined إن كان المسار يحاول الهروب من الـ vault.
 */
export function normalizeVaultPath(raw: string): string | undefined {
  let p = raw.trim().replace(/\\/g, '/').replace(/^\/+/, '');
  if (/\.md$/i.test(p)) p = p.replace(/\.md$/i, '');
  const segments = p.split('/').filter((segment) => segment.length > 0);
  if (segments.some((segment) => segment === '..' || segment === '.')) return undefined;
  return segments.join('/');
}

export type ResolvedLink =
  | { status: 'resolved'; path: string }
  | { status: 'missing' }
  | { status: 'ambiguous'; candidates: string[] };

export function resolveWikiLink(index: VaultIndex, name: string): ResolvedLink {
  // رابط بمسار: حل مباشر فريد عبر فهرس المسارات؛ `..` يُرفض (missing) لا يهرب من الـ vault
  if (name.includes('/') || name.includes('\\')) {
    const target = normalizeVaultPath(name);
    if (!target) return { status: 'missing' };
    const direct = index.paths.get(target);
    if (direct) return { status: 'resolved', path: direct };
    const ci = index.pathsLower.get(target.toLowerCase());
    if (ci) return { status: 'resolved', path: ci };
    return { status: 'missing' };
  }

  // رابط بالاسم: مطابقة basename عبر كامل الـ vault (مع تحمل امتداد .md)
  const base = name.replace(/\.md$/i, '');
  const direct = index.exact.get(base);
  if (direct) {
    if (direct.length === 1) return { status: 'resolved', path: direct[0]! };
    return { status: 'ambiguous', candidates: direct };
  }
  const ci = index.lower.get(base.toLowerCase());
  if (ci) {
    if (ci.length === 1) return { status: 'resolved', path: ci[0]! };
    return { status: 'ambiguous', candidates: ci };
  }
  return { status: 'missing' };
}

export type ItemKind = 'lesson' | 'exercise' | 'recap' | 'missing';

export interface ResolvedItem extends RawItem {
  kind: ItemKind;
  /** هدف رابط الـ wiki إن وُجد في نص العنصر */
  link?: string;
  /** المسار المُحل داخل الـ vault (نسبيًا لجذره) للدروس وملفات recap */
  file?: string;
}

export class AmbiguityError extends Error {
  constructor(public readonly ambiguities: Array<{ link: string; candidates: string[] }>) {
    const detail = ambiguities
      .map(
        (a) =>
          `- "${a.link}" يطابق أكثر من ملف:\n${a.candidates.map((c) => `    • ${c}`).join('\n')}`,
      )
      .join('\n');
    super(`روابط غامضة في الخارطة (اسم ملف مكرر في الـ vault):\n${detail}`);
    this.name = 'AmbiguityError';
  }
}

/** عنوان يدل على recap: "Chapter recap" أو "Chapter 2 recap" ونحوه. */
const RECAP_TITLE = /^chapter\s*(?:\d+\s*)?recap$/i;

function isRecapFile(vaultRelativePath: string): boolean {
  const base = path.basename(vaultRelativePath, '.md').trim();
  return RECAP_TITLE.test(base);
}

/**
 * تصنيف عناصر الفصول المحددة:
 * - ❌ => تمرين (سواء كان رابطًا أم نصًا) ويُستبعد من الاستخراج.
 * - رابط [[wiki]] يُحل إلى ملف موجود => درس، أو recap إذا كان عنوان الملف كذلك.
 * - ما تبقى (نص بلا رابط، أو رابط بلا ملف) => مفقود.
 * فشل واضح عند تعدد الملفات بنفس الاسم بدل الاختيار العشوائي.
 */
export function resolveItems(chapters: RawChapter[], index: VaultIndex): ResolvedItem[] {
  const resolved: ResolvedItem[] = [];
  const ambiguities: Array<{ link: string; candidates: string[] }> = [];

  for (const chapter of chapters) {
    for (const item of chapter.items) {
      const link = extractWikiLink(item.text);

      if (item.text.includes('❌')) {
        resolved.push({ ...item, kind: 'exercise', link });
        continue;
      }

      if (link) {
        const result = resolveWikiLink(index, link);
        if (result.status === 'resolved') {
          resolved.push({
            ...item,
            kind: isRecapFile(result.path) ? 'recap' : 'lesson',
            link,
            file: result.path,
          });
        } else if (result.status === 'ambiguous') {
          ambiguities.push({ link, candidates: result.candidates });
          resolved.push({ ...item, kind: 'missing', link });
        } else {
          resolved.push({ ...item, kind: 'missing', link });
        }
        continue;
      }

      resolved.push({ ...item, kind: 'missing' });
    }
  }

  if (ambiguities.length > 0) throw new AmbiguityError(ambiguities);
  return resolved;
}
