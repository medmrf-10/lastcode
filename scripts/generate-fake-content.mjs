#!/usr/bin/env node
/**
 * ============================================================================
 *  scripts/generate-fake-content.mjs
 *  Synthetic content generator for the spaced-repetition system (TESTING ONLY)
 * ============================================================================
 *
 *  WHAT IT DOES
 *  ------------
 *  1. Reads the real .learn/knowledge-base.json (READ-ONLY) to find the max
 *     existing atom id (k0007) so new ids continue after it (k0008...k0057).
 *  2. Generates 50 synthetic Arabic atoms about HTML/CSS topics (headings,
 *     semantics, accessibility, CSS basics) covering all 7 kinds:
 *     concept, distinction, decision_rule, tool_skill, causal_relation,
 *     fact, constraint.
 *  3. Gives each atom plausible sources pointing at fake-but-consistent
 *     lesson files (lessons/fake/*.md#bNNN) and a synthetic learning history:
 *     origins[].decidedAt dates spread over the past ~6 months (older dates
 *     imply higher accumulated stability), with ~30% marked decision:'known'.
 *  4. Validates EVERY atom against the knowledge-base schema (inline pass that
 *     THROWS on any violation) — both in memory and after re-reading the
 *     written file back from disk.
 *  5. Writes .learn/fake/knowledge-base-fake.json with a _meta header:
 *     { generatedAt, count, purpose: 'testing-only' }.
 *
 *  HOW TO RUN (npm-less — zero dependencies, plain Node)
 *  -----------------------------------------------------
 *      node scripts/generate-fake-content.mjs
 *
 *  Requirements: Node.js >= 18. No `npm install` needed — only node:fs,
 *  node:path and node:url are used. Run from anywhere; paths are resolved
 *  relative to this script's location, not the current working directory.
 *
 *  DETERMINISM
 *  -----------
 *  Every "random" choice comes from a fixed-seed mulberry32 RNG (SEED below),
 *  and generatedAt is pinned to FIXED_NOW — so repeated runs produce
 *  byte-identical output. Change SEED to get a different (still stable)
 *  corpus. Verify with:
 *      node scripts/generate-fake-content.mjs && shasum .learn/fake/knowledge-base-fake.json
 *      node scripts/generate-fake-content.mjs && shasum .learn/fake/knowledge-base-fake.json
 *
 *  SAFETY
 *  ------
 *  Never writes to .learn/knowledge-base.json, app/, or notes/fsrs.ts.
 * ============================================================================
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// ----------------------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------------------

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SCRIPT_DIR, '..');
const REAL_KB_PATH = resolve(ROOT, '.learn/knowledge-base.json');
const OUT_DIR = resolve(ROOT, '.learn/fake');
const OUT_PATH = resolve(OUT_DIR, 'knowledge-base-fake.json');

const SEED = 20260901;          // fixed seed -> deterministic output
const FIXED_NOW_MS = Date.UTC(2026, 8, 1, 12, 0, 0, 0); // 2026-09-01T12:00:00.000Z (pinned anchor)
const TARGET_COUNT = 50;
const KNOWN_RATIO = 0.3;        // ~30% of atoms get decision:'known'
const HISTORY_SPAN_DAYS = 180;  // decidedAt spread: past ~6 months

const KINDS = /** @type {const} */ ([
  'concept',
  'distinction',
  'decision_rule',
  'tool_skill',
  'causal_relation',
  'fact',
  'constraint',
]);

// ----------------------------------------------------------------------------
// Seeded RNG (mulberry32) + helpers
// ----------------------------------------------------------------------------

function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const makeRng = () => mulberry32(SEED);
const randInt = (rng, min, max) => min + Math.floor(rng() * (max - min + 1)); // inclusive
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const pad4 = (n) => String(n).padStart(4, '0');
const pad3 = (n) => String(n).padStart(3, '0');

function shuffledIndices(rng, n) {
  const idx = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}

