import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_LLM_TIMEOUT_MS, loadDotEnv, readLlmConfig } from '../src/config.js';

/** متغيرات البيئة: القيم الافتراضية، والرسائل الواضحة عند النقص أو القيم غير الصالحة. */

describe('readLlmConfig', () => {
  it('يرفض النقص بأسماء المتغيرات المفقودة', () => {
    expect(() => readLlmConfig({})).toThrow(/LLM_API_KEY, LLM_MODEL/);
    expect(() => readLlmConfig({ LLM_API_KEY: 'k' })).toThrow(/LLM_MODEL/);
    expect(() => readLlmConfig({ LLM_MODEL: 'm' })).toThrow(/LLM_API_KEY/);
  });

  it('يعيد القيم الافتراضية عند غياب الاختيارية', () => {
    const config = readLlmConfig({ LLM_API_KEY: 'k', LLM_MODEL: 'm' });
    expect(config).toEqual({
      apiKey: 'k',
      baseUrl: 'https://api.openai.com/v1',
      model: 'm',
      timeoutMs: DEFAULT_LLM_TIMEOUT_MS,
    });
    expect(DEFAULT_LLM_TIMEOUT_MS).toBe(120_000);
  });

  it('يقبل LLM_TIMEOUT_MS صحيحًا موجبًا ويرفض غيره', () => {
    expect(
      readLlmConfig({ LLM_API_KEY: 'k', LLM_MODEL: 'm', LLM_TIMEOUT_MS: '30000' }).timeoutMs,
    ).toBe(30_000);
    for (const bad of ['abc', '0', '-5', '1.5']) {
      expect(() =>
        readLlmConfig({ LLM_API_KEY: 'k', LLM_MODEL: 'm', LLM_TIMEOUT_MS: bad }),
      ).toThrow(/LLM_TIMEOUT_MS/);
    }
  });
});

describe('loadDotEnv', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'learn-env-'));
  const envPath = path.join(tmpDir, '.env');

  afterEach(() => {
    delete process.env.LEARN_TEST_A;
    delete process.env.LEARN_TEST_B;
  });

  it('يقرأ .env دون تجاوز متغيرات البيئة الأصلية', () => {
    process.env.LEARN_TEST_A = 'original';
    fs.writeFileSync(envPath, 'LEARN_TEST_A=from-file\nLEARN_TEST_B=from-file\n', 'utf8');
    loadDotEnv(tmpDir);
    expect(process.env.LEARN_TEST_A).toBe('original');
    expect(process.env.LEARN_TEST_B).toBe('from-file');
  });
});
