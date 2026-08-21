import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

/** جذر حزمة الأداة (app/) — يُستعمل لاستبعاد شفرة الأداة نفسها من فهرسة الـ vault. */
export const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** ملف قواعد الـ prompt المستقل. */
export const systemPromptPath = path.join(packageRoot, 'prompts', 'extract-system.md');

export function loadSystemPrompt(): string {
  return fs.readFileSync(systemPromptPath, 'utf8');
}

/**
 * جذر الـ vault: أقرب مجلد أبٍ لملف الخارطة يحتوي .obsidian، وإلا مجلد العمل الحالي.
 */
export function detectVaultRoot(startDir: string): string {
  let dir = path.resolve(startDir);
  for (;;) {
    if (fs.existsSync(path.join(dir, '.obsidian'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return process.cwd();
    dir = parent;
  }
}