/** ISO timestamp `daysBack` days (plus 0-12h jitter) before the pinned anchor. */
function isoDaysBack(rng, daysBack) {
  const jitterMs = Math.floor(rng() * 12 * 60 * 60 * 1000);
  return new Date(FIXED_NOW_MS - daysBack * 86400000 - jitterMs).toISOString();
}

// ----------------------------------------------------------------------------
// Fake lesson files (fake-but-consistent source targets)
// ----------------------------------------------------------------------------

const FAKE_FILES = {
  headings: {
    file: 'lessons/fake/Intro to Headings.md',
    sections: ['Heading hierarchy', 'Choosing the right level', 'Recap'],
  },
  semantics: {
    file: 'lessons/fake/Intro to Semantics.md',
    sections: ['Semantic HTML', 'Landmarks and sections', 'Recap'],
  },
  accessibility: {
    file: 'lessons/fake/Accessibility Basics.md',
    sections: ['Alternative text', 'Color contrast', 'Keyboard access', 'Screen readers'],
  },
  css: {
    file: 'lessons/fake/CSS Fundamentals.md',
    sections: ['The box model', 'Selectors', 'Units and values', 'Cascade and inheritance'],
  },
  tools: {
    file: 'lessons/fake/DevTools and Emmet.md',
    sections: ['Inspecting structure', 'Emmet abbreviations', 'Measuring and auditing'],
  },
  overview: {
    file: 'lessons/fake/HTML Overview.md',
    sections: ['How HTML works', 'Document structure', 'Syntax rules'],
  },
};

// ----------------------------------------------------------------------------
// Synthetic content: 50 atoms across all 7 kinds (Arabic, HTML/CSS topics)
// ----------------------------------------------------------------------------

