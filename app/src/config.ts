import path from 'node:path';
import fs from 'node:fs';
import { packageRoot } from './paths.js';

export const DEFAULT_LLM_TIMEOUT_MS = 120_000;

export interface LlmEnvConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  timeoutMs: number;
}

/** يقرأ app/.env إن وُجد (KEY=VALUE بأسطر بسيطة) دون تجاوز قيم البيئة الأصلية. */
export function loadDotEnv(dir: string = packageRoot): void {
  const envPath = path.join(dir, '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
    if (!(key in process.env)) process.env[key] = value;
  }
}

function parseTimeout(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === '') return DEFAULT_LLM_TIMEOUT_MS;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error(`LLM_TIMEOUT_MS يجب أن يكون عددًا صحيحًا موجبًا بالملي ثانية، وصل: "${raw}"`);
  }
  return n;
}

/** يتحقق من متغيرات البيئة المطلوبة ويعيدها، أو يرمي خطأً واضحًا. */
export function readLlmConfig(env: NodeJS.ProcessEnv = process.env): LlmEnvConfig {
  const missing: string[] = [];
  if (!env.LLM_API_KEY) missing.push('LLM_API_KEY');
  if (!env.LLM_MODEL) missing.push('LLM_MODEL');
  if (missing.length > 0) {
    throw new Error(
      `متغيرات بيئة ناقصة: ${missing.join(', ')}. ` +
        `اضبطها أو انسخ app/.env.example إلى app/.env واملأها. ` +
        `(للاختبار بلا شبكة استعمل --resolve-only)`,
    );
  }
  return {
    apiKey: env.LLM_API_KEY!,
    baseUrl: env.LLM_BASE_URL || 'https://api.openai.com/v1',
    model: env.LLM_MODEL!,
    timeoutMs: parseTimeout(env.LLM_TIMEOUT_MS),
  };
}
