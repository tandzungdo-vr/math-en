// Regression tests for docs/math.js — run with: node --test tests/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
require('../docs/math.js');
const M = globalThis.MathText;

const mathParts = (s) => M.segment(s).filter((p) => p.type === 'math').map((p) => p.value);
const speech = (s) => M.analyze(s).speech;
const plain = (s) => M.analyze(s).plain;

test('finds formulas inside Vietnamese sentences', () => {
  assert.deepEqual(mathParts('Giải phương trình x^2 - 5x + 6 = 0.'), ['x^2 - 5x + 6 = 0']);
  assert.deepEqual(mathParts('Cho tam giác ABC vuông tại A, có AB = 3 cm.'), ['ABC', 'A', 'AB = 3']);
  assert.deepEqual(mathParts('Hàm số đồng biến trên khoảng (0; 2) không?'), ['(0; 2)']);
  assert.deepEqual(mathParts('Định lí Vi-ét (với x > 0) trong mặt phẳng Oxy'), ['x > 0', 'Oxy']);
});

test('segments keep every character', () => {
  const s = 'Tính đạo hàm của f(x) = sin(2x) + ln x, với x > 0.';
  assert.equal(M.segment(s).map((p) => p.value).join(''), s);
});

test('rewrites Vietnamese conventions in US style', () => {
  assert.equal(plain('2,5 + 1.000 : 4'), '2.5 + 1,000 ÷ 4');
  assert.equal(plain('(0; 2)'), '(0, 2)');
  assert.equal(plain('x <= 3'), 'x ≤ 3');
  assert.equal(plain('AB // CD'), 'AB ∥ CD');
  assert.equal(M.analyze('(0; 2)', { vn: true }).plain, '(0; 2)');
});

test('reads formulas aloud', () => {
  assert.equal(speech('x^2 - 5x + 6 = 0'), 'X squared minus 5 X plus 6 equals 0');
  assert.equal(speech('y = sqrt(x - 1)'), 'Y equals the square root of the quantity X minus 1');
  assert.equal(speech("f'(x) = 0"), 'F prime of X equals 0');
  assert.equal(speech('sin^2(x) + cos^2(x) = 1'), 'sine squared of X plus cosine squared of X equals 1');
  assert.equal(speech('log_2(x)'), 'log base 2 of X');
  assert.equal(speech('lim_(x->0) sin x / x'), 'the limit as X approaches 0, of sine X over X');
  assert.equal(speech('(x+1)^2'), 'the quantity X plus 1, squared');
  assert.equal(speech('2(x+1)'), '2 times the quantity X plus 1');
  assert.equal(speech('x^(n+1)'), 'X to the power of N plus 1');
  assert.equal(speech('|x - 1| <= 3'), 'the absolute value of X minus 1 is less than or equal to 3');
  assert.equal(speech('A(1; 2)'), 'A at 1, 2');
  assert.equal(speech('[1; +inf)'), 'from 1 to infinity');
  assert.equal(speech('x = -2'), 'X equals negative 2');
  assert.equal(speech('x_1 + x_2 = -b/a'), 'X sub 1 plus X sub 2 equals negative B over A');
});

test('renders superscripts, subscripts and symbols', () => {
  assert.equal(M.analyze('x^2').html, '<span class="math"><i>x</i><sup>2</sup></span>');
  assert.equal(M.analyze('x_1').html, '<span class="math"><i>x</i><sub>1</sub></span>');
  assert.match(M.analyze('sqrt(x) - pi').html, /√\(<i>x<\/i>\) − π/);
});

test('every vocabulary example renders', () => {
  globalThis.window = globalThis;
  require('../docs/vocab.js');
  const seen = new Set();
  for (const topic of globalThis.MATH_VOCAB) {
    assert.ok(['6–9', '10–12'].includes(topic.grades), `${topic.id} grades`);
    for (const [vi, en, ipa, exVi, exEn] of topic.terms) {
      for (const s of vi.split('|')) {
        assert.ok(!seen.has(s), `duplicate Vietnamese spelling: ${s}`);
        seen.add(s);
      }
      assert.ok(en && /^\/.+\/$/.test(ipa), `${vi}: en/ipa`);
      M.inline(exVi, { vn: true });
      M.inline(exEn);
    }
  }
});