/** @returns {{kind: string, topic: keyof typeof FAKE_FILES, title: string, statement: string}[]} */
const CONTENT = [
  // --- concept (10) ---------------------------------------------------------
  { kind: 'concept', topic: 'semantics', title: 'مفهوم العنصر header',
    statement: 'يمثل العنصر header مقدمة الصفحة أو مقدمة قسم منها، ويضم عادةً العنوان الرئيسي والشعار وأدوات التنقل الأولى.' },
  { kind: 'concept', topic: 'semantics', title: 'مفهوم العنصر main',
    statement: 'يمثل العنصر main المحتوى الرئيسي الفريد للصفحة، ويجب أن يظهر مرة واحدة فقط ظاهرًا في كل صفحة.' },
  { kind: 'concept', topic: 'css', title: 'مفهوم نموذج الصندوق',
    statement: 'يتكون كل عنصر في CSS من صندوق بأربع طبقات متداخلة: المحتوى، ثم الهوامش الداخلية padding، ثم الحدود border، ثم الهوامش الخارجية margin.' },
  { kind: 'concept', topic: 'css', title: 'مفهوم الوراثة في CSS',
    statement: 'تُورَّث بعض خصائص CSS مثل color وfont-family تلقائيًا من العنصر الأب إلى أبنائه، بينما لا تُورَّث خصائص أخرى مثل margin وborder.' },
  { kind: 'concept', topic: 'accessibility', title: 'مفهوم قارئ الشاشة',
    statement: 'قارئ الشاشة أداة تحوّل نص الصفحة وبنيتها إلى صوت أو برايل، ويعتمد في التنقل على العناصر الدلالية ومعالم ARIA.' },
  { kind: 'concept', topic: 'headings', title: 'مفهوم التسلسل الهرمي للعناوين',
    statement: 'تنظّم العناوين من h1 إلى h6 بنية شجرية لمحتوى الصفحة، بحيث يقع كل عنوان فرعي تحت مظلّة العنوان الأعلى الذي يسبقه.' },
  { kind: 'concept', topic: 'css', title: 'مفهوم محدد الصنف class',
    statement: 'يستهدف محدد الصنف كل العناصر التي تشترك في قيمة السمة class نفسها بغضّ النظر عن نوع كل عنصر.' },
  { kind: 'concept', topic: 'semantics', title: 'مفهوم العنصر figure',
    statement: 'يغلّف العنصر figure المحتوى المستقل المرجعي كالصور والمخططات، ويُرفق غالبًا بتعليق توضيحي داخل figcaption.' },
  { kind: 'concept', topic: 'css', title: 'مفهوم وحدتي em وrem',
    statement: 'وحدة em نسبية إلى حجم خط العنصر نفسه، بينما rem نسبية إلى حجم خط العنصر الجذر html، وهذا ما يجعل rem أنسب للتناسق العام.' },
  { kind: 'concept', topic: 'accessibility', title: 'مفهوم سمة lang',
    statement: 'تُخبر سمة lang على العنصر html المتصفح وقارئ الشاشة بلغة محتوى الصفحة ليختارا قواعد العرض والنطق الصحيحة.' },

  // --- distinction (8) ------------------------------------------------------
  { kind: 'distinction', topic: 'semantics', title: 'section مقابل article',
    statement: 'يمثل article محتوى مستقلًا يصح نشره وحده كتدوينة أو خبر، بينما section تجميع موضوعي لمحتوى مترابط قد لا يصلح وحده.' },
  { kind: 'distinction', topic: 'semantics', title: 'nav مقابل أي قائمة روابط',
    statement: 'يُخصَّص nav لمجموعات الروابط الرئيسية المستخدمة في التنقل بين أجزاء الموقع، وليس لكل قائمة روابط عابرة داخل المحتوى.' },
  { kind: 'distinction', topic: 'semantics', title: 'aside مقابل main',
    statement: 'يحمل aside محتوى ثانويًا هامشيًا كالتنبيهات والمصطلحات، بينما يحمل main المحتوى الأساسي الذي تدور حوله الصفحة كلها.' },
  { kind: 'distinction', topic: 'css', title: 'id مقابل class',
    statement: 'قيمة id فريدة لعنصر واحد في الصفحة وتُستخدم للربط والتنقل، أما class فتتكرر على عناصر متعددة لتنسيقها معًا.' },
  { kind: 'distinction', topic: 'accessibility', title: 'alt فارغ مقابل alt مفقود',
    statement: 'السمة alt الفارغة تعني أن الصورة زخرفية فيتجاهلها قارئ الشاشة، بينما غياب alt كليًا يدفعه لقراءة اسم الملف بدلًا من وصف الصورة.' },
  { kind: 'distinction', topic: 'semantics', title: 'em مقابل i',
    statement: 'يمنح em تأكيدًا دلاليًا يغيّر نبرة الجملة عند القراءة الآلية، بينما i تنسيق بصري بلا معنى دلالي.' },
  { kind: 'distinction', topic: 'css', title: 'px مقابل rem',
    statement: 'الوحدة px قيمة ثابتة لا تتأثر بإعدادات المستخدم، بينما rem تتدرج مع حجم الخط المفضل لديه فتحافظ على مرونة الصفحة.' },
  { kind: 'distinction', topic: 'accessibility', title: 'button مقابل الرابط a',
    statement: 'يُستخدم button لتنفيذ فعل داخل الصفحة، بينما a للانتقال إلى وجهة أخرى؛ فالخلط بينهما يربك توقعات مستخدمي لوحة المفاتيح.' },

  // --- decision_rule (8) ----------------------------------------------------
  { kind: 'decision_rule', topic: 'headings', title: 'قاعدة عنوان h1 واحد',
    statement: 'اجعل h1 واحدًا فقط في كل صفحة ليمثل موضوعها الأهم، ثم تدرّج في المستويات دون قفز.' },
  { kind: 'decision_rule', topic: 'accessibility', title: 'قاعدة كتابة النص البديل',
    statement: 'اكتب في alt الغرض من الصورة كمعلومة مكافئة، وتجنّب المقدمات مثل صورة تُظهر أو صورة لـ.' },
  { kind: 'decision_rule', topic: 'accessibility', title: 'قاعدة نسبة التباين',
    statement: 'اجعل تباين النص مع خلفيته 4.5:1 على الأقل للنص العادي و3:1 للنص الكبير والعريض.' },
  { kind: 'decision_rule', topic: 'css', title: 'قاعدة ترتيب الخصائص',
    statement: 'رتّب خصائص CSS من البنيوي كالعرض والارتفاع إلى التباعد فالخصائص البصرية كاللون والظل لتسهيل مراجعة القواعد.' },
  { kind: 'decision_rule', topic: 'css', title: 'قاعدة اختيار الوحدة',
    statement: 'استخدم rem لأحجام الخطوط والتباعد العام، وpx للحدود والظلال الدقيقة، و% أو vw لعرض التخطيطات السائلة.' },
  { kind: 'decision_rule', topic: 'headings', title: 'قاعدة اختيار العنوان لموضوعه',
    statement: 'لا تختر مستوى العنوان لحجمه أو لونه؛ إن لم يناسبه المظهر فعدّل تنسيقه بـ CSS وأبقِ المستوى الدلالي على حاله.' },
  { kind: 'decision_rule', topic: 'css', title: 'قاعدة تسمية الأصناف',
    statement: 'سمِّ الأصناف بوصف الغرض لا المظهر، فاسم warning يبقى صحيحًا عند تغيير اللون بينما يضلّك اسم red-text.' },
  { kind: 'decision_rule', topic: 'accessibility', title: 'قاعدة الحفاظ على مؤشر التركيز',
    statement: 'لا تحذف حدود التركيز outline بلا بديل؛ إن أردت تخصيصها فصمّم مؤشرًا أوضح عبر focus-visible.' },

  // --- tool_skill (7) -------------------------------------------------------
  { kind: 'tool_skill', topic: 'accessibility', title: 'مهارة قياس التباين',
    statement: 'استخدم مقياس التباين في أدوات المطور لحساب النسبة بين لون النص ولون الخلفية والتأكد من اجتيازها الحد الأدنى.' },
  { kind: 'tool_skill', topic: 'accessibility', title: 'مهارة التنقل بلوحة المفاتيح',
    statement: 'تجوّل في صفحتك بمفتاح Tab وShift+Tab للتأكد من وصول كل عنصر تفاعلي ووضوح مؤشره وترتيبه المنطقي.' },
  { kind: 'tool_skill', topic: 'semantics', title: 'مهارة فحص البنية الدلالية',
    statement: 'افتح لوحة Elements في أدوات المطور وتفقّد أن البنية مبنية بعناصر دلالية لا بسلسلة div متداخلة.' },
  { kind: 'tool_skill', topic: 'accessibility', title: 'مهارة تجربة قارئ الشاشة',
    statement: 'شغّل قارئ الشاشة المدمج في المتصفح واستمع لصفحتك لاكتشاف العناوين والمعالم والنصوص البديلة الناقصة.' },
  { kind: 'tool_skill', topic: 'css', title: 'مهارة فحص حاوية flexbox',
    statement: 'فعّل أداة Flexbox في أدوات المطور لإظهار خطوط الحاوية وفهم اتجاه العناصر وطريقة توزيعها ومحاذاتها.' },
  { kind: 'tool_skill', topic: 'tools', title: 'مهارة توسيع اختصارات Emmet',
    statement: 'اكتب اختصار Emmet مثل nav>ul>li*3 ثم اضغط Tab لتوليد هيكل HTML متداخل كامل بضغطة واحدة.' },
  { kind: 'tool_skill', topic: 'accessibility', title: 'مهارة قياس أهداف اللمس',
    statement: 'استخدم أداة قياس المسافات في أدوات المطور للتأكد من أن كل هدف لمس لا يقل عن 44 بكسل في البُعدين.' },

  // --- causal_relation (7) --------------------------------------------------
  { kind: 'causal_relation', topic: 'accessibility', title: 'الدلاليات تسرّع التنقل الصوتي',
    statement: 'عندما تستخدم عناصر دلالية صحيحة، تظهر معالم الصفحة في قائمة تنقل قارئ الشاشة فيصل المستخدم إلى المحتوى أسرع.' },
  { kind: 'causal_relation', topic: 'headings', title: 'قفز المستويات يكسر البنية',
    statement: 'عندما تقفز من h1 إلى h4 مباشرة، يضطرب التسلسل الهرمي فيفقد قارئ الصفحة فكرة التقسيم الرئيسي.' },
  { kind: 'causal_relation', topic: 'css', title: 'البناء على rem يحافظ على النسب',
    statement: 'عندما تُبنى الأحجام على rem، يكبر النص بأكمله عند رفع المستخدم حجم الخط الافتراضي فتبقى نسب التصميم سليمة.' },
  { kind: 'causal_relation', topic: 'accessibility', title: 'alt ينقذ معلومة الصورة',
    statement: 'عندما يفشل تحميل صورة تحمل alt وصفيًا، يظهر النص البديل مكانها فيبقى المعنى متاحًا للقارئ.' },
  { kind: 'causal_relation', topic: 'accessibility', title: 'div قابل للنقر يفقد التركيز',
    statement: 'عندما يُستخدم div قابل للنقر بدل button، يخرج العنصر من ترتيب التنقل بلوحة المفاتيح فيتعذر الوصول إليه.' },
  { kind: 'causal_relation', topic: 'accessibility', title: 'التباين المنخفض يضعف القراءة',
    statement: 'عندما يقترب لون النص من لون الخلفية، تتراجع المقروئية في الإضاءة القوية ولدى ذوي الإبصار الضعيف.' },
  { kind: 'causal_relation', topic: 'css', title: 'تساوي الخصوصية يرجّح الأحدث',
    statement: 'عندما تتساوى خصوصية محددين، تفوز القاعدة الظاهرة لاحقًا في الملف لأن cascade يعتبر ترتيب المصدر عامل الحسم.' },

  // --- fact (6) -------------------------------------------------------------
  { kind: 'fact', topic: 'headings', title: 'ستة مستويات للعناوين',
    statement: 'تتوفر في HTML ستة مستويات عناوين فقط من h1 إلى h6، ولا توجد وسوم h7 فما فوق.' },
  { kind: 'fact', topic: 'accessibility', title: 'أقصى تباين ممكن',
    statement: 'تبلغ أقصى نسبة تباين بين لونين 21:1، وتتحقق بين الأسود الخالص والأبيض الخالص.' },
  { kind: 'fact', topic: 'semantics', title: 'main واحد ظاهر لكل صفحة',
    statement: 'يسمح معيار HTML بوجود عنصر main واحد ظاهر فقط في الصفحة الواحدة.' },
  { kind: 'fact', topic: 'css', title: 'سلوك العرض الافتراضي',
    statement: 'تشغل العناصر الكتلية مثل p وdiv عرض الحاوية كاملًا افتراضيًا، بينما لا يتسع العنصر السطري إلا لمحتواه.' },
  { kind: 'fact', topic: 'overview', title: 'HTML مواصفة حية',
    statement: 'تُدار مواصفة HTML القياسية اليوم من WHATWG كمواصفة حية تُحدَّث باستمرار بدل الإصدارات المرقمة القديمة.' },
  { kind: 'fact', topic: 'css', title: 'ترتيب قيم margin المختصرة',
    statement: 'يقبل الاختصار margin من قيمة إلى أربع قيم بترتيب عقارب الساعة: الأعلى فاليمين فالأسفل فاليسار.' },

  // --- constraint (4) -------------------------------------------------------
  { kind: 'constraint', topic: 'headings', title: 'قيد تدرّج العناوين',
    statement: 'لا يجوز القفز إلى مستوى عنوان أدنى دون المرور بالمستوى الأقرب، فبعد h1 يأتي h2 لا h3.' },
  { kind: 'constraint', topic: 'overview', title: 'قيد تفرد المعرف id',
    statement: 'لا يجوز أن تتكرر قيمة id نفسها في عنصرين داخل الصفحة الواحدة.' },
  { kind: 'constraint', topic: 'accessibility', title: 'قيد إلزامية alt',
    statement: 'سمة alt إلزامية في كل عنصر img حتى عندما تكون قيمتها فارغة للصور الزخرفية.' },
  { kind: 'constraint', topic: 'overview', title: 'قيد منع الكتلي داخل p',
    statement: 'لا يجوز وضع عنصر كتلي مثل div داخل فقرة p، لأن المتصفح يغلق الفقرة تلقائيًا فيكسر البنية المقصودة.' },
];

