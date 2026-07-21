import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getFormatCatalog } from '../scripts/formatCatalog.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

function listFormatDirs() {
  return readdirSync(path.join(repoRoot, 'nvo-template', 'formats')).filter((name) => {
    const fullPath = path.join(repoRoot, 'nvo-template', 'formats', name);
    return existsSync(fullPath) && !name.startsWith('.') && !name.includes('legacy');
  });
}

test('format catalog exposes nine self-contained format packages', () => {
  const formats = getFormatCatalog();
  assert.equal(formats.length, 9);

  const dirs = listFormatDirs();
  assert.deepEqual(dirs.sort(), formats.map((format) => format.key).sort());

  for (const format of formats) {
    const formatDir = path.join(repoRoot, 'nvo-template', 'formats', format.key);
    assert.ok(existsSync(formatDir), `Missing package dir for ${format.key}`);
    assert.ok(existsSync(path.join(formatDir, 'config.json')), `Missing config.json for ${format.key}`);
    assert.ok(existsSync(path.join(formatDir, 'inner.template.html')), `Missing inner template for ${format.key}`);
  }
});
