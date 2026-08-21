#!/usr/bin/env node
/**
 * يولّد site/dashboard.html من البيانات الحقيقية للمشروع:
 * - اقتراح الاستخراج الحالي (.learn/proposals/*.json)
 * - قرارات المراجعة (*.decisions.json)
 * - قاعدة المعرفة إن وُجدت (.learn/knowledge-base.json)
 * - إحصاءات الخزنة (الدروس والخرائط)
 *
 * النمط: نولّد محليًا ونرفع الملف الناتج — السيرفر يقدمه كما هو عبر مزامنة main.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = process.cwd();
const proposalsDir = path.join(root, '.learn', 'proposals');
const outPath = path.join(root, 'site', 'dashboard.html');

const nf = new Intl.NumberFormat('ar-EG');
const arDate = (d) =>
  new Intl.DateTimeFormat('ar-EG', { dateStyle: 'full', timeStyle: 'short' }).format(d);

function readJsonSafe(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

/* 1) الاقتراحات والقرارات */
const proposals = [];
if (fs.existsSync(proposalsDir)) {
  for (const f of fs.readdirSync(proposalsDir)) {
    const m = f.match(/^(.+)\.json$/);
    if (!m || f.endsWith('.rejected.json')) continue;
    const base = m[1];
    if (base.endsWith('.decisions')) continue;
    const proposal = readJsonSafe(path.join(proposalsDir, f));
    if (!proposal?.atoms) continue;
    const decisions = readJsonSafe(path.join(proposalsDir, `${base}.decisions.json`)) ?? {};
    const decList = Object.values(decisions);
    proposals.push({
      name: base,
      atoms: proposal.atoms,
      coverage: proposal.coverage ?? [],
      meta: proposal.meta ?? {},
      decided: decList.length,
      accepted: decList.filter((d) => d.decision === 'accepted').length,
      known: decList.filter((d) => d.decision === 'known').length,
      rejected: decList.filter((d) => d.decision === 'rejected').length,
    });
  }
}

const allAtoms = proposals.flatMap((p) => p.atoms).map((a) =>
  Array.isArray(a) ? { kind: a[3] } : a,
);
const kindLabels = {
  concept: 'مفهوم',
  distinction: 'تمييز',
  decision_rule: 'قاعدة قرار',
  causal_relation: 'علاقة سببية',
  fact: 'حقيقة',
  tool_skill: 'مهارة أداة',
  constraint: 'قيد',
};
const kindCounts = {};
for (const a of allAtoms) kindCounts[a.kind] = (kindCounts[a.kind] ?? 0) + 1;
const kindRows = Object.entries(kindCounts)
  .sort((x, y) => y[1] - x[1])
  .map(
    ([k, v]) =>
      `<tr><td>${kindLabels[k] ?? k}</td><td class="num">${nf.format(v)}</td></tr>`,
  )
  .join('');

/* 2) قاعدة المعرفة */
const kb = readJsonSafe(path.join(root, '.learn', 'knowledge-base.json'));
const kbCount = kb?.atoms?.length ?? null;

/* 3) الخزنة */
const lessonsCount = fs
  .readdirSync(path.join(root, 'lessons'))
  .filter((f) => f.endsWith('.md')).length;
const roadmapsDir = path.join(root, 'roadmaps');
const roadmapsCount = fs
  .readdirSync(roadmapsCount_dir())
  .filter((f) => f.endsWith('.md') && f !== 'roadmaps index.md').length;
function roadmapsCount_dir() {
  return roadmapsDir;
}

/* 4) آخر commit */
let commitInfo = '—';
try {
  const h = execSync('git rev-parse --short HEAD').toString().trim();
  const d = execSync('git log -1 --format=%cd --date=iso').toString().trim();
  commitInfo = `${h} — ${arDate(new Date(d))}`;
} catch {}

/* 5) الصفحة */
const proposalSections = proposals
  .map((p) => {
    const total = p.atoms.length;
    const pct = (n) => (total ? Math.round((n / total) * 100) : 0);
    return `
  <section class="card">
    <h2>${p.name}</h2>
    <p class="sub">أحدث اقتراح استخراج — ${nf.format(total)} ذرة</p>
    <div class="bar"><span style="width:${pct(p.accepted)}%"></span></div>
    <div class="legend">
      <span class="dot ok">معتمدة ${nf.format(p.accepted)}</span>
      <span class="dot star">أعرفها ${nf.format(p.known)}</span>
      <span class="dot no">مستبعدة ${nf.format(p.rejected)}</span>
      <span class="dot">بلا قرار ${nf.format(Math.max(total - p.decided, 0))}</span>
    </div>
  </section>`;
  })
  .join('');

