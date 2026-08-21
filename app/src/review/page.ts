import type { ExtractResult } from '../schema/proposal.js';
import path from 'node:path';

/**
 * صفحة مراجعة HTML مكتفية بذاتها (بلا خادم ولا تبعيات) تُكتب بجانب ملف الناتج.
 *
 * مبدأ التصميم: «العبارة هي البطاقة» —
 * - الـ statement نص كبير هو محور البطاقة؛ لا عنوان مكرر فوقه ولا بيانات وصفية تصرف النظر.
 * - الأدلة الحرفية والمعرفات والعلاقات (requires/related) مطوية خلف «الدليل والمصدر» ولا تُفتح إلا عند التحقق.
 * - حجم الخط قابل للضبط (−/+) ويُحفظ محليًا.
 * - شريط تقدم وتصفية (بانتظار/معتمدة/مستبعدة + نوع + بحث) وتصدير القرارات.
 * - اختصارات: ↑/↓ تنقل، A اعتماد، R استبعاد، U تراجع، / بحث.
 * - القرارات تُحفظ محليًا في المتصفح (localStorage) حتى تُبنى مرحلة الاعتماد الدائمة.
 */

const KINDS: Record<string, { label: string; color: string; icon: string }> = {
  concept: {
    label: 'مفهوم',
    color: '#8B93FF',
    icon: 'M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4',
  },
  distinction: {
    label: 'تمييز',
    color: '#4CC9F0',
    icon: 'M8 6h.01M8 6l-4 6a3.5 3.5 0 0 0 6 2M16 18h.01M16 18l4-6a3.5 3.5 0 0 0-6-2',
  },
  decision_rule: {
    label: 'قاعدة قرار',
    color: '#C792EA',
    icon: 'M4 5h6M4 12h6M4 19h6M14 5l6 7-6 7',
  },
  tool_skill: {
    label: 'مهارة أداة',
    color: '#F0B45C',
    icon: 'M14.5 5.5a3.5 3.5 0 0 0 4.9 4.9L21 8.8a2.5 2.5 0 0 1-3.5 3.5L8 21l-3-1-1-3 8.7-9.5A2.5 2.5 0 0 1 16.2 5z',
  },
  causal_relation: {
    label: 'علاقة سببية',
    color: '#5CD6B5',
    icon: 'M3 12h13m0 0-4-4m4 4-4 4M21 5v14',
  },
  fact: {
    label: 'حقيقة',
    color: '#69A9FC',
    icon: 'M12 4v16M4 8l8-4 8 4-8 4-8-4zm0 8 8 4 8-4',
  },
  constraint: {
    label: 'قيد',
    color: '#F27E9D',
    icon: 'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v9H5z',
  },
};

const REASONS: Record<string, { label: string; color: string }> = {
  administrative: { label: 'إداري', color: '#8B93FF' },
  course_meta: { label: 'ترتيب الكورس', color: '#69A9FC' },
  media_only: { label: 'وسائط فقط', color: '#4CC9F0' },
};

export interface ReviewPageOptions {
  /**
   * وضع الخادم: كل قرار يُرسل فورًا إلى POST /decisions ويُكتب على القرص.
   * في هذا الوضع يُخفى زر التصدير (لا حاجة له) ويظهر مؤشر حالة الحفظ.
   */
  serverMode?: boolean;
}