// ----------------------------------------------------------------------------
// Builders
// ----------------------------------------------------------------------------

/** Find the max numeric suffix among ids like k0007. */
function maxExistingAtomId(db) {
  let max = 0;
  for (const atom of db?.atoms ?? []) {
    const m = /^k(\d{4})$/.exec(String(atom?.id ?? ''));
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return max;
}

function makeSources(rng, topic) {
  const { file, sections } = FAKE_FILES[topic];
  const section = pick(rng, sections);
  const blockA = randInt(rng, 1, 60);
  const sources = [
    { file, blockId: `${file}#b${pad3(blockA)}`, section },
  ];
  // ~25% of atoms get a second source: same file, different block (mirrors real KB).
  if (rng() < 0.25) {
    let blockB = randInt(rng, 1, 60);
    if (blockB === blockA) blockB = ((blockB + 7) % 60) + 1;
    sources.push({ file, blockId: `${file}#b${pad3(blockB)}`, section });
  }
  return sources;
}

function makeOrigin(rng, daysBack) {
  return {
    proposal: `frontend-1-ch${randInt(rng, 1, 5)}-${randInt(rng, 1, 4)}`,
    clientId: `a${randInt(rng, 30, 79)}`,
    decidedAt: isoDaysBack(rng, daysBack),
  };
}

/**
 * Synthetic learning history: origins[].decidedAt spread over the past months
 * (first decision 30-180 days back; ~20% of atoms get a later re-decision
 * within the last 4 weeks). ~30% of atoms end with decision:'known' on their
 * latest origin — the decidedAt spread doubles as stability/difficulty-ish
 * signal for the FSRS engine under test (older history => higher implied S).
 */
function makeOrigins(rng, isKnown) {
  const origins = [makeOrigin(rng, randInt(rng, 30, HISTORY_SPAN_DAYS))];
  if (rng() < 0.2) origins.push(makeOrigin(rng, randInt(rng, 1, 29)));
  if (isKnown) origins[origins.length - 1].decision = 'known';
  return origins;
}

function buildAtoms(rng, startNumber) {
  if (CONTENT.length !== TARGET_COUNT) {
    throw new Error(`Content pool has ${CONTENT.length} entries, expected ${TARGET_COUNT}`);
  }
  // Deterministically mark exactly KNOWN_RATIO of atoms as 'known'.
  const knownCount = Math.round(TARGET_COUNT * KNOWN_RATIO);
  const knownSet = new Set(shuffledIndices(rng, TARGET_COUNT).slice(0, knownCount));

  return CONTENT.map((entry, i) => ({
    id: `k${pad4(startNumber + i)}`,
    title: entry.title,
    statement: entry.statement,
    kind: entry.kind,
    sources: makeSources(rng, entry.topic),
    origins: makeOrigins(rng, knownSet.has(i)),
  }));
}

// ----------------------------------------------------------------------------
// Schema validation (throws on ANY violation)
// ----------------------------------------------------------------------------

const ATOM_KEYS = ['id', 'kind', 'origins', 'sources', 'statement', 'title'].join(',');
const SOURCE_KEYS = ['blockId', 'file', 'section'].join(',');
const ORIGIN_REQUIRED = ['clientId', 'decidedAt', 'proposal'];
const ORIGIN_ALLOWED = ['clientId', 'decidedAt', 'decision', 'proposal'];
const DECISIONS = new Set(['accepted', 'known']);
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function assert(cond, msg) {
  if (!cond) throw new Error(`Schema violation: ${msg}`);
}

const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;
const sortedKeys = (obj) => Object.keys(obj).sort().join(',');

/**
 * Validates a knowledge-base document against the project schema:
 * { schemaVersion: 1, atoms: [{ id: /^k\d{4}$/, title, statement,
 *   kind (7 allowed), sources: [{file, blockId, section}] (min 1),
 *   origins: [{proposal, clientId, decidedAt, decision?: 'accepted'|'known'}] }] }
 * Accepts an optional _meta header (as written by this generator).
 */
export function validateKnowledgeBase(db, { label = 'document' } = {}) {
  assert(db && typeof db === 'object' && !Array.isArray(db), `${label}: root must be an object`);
  assert(db.schemaVersion === 1, `${label}: schemaVersion must be 1, got ${JSON.stringify(db.schemaVersion)}`);
  assert(Array.isArray(db.atoms), `${label}: atoms must be an array`);
  assert(db.atoms.length > 0, `${label}: atoms must not be empty`);

  const seenIds = new Set();
  db.atoms.forEach((atom, i) => {
    const where = `${label}: atoms[${i}]`;
    assert(atom && typeof atom === 'object' && !Array.isArray(atom), `${where}: must be an object`);
    assert(sortedKeys(atom) === ATOM_KEYS,
      `${where} (${atom?.id ?? '?'}): keys must be exactly ${ATOM_KEYS}, got ${sortedKeys(atom ?? {})}`);

    assert(typeof atom.id === 'string' && /^k\d{4}$/.test(atom.id), `${where}: id must match /^k\\d{4}$/, got ${JSON.stringify(atom.id)}`);
    assert(!seenIds.has(atom.id), `${where}: duplicate id ${atom.id}`);
    seenIds.add(atom.id);

    assert(isNonEmptyString(atom.title), `${where} (${atom.id}): title must be a non-empty string`);
    assert(isNonEmptyString(atom.statement), `${where} (${atom.id}): statement must be a non-empty string`);
    assert(KINDS.includes(atom.kind), `${where} (${atom.id}): kind "${atom.kind}" not in [${KINDS.join(', ')}]`);

    // sources: min 1, each { file, blockId, section }, blockId = `${file}#bNNN`
    assert(Array.isArray(atom.sources) && atom.sources.length >= 1, `${where} (${atom.id}): sources must be an array with min 1 item`);
    atom.sources.forEach((src, j) => {
      const sWhere = `${where} (${atom.id}) sources[${j}]`;
      assert(src && typeof src === 'object' && !Array.isArray(src), `${sWhere}: must be an object`);
      assert(sortedKeys(src) === SOURCE_KEYS, `${sWhere}: keys must be exactly ${SOURCE_KEYS}, got ${sortedKeys(src ?? {})}`);
      assert(isNonEmptyString(src.file), `${sWhere}: file must be a non-empty string`);
      assert(isNonEmptyString(src.section), `${sWhere}: section must be a non-empty string`);
      assert(
        typeof src.blockId === 'string' && src.blockId.startsWith(`${src.file}#b`) && /^b\d{3,}$/.test(src.blockId.slice(src.file.length + 1)),
        `${sWhere}: blockId must be "${src.file}#bNNN", got ${JSON.stringify(src.blockId)}`,
      );
    });

    // origins: min 1, each { proposal, clientId, decidedAt, decision? }
    assert(Array.isArray(atom.origins) && atom.origins.length >= 1, `${where} (${atom.id}): origins must be an array with min 1 item`);
    atom.origins.forEach((origin, j) => {
      const oWhere = `${where} (${atom.id}) origins[${j}]`;
      assert(origin && typeof origin === 'object' && !Array.isArray(origin), `${oWhere}: must be an object`);
      const keys = Object.keys(origin);
      assert(ORIGIN_REQUIRED.every((k) => keys.includes(k)), `${oWhere}: missing required key(s) among ${ORIGIN_REQUIRED.join(', ')}`);
      assert(keys.every((k) => ORIGIN_ALLOWED.includes(k)), `${oWhere}: unexpected key(s) in [${keys.join(', ')}]`);
      assert(isNonEmptyString(origin.proposal), `${oWhere}: proposal must be a non-empty string`);
      assert(isNonEmptyString(origin.clientId), `${oWhere}: clientId must be a non-empty string`);
      assert(typeof origin.decidedAt === 'string' && ISO_RE.test(origin.decidedAt) && !Number.isNaN(Date.parse(origin.decidedAt)),
        `${oWhere}: decidedAt must be a valid ISO-8601 UTC timestamp, got ${JSON.stringify(origin.decidedAt)}`);
      assert(Date.parse(origin.decidedAt) <= FIXED_NOW_MS, `${oWhere}: decidedAt ${origin.decidedAt} is in the future`);
      if ('decision' in origin) {
        assert(DECISIONS.has(origin.decision), `${oWhere}: decision must be 'accepted' or 'known', got ${JSON.stringify(origin.decision)}`);
      }
    });
  });

  // _meta header (optional, generator-specific)
  if (db._meta !== undefined) {
    const mWhere = `${label}: _meta`;
    assert(db._meta && typeof db._meta === 'object' && !Array.isArray(db._meta), `${mWhere}: must be an object`);
    assert(db._meta.purpose === 'testing-only', `${mWhere}: purpose must be 'testing-only'`);
    assert(db._meta.count === db.atoms.length, `${mWhere}: count (${db._meta.count}) != atoms.length (${db.atoms.length})`);
    assert(typeof db._meta.generatedAt === 'string' && ISO_RE.test(db._meta.generatedAt), `${mWhere}: generatedAt must be an ISO timestamp`);
  }

  return db;
}

// ----------------------------------------------------------------------------
// Summary + main
// ----------------------------------------------------------------------------

function printSummary(db, startNumber) {
  const dist = {};
  for (const kind of KINDS) dist[kind] = 0;
  for (const a of db.atoms) dist[a.kind]++;

  const dates = db.atoms.flatMap((a) => a.origins.map((o) => o.decidedAt)).sort();
  const known = db.atoms.filter((a) => a.origins.some((o) => o.decision === 'known')).length;
  const ids = db.atoms.map((a) => a.id);

  console.log('──────────────────────────────────────────────────');
  console.log(`✅ Validation passed — ${db.atoms.length} atoms conform to schema v1`);
  console.log(`   output file : ${OUT_PATH} (re-read + JSON.parse OK)`);
  console.log(`   id range    : ${ids[0]} .. ${ids[ids.length - 1]} (continues after real max k${pad4(startNumber - 1)})`);
  console.log(`   kinds       : ${KINDS.map((k) => `${k}=${dist[k]}`).join(', ')}`);
  console.log(`   known       : ${known}/${db.atoms.length} (${Math.round((known / db.atoms.length) * 100)}%)`);
  console.log(`   decidedAt   : ${dates[0]} .. ${dates[dates.length - 1]}`);
  console.log(`   determinism : seed=${SEED}, generatedAt pinned to ${db._meta.generatedAt}`);
  console.log('──────────────────────────────────────────────────');
}

function main() {
  const rng = makeRng();

  // 1) READ-ONLY look at the real KB to continue the id sequence.
  let startNumber = 1;
  if (existsSync(REAL_KB_PATH)) {
    const real = JSON.parse(readFileSync(REAL_KB_PATH, 'utf8'));
    startNumber = maxExistingAtomId(real) + 1;
  } else {
    console.warn(`⚠️  Real knowledge base not found at ${REAL_KB_PATH}; starting ids at k0001.`);
  }

  // 2) Generate + validate in memory.
  const atoms = buildAtoms(rng, startNumber);
  const doc = {
    _meta: {
      generatedAt: new Date(FIXED_NOW_MS).toISOString(), // pinned for byte-identical runs
      count: atoms.length,
      purpose: 'testing-only',
    },
    schemaVersion: 1,
    atoms,
  };
  validateKnowledgeBase(doc, { label: 'in-memory' });

  // 3) Write to .learn/fake/ (never the real KB).
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(doc, null, 2) + '\n', 'utf8');

  // 4) Prove the file on disk is valid JSON and schema-conformant.
  const reRead = JSON.parse(readFileSync(OUT_PATH, 'utf8'));
  validateKnowledgeBase(reRead, { label: 'on-disk' });

  printSummary(reRead, startNumber);
}

main();