const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Code — لوحة المشروع الحية</title>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:"IBM Plex Sans Arabic",system-ui,sans-serif; background:#0b0e14; color:#e8eaed; min-height:100vh; }
  main { width:min(880px,100%); margin:0 auto; padding:56px 20px 64px; }
  h1 { font-size:clamp(26px,4vw,36px); font-weight:700; }
  h1 span { color:#7aa2f7; }
  .updated { color:#9aa0a6; font-size:13px; margin-top:8px; }
  .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:14px; margin-top:28px; }
  .stat { background:#131720; border:1px solid #1f2633; border-radius:12px; padding:18px; }
  .stat .v { font-size:30px; font-weight:700; color:#7aa2f7; }
  .stat .l { color:#9aa0a6; font-size:13px; margin-top:4px; }
  .card { background:#131720; border:1px solid #1f2633; border-radius:12px; padding:22px; margin-top:16px; }
  .card h2 { font-size:17px; font-weight:600; direction:ltr; text-align:right; }
  .card .sub { color:#9aa0a6; font-size:13px; margin-top:4px; }
  .bar { height:10px; border-radius:999px; background:#1f2633; overflow:hidden; margin-top:14px; display:flex; }
  .bar span { background:#7aa2f7; height:100%; }
  .legend { display:flex; flex-wrap:wrap; gap:10px; margin-top:12px; font-size:12.5px; color:#c9ced6; }
  .dot::before { content:"●"; margin-left:6px; font-size:10px; vertical-align:middle; }
  .dot.ok::before { color:#9ece6a; } .dot.star::before { color:#e0af68; } .dot.no::before { color:#f7768e; } .dot::before { color:#565f89; }
  table { width:100%; border-collapse:collapse; margin-top:10px; font-size:14px; }
  td { padding:8px 4px; border-bottom:1px solid #1f2633; }
  tr:last-child td { border-bottom:none; }
  td.num { text-align:left; font-weight:600; color:#7aa2f7; }
  footer { text-align:center; color:#5f6368; font-size:13px; padding:18px; border-top:1px solid #1f2633; margin-top:40px; }
  footer a { color:#7aa2f7; text-decoration:none; }
</style>
</head>
<body>
<main>
  <h1>لوحة <span>Code</span> الحية</h1>
  <p class="updated">أرقام حقيقية من قلب المشروع — آخر توليد: ${arDate(new Date())} • commit ${commitInfo}</p>

  <div class="grid">
    <div class="stat"><div class="v">${nf.format(allAtoms.length)}</div><div class="l">ذرة مستخرجة</div></div>
    <div class="stat"><div class="v">${nf.format(kbCount ?? 0)}</div><div class="l">في قاعدة المعرفة${kbCount === null ? ' (لم تُنشأ بعد)' : ''}</div></div>
    <div class="stat"><div class="v">${nf.format(lessonsCount)}</div><div class="l">درس منسوخ</div></div>
    <div class="stat"><div class="v">${nf.format(roadmapsCount)}</div><div class="l">خريطة كورس</div></div>
  </div>

  ${proposalSections}

  <section class="card">
    <h2>توزيع الذرات بحسب نوعها</h2>
    <table>${kindRows}</table>
  </section>

  <section class="card">
    <h2>أين نقف الآن؟</h2>
    <table>
      <tr><td>خط الاستخراج والتحقق (CLI)</td><td class="num">✓ يعمل</td></tr>
      <tr><td>المراجعة البشرية بالحفظ اللحظي</td><td class="num">✓ تعمل</td></tr>
      <tr><td>ربط FSRS + أوامر الدراسة والتمارين</td><td class="num">⬗ تحت البناء</td></tr>
      <tr><td>نسخة الموبايل والمزامنة</td><td class="num">⬜ مؤجلة بقرار</td></tr>
    </table>
  </section>
</main>
<footer><a href="/code/">← عودة إلى صفحة Code</a></footer>
</body>
</html>`;

fs.writeFileSync(outPath, html);
console.log(`dashboard generated -> ${path.relative(root, outPath)} (${allAtoms.length} atoms from ${proposals.length} proposals)`);
