import test from 'node:test';
import assert from 'node:assert/strict';
import { getFormatCatalog, getFormatByKey, resolveFormat } from '../scripts/formatCatalog.mjs';

const EXPECTED_KEYS = ['dubai_a', 'dubai_b', 'genericnvo1', 'germany_a', 'germany_b', 'ireland', 'newzealand', 'singapore_a', 'singapore_b'];

test('exposes the nine formats with stable keys', () => {
  const formats = getFormatCatalog();
  assert.equal(formats.length, 9);
  assert.deepEqual(formats.map((format) => format.key).sort(), [...EXPECTED_KEYS].sort());
});

test('resolves format identifiers by key or display name', () => {
  assert.equal(resolveFormat('germany_a').key, 'germany_a');
  assert.equal(resolveFormat(getFormatByKey('germany_a').name).key, 'germany_a');
  assert.equal(resolveFormat('unknown'), null);
});

test('every format declares a contentShape with a proof and cta shape', () => {
  for (const key of EXPECTED_KEYS) {
    const format = getFormatByKey(key);
    assert.ok(format.contentShape, `${key} is missing contentShape`);
    assert.ok(format.contentShape.proof?.mode, `${key} is missing contentShape.proof.mode`);
    assert.ok(format.contentShape.cta?.style, `${key} is missing contentShape.cta.style`);
    assert.ok(['required', 'optional', 'unsupported'].includes(format.contentShape.productShot), `${key} has an invalid productShot value`);
  }
});

test('content shapes genuinely differ across formats (not just color)', () => {
  const shapes = EXPECTED_KEYS.map((key) => JSON.stringify(getFormatByKey(key).contentShape));
  assert.equal(new Set(shapes).size, shapes.length, 'two formats have an identical contentShape');
});

test('ireland and newzealand require a product shot; no other format does', () => {
  const required = EXPECTED_KEYS.filter((key) => getFormatByKey(key).contentShape.productShot === 'required');
  assert.deepEqual(required.sort(), ['ireland', 'newzealand']);
});
