import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/** ينشئ vault مؤقتًا صغيرًا من خريطة "مسار نسبي -> محتوى". */
export function makeTmpVault(files: Record<string, string>): {
  root: string;
  cleanup: () => void;
} {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'learn-vault-'));
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content, 'utf8');
  }
  return { root, cleanup: () => fs.rmSync(root, { recursive: true, force: true }) };
}