export function buildReviewHtml(
  result: ExtractResult,
  proposalPath?: string,
  options: ReviewPageOptions = {},
): string {
  const safeJson = (value: unknown): string =>
    JSON.stringify(value, null, 0).replace(/</g, '\\u003c');

  const covered = result.coverage.filter((c) => c.status === 'covered').length;
  const excluded = result.coverage.length - covered;
  const blocksMeta = Object.fromEntries(
    result.blocks.map((b) => [
      b.id,
      { file: b.file, section: b.section, lines: `${b.startLine}-${b.endLine}` },
    ]),
  );

  const relProposal = proposalPath ? path.basename(proposalPath) : 'frontend-1-ch1-2.json';
  const serverMode = options.serverMode === true;

  const icons = Object.fromEntries(
    Object.entries(KINDS).map(([k, v]) => [k, { label: v.label, color: v.color, icon: v.icon }]),
  );

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>مراجعة الذرات — فصول ${result.roadmap.chapters.join('، ')}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap">
<style>
  :root {
    font-size: 19px; /* قابل للضبط من الأزرار − / + */
    --bg: #0a0c10;
    --bg-glow: rgba(240, 180, 92, 0.05);
    --surface: #10131a;
    --surface-2: #151924;
    --surface-3: #1a1f2c;
    --border: #222836;
    --border-strong: #2d3446;
    --text: #e9ecf2;
    --text-2: #a7afc2;
    --text-3: #6d7689;
    --accent: #f0b45c;
    --accent-soft: rgba(240, 180, 92, 0.12);
    --ok: #4ade9c;
    --ok-soft: rgba(74, 222, 156, 0.12);
    --no: #f2708f;
    --no-soft: rgba(242, 112, 143, 0.1);
    --radius: 16px;
    --font-ar: 'IBM Plex Sans Arabic', -apple-system, 'SF Arabic', 'Segoe UI', Tahoma, sans-serif;
    --font-mono: 'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace;
  }
  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body {
    margin: 0;
    background: radial-gradient(1200px 500px at 50% -10%, var(--bg-glow), transparent), var(--bg);
    color: var(--text);
    font-family: var(--font-ar);
    font-size: 1rem;
    line-height: 1.85;
    -webkit-font-smoothing: antialiased;
  }
  ::selection { background: var(--accent-soft); color: var(--text); }

  /* ── الهيدر ─────────────────────────────── */
  .header {
    position: sticky;
    top: 0;
    z-index: 50;
    backdrop-filter: blur(14px);
    background: rgba(10, 12, 16, 0.82);
    border-bottom: 1px solid var(--border);
  }
  .header-inner {
    max-width: 960px;
    margin: 0 auto;
    padding: 18px 24px 14px;
  }
  .head-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
  .kicker {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 0.68rem; font-weight: 600; letter-spacing: 0.4px;
    color: var(--accent);
    background: var(--accent-soft);
    border: 1px solid rgba(240, 180, 92, 0.25);
    border-radius: 999px;
    padding: 3px 12px;
    margin-bottom: 10px;
  }
  h1 { margin: 0; font-size: 1.3rem; font-weight: 700; letter-spacing: -0.2px; }
  .meta { color: var(--text-3); font-size: 0.75rem; margin-top: 4px; direction: ltr; text-align: right; unicode-bidi: plaintext; }
  .meta b { color: var(--text-2); font-weight: 500; }

  .progress-box { min-width: 240px; flex: 0 0 auto; }
  .progress-num { font-size: 0.72rem; color: var(--text-2); display: flex; justify-content: space-between; margin-bottom: 6px; }
  .progress-num .nums { display: flex; gap: 10px; font-variant-numeric: tabular-nums; }
  .progress-num .ok { color: var(--ok); }
  .progress-num .no { color: var(--no); }
  .progress {
    height: 6px; border-radius: 999px; background: var(--surface-3);
    overflow: hidden; display: flex; direction: rtl;
  }
  .progress .fill-ok { background: var(--ok); transition: width 0.4s cubic-bezier(0.22, 1, 0.36, 1); }
  .progress .fill-no { background: var(--no); transition: width 0.4s cubic-bezier(0.22, 1, 0.36, 1); }

  .controls { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 16px; }
  .search {
    flex: 1 1 220px; display: flex; align-items: center; gap: 8px;
    background: var(--surface-2); border: 1px solid var(--border);
    border-radius: 10px; padding: 7px 12px; transition: border-color 0.15s;
  }
  .search:focus-within { border-color: var(--border-strong); }
  .search svg { flex: 0 0 auto; opacity: 0.5; }
  .search input {
    flex: 1; background: none; border: none; outline: none;
    color: var(--text); font-family: inherit; font-size: 0.8rem;
  }
  .search input::placeholder { color: var(--text-3); }
  .seg {
    display: flex; background: var(--surface-2); border: 1px solid var(--border);
    border-radius: 10px; padding: 3px; gap: 2px;
  }
  .seg button {
    border: none; background: none; color: var(--text-3); cursor: pointer;
    font-family: inherit; font-size: 0.75rem; font-weight: 500;
    padding: 5px 14px; border-radius: 7px; transition: all 0.15s;
  }
  .seg button:hover { color: var(--text-2); }
  .seg button.active { background: var(--surface-3); color: var(--text); box-shadow: inset 0 0 0 1px var(--border-strong); }
  select {
    background: var(--surface-2); border: 1px solid var(--border); color: var(--text-2);
    border-radius: 10px; padding: 7px 10px; font-family: inherit; font-size: 0.75rem;
    outline: none; cursor: pointer;
  }
  .btn {
    display: inline-flex; align-items: center; gap: 7px;
    border: 1px solid var(--border); background: var(--surface-2); color: var(--text-2);
    border-radius: 10px; padding: 7px 14px; font-family: inherit; font-size: 0.75rem;
    font-weight: 500; cursor: pointer; transition: all 0.15s;
  }
  .btn:hover { color: var(--text); border-color: var(--border-strong); background: var(--surface-3); }
  .btn.icon { padding: 7px 11px; font-size: 0.9rem; line-height: 1; }

  /* مؤشر الحفظ التلقائي في وضع الخادم */
  .save-state {
    display: inline-flex; align-items: center; gap: 7px;
    font-size: 0.72rem; font-weight: 600; white-space: nowrap;
    color: var(--ok); background: var(--ok-soft);
    border: 1px solid rgba(74, 222, 156, 0.3);
    border-radius: 999px; padding: 6px 14px;
    transition: all 0.2s;
  }
  .save-state.saving { color: var(--accent); background: var(--accent-soft); border-color: rgba(240, 180, 92, 0.3); }
  .save-state.error { color: var(--no); background: var(--no-soft); border-color: rgba(242, 112, 143, 0.35); }

  /* ── البطاقات ─────────────────────────────── */
  main { max-width: 960px; margin: 0 auto; padding: 28px 24px 60px; }
  .card {
    position: relative;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 22px 26px 18px;
    margin-bottom: 16px;
    transition: border-color 0.2s, transform 0.2s, opacity 0.25s, background 0.2s;
    outline: none;
  }
  .card:hover { border-color: var(--border-strong); }
  .card.selected { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent-soft), 0 8px 40px -18px rgba(240, 180, 92, 0.35); }
  .card.accepted { border-inline-start: 3px solid var(--ok); }
  .card.known { border-inline-start: 3px solid #c9a227; }
  .card.rejected { opacity: 0.55; border-inline-start: 3px solid var(--no); }

  .card-top { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
  .kind-badge {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 0.7rem; font-weight: 600; padding: 3px 11px;
    border-radius: 999px; border: 1px solid;
    white-space: nowrap;
  }
  .kind-badge svg { width: 12px; height: 12px; }
  .dup-badge {
    display: none; align-items: center; gap: 5px;
    font-size: 0.68rem; font-weight: 600; padding: 3px 10px;
    border-radius: 999px; border: 1px solid rgba(242, 126, 157, 0.35);
    color: #f27e9d; background: rgba(242, 126, 157, 0.08);
    white-space: nowrap;
  }
  .card.is-dup .dup-badge { display: inline-flex; }
  .card-num {
    font-family: var(--font-mono); font-size: 0.68rem; color: var(--text-3);
    margin-inline-start: auto; letter-spacing: 0.5px;
  }

  /* العبارة هي محور البطاقة */
  .stmt {
    font-size: 1.25rem; font-weight: 600; line-height: 1.8;
    color: var(--text); margin: 0 0 6px;
  }
  .card.rejected .stmt { color: var(--text-2); }

  /* ── الدليل: مطوي افتراضيًا ───────────────── */
  details.src { margin-top: 8px; }
  details.src > summary {
    cursor: pointer; user-select: none;
    display: inline-flex; align-items: center; gap: 7px;
    color: var(--text-3); font-size: 0.78rem; font-weight: 500;
    list-style: none;
  }
  details.src > summary::-webkit-details-marker { display: none; }
  details.src > summary::before {
    content: '◂'; font-size: 0.7rem; transition: transform 0.15s;
  }
  details.src[open] > summary::before { transform: rotate(-90deg); }
  details.src > summary:hover { color: var(--text-2); }
  .src-body { margin-top: 10px; border-inline-start: 2px solid var(--border-strong); padding-inline-start: 14px; }

  .ev {
    direction: ltr; text-align: left;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 12px 14px;
    margin: 8px 0;
  }
  .ev-src {
    font-family: var(--font-mono); font-size: 0.68rem; color: var(--text-3);
    margin-bottom: 8px; unicode-bidi: plaintext;
  }
  .ev-src .sep { margin: 0 7px; color: var(--border-strong); }
  .ev-src .file { color: var(--accent); }
  .ev-text {
    font-family: var(--font-mono); font-size: 0.8rem; line-height: 1.85;
    color: #cdd6e4; white-space: pre-wrap; word-break: break-word;
  }
  .ev-text::before { content: '“'; color: var(--text-3); }
  .ev-text::after { content: '”'; color: var(--text-3); }

  .rel-line {
    margin-top: 8px; font-size: 0.72rem; color: var(--text-3);
    font-family: var(--font-mono); direction: ltr; text-align: right; unicode-bidi: plaintext;
  }
  .rel-line b { color: var(--text-2); font-weight: 500; }

  .card-actions { display: flex; align-items: center; gap: 8px; margin-top: 16px; flex-wrap: wrap; }
  .act {
    display: inline-flex; align-items: center; gap: 7px;
    font-family: inherit; font-size: 0.8rem; font-weight: 600;
    padding: 8px 20px; border-radius: 10px; cursor: pointer;
    border: 1px solid var(--border-strong); background: var(--surface-2); color: var(--text-2);
    transition: all 0.16s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .act svg { width: 14px; height: 14px; }
  .act-ok:hover { background: var(--ok-soft); border-color: var(--ok); color: var(--ok); }
  .act-no:hover { background: var(--no-soft); border-color: var(--no); color: var(--no); }
  .card.accepted .act-ok, .card.accepted .act-ok:hover { background: var(--ok); border-color: var(--ok); color: #07130d; }
  .act-known:hover { background: rgba(201, 162, 39, 0.12); border-color: #c9a227; color: #e3c04a; }
  .card.known .act-known, .card.known .act-known:hover { background: #c9a227; border-color: #c9a227; color: #171203; }
  .card.rejected .act-no, .card.rejected .act-no:hover { background: var(--no); border-color: var(--no); color: #1c0a10; }
  .act-undo { border: none; background: none; padding: 7px 10px; }
  .act-undo:hover { color: var(--text); }
  .badge {
    margin-inline-start: auto; font-size: 0.72rem; font-weight: 700;
    display: none; align-items: center; gap: 5px;
  }
  .card.accepted .badge.ok { display: inline-flex; color: var(--ok); }
  .card.known .badge.known { display: inline-flex; color: #e3c04a; }
  .card.rejected .badge.no { display: inline-flex; color: var(--no); }
  .note {
    width: 100%; display: none; margin-top: 10px;
    background: var(--surface-2); border: 1px dashed var(--border-strong);
    border-radius: 10px; padding: 8px 12px; color: var(--text);
    font-family: inherit; font-size: 0.78rem; outline: none; resize: vertical;
  }
  .card.decided .note { display: block; }

  .no-results {
    text-align: center; color: var(--text-3); padding: 80px 0;
    font-size: 0.85rem; display: none;
  }
  .no-results b { display: block; font-size: 40px; margin-bottom: 8px; font-weight: 400; }

  /* ── التغطية ─────────────────────────────── */
  .coverage {
    max-width: 960px; margin: 40px auto 0; padding: 0 24px 70px;
  }
  .coverage-box {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 20px 24px;
  }
  .coverage-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
  .coverage-head h2 { margin: 0; font-size: 0.9rem; font-weight: 700; }
  .coverage-head .sub { color: var(--text-3); font-size: 0.75rem; }
  .cov-bar { display: flex; height: 8px; border-radius: 999px; overflow: hidden; background: var(--surface-3); margin: 14px 0 8px; direction: rtl; }
  .cov-bar .c1 { background: linear-gradient(90deg, #4ade9c, #38b982); }
  .cov-bar .c2 { background: linear-gradient(90deg, #3a4155, #2d3446); }
  .cov-legend { display: flex; gap: 16px; font-size: 0.72rem; color: var(--text-2); flex-wrap: wrap; }
  .dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-inline-end: 5px; }
  details.excluded-list { margin-top: 14px; }
  details.excluded-list summary {
    cursor: pointer; color: var(--text-3); font-size: 0.8rem;
    list-style: none; display: flex; align-items: center; gap: 6px;
  }
  details.excluded-list summary::-webkit-details-marker { display: none; }
  details.excluded-list summary::after { content: '▾'; transition: transform 0.2s; }
  details.excluded-list[open] summary::after { transform: rotate(180deg); }
  .exc-item {
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
    padding: 7px 0; border-top: 1px solid var(--border);
    font-size: 0.72rem; color: var(--text-2);
  }
  .exc-item:first-of-type { border-top: none; }
  .exc-id { font-family: var(--font-mono); font-size: 0.68rem; color: var(--text-3); direction: ltr; }
  .exc-reason {
    font-size: 0.7rem; font-weight: 600; padding: 1px 10px;
    border-radius: 999px; border: 1px solid;
  }
  .exc-note { color: var(--text-3); }

  /* ── الخطوة التالية ─────────────────── */
  .next-steps { max-width: 960px; margin: 0 auto; padding: 0 24px 90px; }
  .next-box {
    background: var(--surface); border: 1px dashed var(--border-strong);
    border-radius: var(--radius); padding: 18px 24px;
    color: var(--text-2); font-size: 0.78rem; line-height: 2;
  }
  .next-box h2 { margin: 0 0 8px; font-size: 0.85rem; color: var(--text); }
  .next-box ol { margin: 0; padding-inline-start: 20px; }
  .next-box code {
    font-family: var(--font-mono); font-size: 0.72rem; direction: ltr; unicode-bidi: plaintext;
    background: var(--surface-2); border: 1px solid var(--border);
    border-radius: 6px; padding: 1px 7px; word-break: break-all;
  }
  .next-box b { color: var(--text); }

  footer.shortcuts {
    position: fixed; bottom: 0; inset-inline: 0;
    background: rgba(10, 12, 16, 0.9); backdrop-filter: blur(10px);
    border-top: 1px solid var(--border);
    font-size: 0.7rem; color: var(--text-3);
    text-align: center; padding: 7px 16px;
  }
  footer.shortcuts kbd {
    font-family: var(--font-mono); font-size: 0.65rem;
    background: var(--surface-3); border: 1px solid var(--border-strong);
    border-bottom-width: 2px; border-radius: 5px;
    padding: 1px 6px; margin: 0 2px; color: var(--text-2);
  }

  @media (max-width: 640px) {
    .header-inner, main, .coverage { padding-inline: 16px; }
    .card { padding: 18px 16px 14px; }
    .head-top { flex-direction: column; }
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { transition: none !important; animation: none !important; }
    html { scroll-behavior: auto; }
  }
</style>
</head>
<body>

<header class="header">
  <div class="header-inner">
    <div class="head-top">
      <div>
        <span class="kicker">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M19.1 4.9l-2.8 2.8M7.7 16.3l-2.8 2.8"/></svg>
          استوديو المراجعة
        </span>
        <h1>مراجعة الذرات المقترحة</h1>
        <div class="meta">
          ${escapeHtml(result.roadmap.path)} · الفصول ${result.roadmap.chapters.map((c) => escapeHtml(String(c))).join('، ')} · <b>${escapeHtml(result.model)}</b> · ${escapeHtml(new Date(result.generatedAt).toLocaleDateString('ar'))} · ${result.atoms.length} ذرة من ${result.coreLessons.length} دروس · ${result.exercises.length} تمرينًا مستبعدًا
        </div>
      </div>
      <div class="progress-box">
        <div class="progress-num">
          <span>مراجعتك</span>
          <span class="nums"><span class="ok" id="okCount">✔ 0</span><span class="kn" id="knownCount" style="color:#e3c04a">★ 0</span><span class="no" id="noCount">✖ 0</span></span>
        </div>
        <div class="progress"><div class="fill-ok" id="fillOk" style="width:0%"></div><div class="fill-known" id="fillKnown" style="width:0%;background:linear-gradient(90deg,#c9a227,#a8862d)"></div><div class="fill-no" id="fillNo" style="width:0%"></div></div>
      </div>
    </div>
    <div class="controls">
      <label class="search">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
        <input id="q" type="search" placeholder="ابحث في العبارات والأدلة… ( / )">
      </label>
      <div class="seg" id="statusSeg">
        <button data-f="all" class="active">الكل</button>
        <button data-f="pending">بانتظار</button>
        <button data-f="accepted">معتمدة</button>
        <button data-f="known">أعرفها</button>
        <button data-f="rejected">مستبعدة</button>
      </div>
      <select id="kindSel"><option value="">كل الأنواع</option></select>
      <button class="btn icon" id="fsDown" title="خط أصغر">أ−</button>
      <button class="btn icon" id="fsUp" title="خط أكبر">أ+</button>
      ${
        serverMode
          ? `<span class="save-state" id="saveState" title="كل قرار يُحفظ فورًا في ملفات المشروع">● محفوظ تلقائيًا</span>`
          : `<button class="btn" id="exportBtn" title="تنزيل قراراتك كملف JSON">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0-4-4m4 4 4-4M4 17v3h16v-3"/></svg>
        تصدير القرارات
      </button>`
      }
    </div>
  </div>
</header>

<main id="cards"></main>
<div class="no-results" id="noResults"><b>◌</b>لا نتائج مطابقة</div>

<section class="coverage">
  <div class="coverage-box">
    <div class="coverage-head">
      <h2>تغطية المصدر</h2>
      <span class="sub">كل فقرة/بند/كتلة شفرة في الدروس مراجَعة — لا شيء يسقط بصمت</span>
    </div>
    <div class="cov-bar"><div class="c1" style="width: ${(covered / Math.max(result.coverage.length, 1)) * 100}%"></div><div class="c2" style="width: ${(excluded / Math.max(result.coverage.length, 1)) * 100}%"></div></div>
    <div class="cov-legend">
      <span><span class="dot" style="background:var(--ok)"></span>مغطى بذرات: ${covered}</span>
      <span><span class="dot" style="background:#3a4155"></span>مستبعد: ${excluded}</span>
      <span style="color:var(--text-3)">إجمالي البلوكات: ${result.coverage.length}</span>
    </div>
    <details class="excluded-list">
      <summary>البلوكات المستبعدة وأسبابها (${excluded})</summary>
      <div id="excList"></div>
    </details>
  </div>
</section>

<footer class="shortcuts">
  تنقّل <kbd>↑</kbd><kbd>↓</kbd> · اعتماد <kbd>A</kbd> · أعرفها <kbd>W</kbd> · استبعاد <kbd>R</kbd> · تراجع <kbd>U</kbd> · بحث <kbd>/</kbd> · خط <kbd>−</kbd><kbd>+</kbd>
</footer>

<section class="next-steps">
  <div class="next-box">
    ${
      serverMode
        ? `<h2>قراراتك تُحفظ فورًا</h2>
    <ol>
      <li>كل ضغطة «اعتمد/استبعد» كُتبت مباشرة في ملف القرارات داخل المشروع — لا تنزيل ولا خطوة إضافية.</li>
      <li>راجع في جلسات متعددة كما تشاء: أغلق الصفحة وعُد، وقراراتك باقية (الخادم يقرأها من الملف).</li>
      <li>عند الانتهاء قل للوكيل «أنهيت المراجعة» — وسينفّذ <code>learn commit</code> لتحويل المعتمد إلى قاعدة المعرفة الدائمة.</li>
    </ol>`
        : `<h2>بعد الانتهاء من القرارات</h2>
    <ol>
      <li>اضغط <b>«تصدير القرارات»</b> بالأعلى — ينزّل ملف <code>review-decisions.json</code>.</li>
      <li>نفّذ من مجلد <code>app</code>:<br><code>pnpm learn commit --proposal ../.learn/proposals/${escapeHtml(relProposal)} --decisions &lt;مسار الملف المنزّل&gt;/review-decisions.json</code></li>
      <li>المعتمد يُحفظ في <code>.learn/knowledge-base.json</code>، وأي استخراج قادم سيرى ذراتك المعتمدة فلن يكررها.</li>
    </ol>`
    }
  </div>
</section>

<script>
const DATA = {
  atoms: ${safeJson(result.atoms)},
  coverage: ${safeJson(result.coverage)},
  kinds: ${safeJson(icons)},
  reasons: ${safeJson(REASONS)},
  blocks: ${safeJson(blocksMeta)},
};
const KEY = 'learn-review:' + location.pathname;
const FS_KEY = 'learn-review-fs';

/* تخزين آمن: بعض المتصفحات (Safari مع file://) تمنع localStorage وتقتل السكربت —
   نتراجع إلى ذاكرة الجلسة كي تعمل الصفحة دائمًا (القرارات تبقى خلال التصفح فقط). */
const storage = (() => {
  try {
    const probe = '__probe__';
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    const mem = new Map();
    return {
      getItem: (k) => (mem.has(k) ? mem.get(k) : null),
      setItem: (k, v) => mem.set(k, String(v)),
      removeItem: (k) => mem.delete(k),
    };
  }
})();

/* فخ أخطاء مرئي: إن انكسر شيء يظهر شريط صغير بدل موت الصفحة بصمت */
window.addEventListener('error', (e) => {
  const bar = document.createElement('div');
  bar.style.cssText =
    'position:fixed;top:0;inset-inline:0;z-index:999;background:#f2708f;color:#14060a;padding:9px 16px;font-size:13.5px;text-align:center;direction:rtl';
  bar.textContent = 'حدث خطأ في الصفحة: ' + (e.message || 'غير معروف') + ' — أبلغ الوكيل بهذه الرسالة';
  (document.body || document.documentElement).appendChild(bar);
});

const saved = JSON.parse(storage.getItem(KEY) || '{}');

/* حجم الخط: قابل للضبط ويُحفظ مستقلًا عن القرارات */
const clampFs = (n) => Math.min(26, Math.max(15, n));
let fs = clampFs(parseInt(storage.getItem(FS_KEY) || '19', 10) || 19);
const applyFs = () => {
  document.documentElement.style.fontSize = fs + 'px';
  try { storage.setItem(FS_KEY, String(fs)); } catch {}
};
document.getElementById('fsDown').addEventListener('click', () => { fs = clampFs(fs - 1); applyFs(); });
document.getElementById('fsUp').addEventListener('click', () => { fs = clampFs(fs + 1); applyFs(); });
applyFs();

/* مراجع عناصر التحكم تُعرّف مبكرًا: applyFilters تُستدعى أثناء بناء البطاقات */
const cardsRoot = document.getElementById('cards');
const excList = document.getElementById('excList');
const qInput = document.getElementById('q');
const kindSel = document.getElementById('kindSel');
let statusFilter = 'all';

const el = (tag, cls, text) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
};
const iconSvg = (d, color, size) =>
  '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="' + d + '"/></svg>';

/* بناء البطاقات: العبارة محور البطاقة، والدليل مطوي خلف زر */
const cardEls = [];
DATA.atoms.forEach((atom, i) => {
  const k = DATA.kinds[atom.kind] || { label: atom.kind, color: '#9AA3B5', icon: '' };

  const card = el('article', 'card');
  card.tabIndex = -1;
  card.dataset.id = atom.clientId;
  card.dataset.kind = atom.kind;
  card.title = atom.title; /* الاسم المميز tooltip فقط، لا سطرًا مكررًا */
  if (atom.duplicateOf) card.classList.add('is-dup');

  const top = el('div', 'card-top');
  const badge = el('span', 'kind-badge');
  badge.style.color = k.color;
  badge.style.borderColor = k.color + '44';
  badge.style.background = k.color + '14';
  badge.innerHTML = iconSvg(k.icon, k.color, 12);
  badge.appendChild(el('span', null, k.label));
  top.appendChild(badge);
  if (atom.duplicateOf) {
    top.appendChild(el('span', 'dup-badge', '⧉ مكررة لـ ' + atom.duplicateOf + ' — مصادرها ستُدمج فيها عند الاعتماد'));
  }
  top.appendChild(el('span', 'card-num', '#' + String(i + 1).padStart(2, '0')));
  card.appendChild(top);

  card.appendChild(el('p', 'stmt', atom.statement));

  const src = document.createElement('details');
  src.className = 'src';
  const summary = el('summary', null, 'الدليل والمصدر (' + atom.sourceRefs.length + ')');
  src.appendChild(summary);
  const srcBody = el('div', 'src-body');

  atom.sourceRefs.forEach((r) => {
    const b = DATA.blocks[r.blockId] || {};
    const box = el('div', 'ev');
    const srcLine = el('div', 'ev-src');
    const file = el('span', 'file', b.file || r.file);
    srcLine.appendChild(file);
    if (b.section) {
      srcLine.appendChild(el('span', 'sep', '·'));
      srcLine.appendChild(el('span', null, b.section));
    }
    if (b.lines) {
      srcLine.appendChild(el('span', 'sep', '·'));
      srcLine.appendChild(el('span', null, 'L' + b.lines));
    }
    box.appendChild(srcLine);
    box.appendChild(el('div', 'ev-text', r.evidence));
    srcBody.appendChild(box);
  });

  if ((atom.prerequisites && atom.prerequisites.length) || (atom.related && atom.related.length)) {
    const parts = [];
    if (atom.prerequisites && atom.prerequisites.length)
      parts.push('يتطلب: <b>' + atom.prerequisites.join('، ') + '</b>');
    if (atom.related && atom.related.length)
      parts.push('مرتبط: <b>' + atom.related.join('، ') + '</b>');
    if (atom.duplicateOf) parts.push('نسخة من: <b>' + atom.duplicateOf + '</b>');
    const rel = el('div', 'rel-line');
    rel.innerHTML = parts.join(' <span style="opacity:.4">|</span> ');
    srcBody.appendChild(rel);
  }

  src.appendChild(srcBody);
  card.appendChild(src);

  const actions = el('div', 'card-actions');
  const btnOk = el('button', 'act act-ok');
  btnOk.innerHTML = iconSvg('M20 6 9 17l-5-5', 'currentColor', 14) + '<span>اعتمد</span>';
  btnOk.addEventListener('click', () => decide(atom.clientId, 'accepted', card));
  const btnKnown = el('button', 'act act-known');
  btnKnown.innerHTML =
    iconSvg('M12 2 15.09 8.26 22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z', 'currentColor', 14) +
    '<span>أعرفها</span>';
  btnKnown.title = 'أعرفها جيدًا — تدخل المراجعة بفاصل أول طويل (شهر تقريبًا)';
  btnKnown.addEventListener('click', () => decide(atom.clientId, 'known', card));
  const btnNo = el('button', 'act act-no');
  btnNo.innerHTML = iconSvg('M18 6 6 18M6 6l12 12', 'currentColor', 14) + '<span>استبعد</span>';
  btnNo.addEventListener('click', () => decide(atom.clientId, 'rejected', card));
  const btnUndo = el('button', 'act act-undo', '↺ تراجع');
  btnUndo.addEventListener('click', () => decide(atom.clientId, '', card));
  const badgeOk = el('span', 'badge ok', 'معتمدة ✓');
  const badgeKnown = el('span', 'badge known', 'أعرفها ★ — مراجعة بعيدة');
  const badgeNo = el('span', 'badge no', 'مستبعدة ✕');
  actions.append(btnOk, btnKnown, btnNo, btnUndo, badgeOk, badgeKnown, badgeNo);
  card.appendChild(actions);

  const note = el('textarea', 'note');
  note.rows = 2;
  note.placeholder = 'ملاحظة أو تعديل مقترح…';
  note.value = saved[atom.clientId]?.note || '';
  let noteTimer = null;
  note.addEventListener('input', () => {
    saved[atom.clientId] = saved[atom.clientId] || {};
    saved[atom.clientId].note = note.value;
    persist();
    if (SERVER_MODE) {
      clearTimeout(noteTimer);
      noteTimer = setTimeout(() => pushDecision(atom.clientId, saved[atom.clientId]), 600);
    }
  });
  card.appendChild(note);

  applyState(card, atom.clientId);
  cardEls.push(card);
  cardsRoot.appendChild(card);
});

/* التغطية */
DATA.coverage.forEach((c) => {
  if (c.status !== 'excluded') return;
  const row = el('div', 'exc-item');
  row.appendChild(el('span', 'exc-id', c.blockId));
  const r = DATA.reasons[c.reason] || { label: c.reason, color: '#9AA3B5' };
  const reasonChip = el('span', 'exc-reason', r.label);
  reasonChip.style.color = r.color;
  reasonChip.style.borderColor = r.color + '44';
  reasonChip.style.background = r.color + '14';
  row.appendChild(reasonChip);
  row.appendChild(el('span', 'exc-note', c.note || ''));
  excList.appendChild(row);
});

/* القرارات */
function persist() { try { storage.setItem(KEY, JSON.stringify(saved)); } catch {} }
function applyState(card, id) {
  const d = saved[id]?.decision || '';
  card.className = 'card' + (d ? ' decided ' + d : '');
  refreshProgress();
  applyFilters();
}

/* وضع الخادم: كل قرار يُرسل فورًا ويُكتب على القرص؛ localStorage نسخة احتياطية فقط.
   خارج الخادم (file://): لا إرسال، والتصدير اليدوي هو الطريق. */
const SERVER_MODE = ${serverMode ? 'true' : 'false'};
let saveStateEl = document.getElementById('saveState');
function setSaveState(state, text) {
  if (!saveStateEl) return;
  saveStateEl.className = 'save-state' + (state ? ' ' + state : '');
  if (text) saveStateEl.textContent = text;
}
async function pushDecision(id, entry) {
  if (!SERVER_MODE) return;
  setSaveState('saving', '… يُحفظ');
  try {
    const res = await fetch('/decisions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: id, decision: entry?.decision ?? null, note: entry?.note ?? null }),
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    setSaveState('', '● محفوظ تلقائيًا');
  } catch (err) {
    setSaveState('error', '✕ تعذر الحفظ — القرار محفوظ محليًا فقط');
    console.error(err);
  }
}
async function decide(id, decision, card) {
  saved[id] = saved[id] || {};
  if (decision) saved[id].decision = decision; else delete saved[id].decision;
  persist();
  applyState(card, id);
  await pushDecision(id, saved[id]);
}
function refreshProgress() {
  const total = DATA.atoms.length;
  let ok = 0, kn = 0, no = 0;
  for (const a of DATA.atoms) {
    const d = saved[a.clientId]?.decision;
    if (d === 'accepted') ok++;
    if (d === 'known') kn++;
    if (d === 'rejected') no++;
  }
  document.getElementById('okCount').textContent = '✔ ' + ok;
  document.getElementById('knownCount').textContent = '★ ' + kn;
  document.getElementById('noCount').textContent = '✖ ' + no;
  document.getElementById('fillOk').style.width = (ok / total * 100) + '%';
  document.getElementById('fillKnown').style.width = (kn / total * 100) + '%';
  document.getElementById('fillNo').style.width = (no / total * 100) + '%';
}

/* التصفية والبحث */
Object.entries(DATA.kinds).forEach(([k, v]) => {
  const opt = document.createElement('option');
  opt.value = k;
  const count = DATA.atoms.filter((a) => a.kind === k).length;
  opt.textContent = v.label + ' (' + count + ')';
  kindSel.appendChild(opt);
});
kindSel.addEventListener('change', applyFilters);
document.getElementById('statusSeg').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  statusFilter = btn.dataset.f;
  document.querySelectorAll('#statusSeg button').forEach((b) => b.classList.toggle('active', b === btn));
  applyFilters();
});
qInput.addEventListener('input', applyFilters);

function applyFilters() {
  const q = qInput.value.trim().toLowerCase();
  const kind = kindSel.value;
  let visible = 0;
  cardEls.forEach((card, i) => {
    const atom = DATA.atoms[i];
    const d = saved[atom.clientId]?.decision || 'pending';
    const matchStatus = statusFilter === 'all' || d === statusFilter;
    const matchKind = !kind || atom.kind === kind;
    const haystack = (atom.title + ' ' + atom.statement + ' ' + atom.sourceRefs.map((r) => r.evidence).join(' ')).toLowerCase();
    const matchQ = !q || haystack.includes(q);
    const show = matchStatus && matchKind && matchQ;
    card.style.display = show ? '' : 'none';
    if (show) visible++;
  });
  document.getElementById('noResults').style.display = visible ? 'none' : 'block';
}

/* التنقل بلوحة المفاتيح */
let current = -1;
function focusCard(i) {
  if (i < 0 || i >= cardEls.length) {
    // الخروج من النطاق يلغي التحديد (↑ على أول بطاقة، ↓ على آخرها)
    cardEls.forEach((c) => c.classList.remove('selected'));
    current = -1;
    return;
  }
  cardEls.forEach((c) => c.classList.remove('selected'));
  current = i;
  const card = cardEls[i];
  card.classList.add('selected');
  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
    if (e.key === 'Escape') e.target.blur();
    return;
  }
  if (e.key === '/') { e.preventDefault(); qInput.focus(); return; }
  if (e.key === 'ArrowDown' || e.key === 'j') { e.preventDefault(); focusCard(current + 1); return; }
  if (e.key === 'ArrowUp' || e.key === 'k') { e.preventDefault(); focusCard(current - 1); return; }
  if (e.key === '+' || e.key === '=') { fs = clampFs(fs + 1); applyFs(); return; }
  if (e.key === '-') { fs = clampFs(fs - 1); applyFs(); return; }
  if (current >= 0 && cardEls[current]) {
    const atom = DATA.atoms[current];
    const card = cardEls[current];
    if (e.key === 'a' || e.key === 'A' || e.key === 'ي') decide(atom.clientId, 'accepted', card);
    if (e.key === 'w' || e.key === 'W' || e.key === 'ص') decide(atom.clientId, 'known', card);
    if (e.key === 'r' || e.key === 'R' || e.key === 'ق') decide(atom.clientId, 'rejected', card);
    if (e.key === 'u' || e.key === 'U' || e.key === 'ث') decide(atom.clientId, '', card);
  }
});

/* التصدير: خارج وضع الخادم فقط — الزر غير موجود داخله */
const exportBtn = document.getElementById('exportBtn');
if (exportBtn) {
  exportBtn.addEventListener('click', () => {
    const decisions = {};
    for (const a of DATA.atoms) {
      const s = saved[a.clientId];
      if (s?.decision || s?.note)
        decisions[a.clientId] = {
          decision: s.decision || null,
          note: s.note || null,
          title: a.title,
          duplicateOf: a.duplicateOf || null,
        };
    }
    const blob = new Blob([JSON.stringify(decisions, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'review-decisions.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });
}

refreshProgress();
applyFilters();
</script>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
