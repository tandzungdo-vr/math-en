/* =====================================================================
   Plain-style math for the Vietnamese → English translator.

   The teacher types formulas the way one would in a chat message:
     x^2 - 5x + 6 = 0,  sqrt(x - 1),  f'(x),  (0; 2),  AB // CD,  6 : 2
   This file
     1. finds those formulas inside a Vietnamese sentence (segment),
     2. rewrites them in US conventions (2,5 → 2.5; (0; 2) → (0, 2)),
     3. renders them as HTML (superscripts, √, ≤ …) and
     4. turns them into spoken American English ("x squared minus 5 x …").
   Works in the browser (window.MathText) and in node for testing.
===================================================================== */
(function (root) {
  'use strict';

  var FUNCS = {
    sin: 'sine', cos: 'cosine', tan: 'tangent', tg: 'tangent',
    cot: 'cotangent', cotg: 'cotangent', log: 'log', lg: 'log',
    ln: 'natural log', exp: 'exp', lim: 'the limit', max: 'the max of', min: 'the min of'
  };
  var FUNC_ALIAS = { tg: 'tan', cotg: 'cot', lg: 'log' };
  var GREEK = {
    'α': 'alpha', 'β': 'beta', 'γ': 'gamma', 'δ': 'delta', 'Δ': 'delta', 'ε': 'epsilon',
    'θ': 'theta', 'λ': 'lambda', 'μ': 'mu', 'π': 'pi', 'σ': 'sigma', 'φ': 'phi',
    'ω': 'omega', 'Ω': 'omega', '∞': 'infinity'
  };
  var FUNC_LETTERS = 'fghFGHPQ';
  var SAY = {
    '+': 'plus', '·': 'times', '×': 'times', '/': 'over', '÷': 'divided by',
    '=': 'equals', '<': 'is less than', '>': 'is greater than',
    '≤': 'is less than or equal to', '≥': 'is greater than or equal to',
    '≠': 'is not equal to', '≈': 'is approximately equal to', '±': 'plus or minus',
    '%': 'percent', '°': 'degrees', '!': 'factorial', "'": 'prime', '√': 'the square root of',
    '∠': 'angle', '⊥': 'is perpendicular to', '∥': 'is parallel to', '→': 'approaches',
    '⇒': 'implies', '⇔': 'if and only if', '∈': 'is in', '∉': 'is not in',
    '⊂': 'is a subset of', '∪': 'union', '∩': 'intersect', '∅': 'the empty set',
    ',': ',', ':': ','
  };
  var OP_NORMAL = {
    '<=>': '⇔', '<=': '≤', '>=': '≥', '!=': '≠', '->': '→', '=>': '⇒',
    '//': '∥', '*': '·', ';': ','
  };
  var WEAK = { ',': 1, ';': 1, ':': 1, '!': 1, "'": 1 };
  var OPEN = { '(': ')', '[': ']', '{': '}' };
  var CLOSE = { ')': 1, ']': 1, '}': 1 };

  var TOKEN_RE = /(\d+(?:[.,]\d+)*)|(\p{L}+)|(<=>|<=|>=|!=|->|=>|\/\/|[+\-*\/^=<>≤≥≠≈±×·÷√∞°%!|_'(){}\[\];,:∠⊥∥→⇒⇔∈∉⊂∪∩∅])|(\s+)|([\s\S])/gu;

  function lex(s) {
    var out = [], m;
    TOKEN_RE.lastIndex = 0;
    while ((m = TOKEN_RE.exec(s))) {
      if (m[1]) out.push({ k: 'num', v: m[1] });
      else if (m[2]) out.push({ k: 'word', v: m[2] });
      else if (m[3]) out.push({ k: 'op', v: m[3] });
      else if (m[4]) out.push({ k: 'ws', v: m[4] });
      else out.push({ k: 'other', v: m[5] });
    }
    return out;
  }

  /* ---------------------------------------------------------- segment */
  function attached(tok) {
    return !!tok && (tok.k === 'num' || (tok.k === 'op' && !WEAK[tok.v] && tok.v !== '-'));
  }

  // Is this run of letters part of a formula, or a (Vietnamese/English) word?
  function wordIsMath(w, prev, next) {
    if (/[^A-Za-z]/.test(w)) return w.length === 1 && !!GREEK[w];  // diacritics → Vietnamese
    if (w.length === 1) return true;                                // x, a, A
    if (FUNCS[w] || w === 'pi' || w === 'inf' || w === 'sqrt') return true;
    if (/^[A-Z]{2,4}$/.test(w)) return true;                        // AB, ABC, ABCD
    if (/^O[xyz]{1,3}$/.test(w)) return true;                       // Ox, Oxy, Oxyz
    if (!/^[a-z]+$/.test(w)) return false;                          // Vi-ét, Câu …
    return attached(prev) || attached(next);                        // 2xy, (ab)
  }

  function isOperand(tok) {
    return tok.k === 'num' || tok.k === 'word' || tok.v === '∞' || tok.v === '∅';
  }

  // Split text into [{type:'text'|'math', value}], keeping every character.
  function segment(text) {
    var toks = lex(text);
    var mathy = toks.map(function (t, i) {
      if (t.k === 'word') return wordIsMath(t.v, toks[i - 1], toks[i + 1]);
      return t.k !== 'other';
    });

    var parts = [];
    function pushText(v) {
      if (!v) return;
      var last = parts[parts.length - 1];
      if (last && last.type === 'text') last.value += v; else parts.push({ type: 'text', value: v });
    }

    var i = 0;
    while (i < toks.length) {
      if (!mathy[i]) { pushText(toks[i].v); i++; continue; }
      var j = i;
      while (j < toks.length && mathy[j]) j++;
      var run = toks.slice(i, j);
      var lead = [], tail = [];
      var changed = true;
      while (changed && run.length) {
        changed = false;
        var f = run[0], l = run[run.length - 1];
        if (f.k === 'ws' || WEAK[f.v]) { lead.push(run.shift()); changed = true; continue; }
        if (l.k === 'ws' || ((l.v === ',' || l.v === ';' || l.v === ':') && l.k === 'op')) {
          tail.unshift(run.pop()); changed = true; continue;
        }
        var opens = 0, closes = 0;
        run.forEach(function (t) { if (OPEN[t.v]) opens++; else if (CLOSE[t.v]) closes++; });
        if (opens > closes && OPEN[f.v]) { lead.push(run.shift()); changed = true; continue; }
        if (closes > opens && CLOSE[l.v]) { tail.unshift(run.pop()); changed = true; continue; }
      }
      pushText(lead.map(function (t) { return t.v; }).join(''));
      if (run.some(isOperand)) parts.push({ type: 'math', value: run.map(function (t) { return t.v; }).join('') });
      else pushText(run.map(function (t) { return t.v; }).join(''));
      pushText(tail.map(function (t) { return t.v; }).join(''));
      i = j;
    }
    return parts;
  }

  /* -------------------------------------------------------- normalize */
  // Vietnamese numbers: 2,5 is two point five and 1.000.000 is a million.
  function usNumber(v) {
    if (v.indexOf(',') >= 0) return v.replace(/\./g, '').replace(',', '.').replace(/,/g, '');
    if (/^\d{1,3}(\.\d{3})+$/.test(v)) return v.replace(/\./g, ',');
    return v;
  }

  function isValue(t) {
    return !!t && (t.k === 'num' || t.k === 'id' || CLOSE[t.v]);
  }

  function normalize(raw, vn) {
    var toks = lex(raw).map(function (t) {
      if (t.k === 'num') return { k: 'num', v: vn ? t.v : usNumber(t.v) };
      if (t.k === 'word') {
        if (FUNCS[t.v]) return { k: 'fn', v: FUNC_ALIAS[t.v] || t.v };
        if (t.v === 'pi') return { k: 'id', v: 'π' };
        if (t.v === 'inf') return { k: 'id', v: '∞' };
        if (t.v === 'sqrt') return { k: 'op', v: '√' };
        return { k: 'id', v: t.v };
      }
      if (t.k === 'op') {
        if (t.v === '∞') return { k: 'id', v: '∞' };
        if (vn && (t.v === ';' || t.v === ':')) return t;
        return { k: 'op', v: OP_NORMAL[t.v] || t.v };
      }
      return t;
    });
    if (!vn) {
      toks.forEach(function (t, i) {
        if (t.v !== ':') return;
        var p = prevSolid(toks, i), n = nextSolid(toks, i);
        if (isValue(p) && n && (n.k === 'num' || n.k === 'id' || OPEN[n.v])) t.v = '÷';
      });
    }
    return toks;
  }

  function prevSolid(toks, i) { for (var j = i - 1; j >= 0; j--) if (toks[j].k !== 'ws') return toks[j]; return null; }
  function nextSolid(toks, i) { for (var j = i + 1; j < toks.length; j++) if (toks[j].k !== 'ws') return toks[j]; return null; }

  function matchClose(toks, i) {
    var depth = 0;
    for (var j = i; j < toks.length; j++) {
      if (OPEN[toks[j].v]) depth++;
      else if (CLOSE[toks[j].v] && --depth === 0) return j;
    }
    return -1;
  }

  // The operand right after ^ or _: (group), -2, 2, x.
  function operand(toks, j) {
    var t = toks[j];
    if (!t) return { inner: [], end: j - 1, group: false };
    if (OPEN[t.v]) {
      var k = matchClose(toks, j);
      if (k > 0) return { inner: toks.slice(j + 1, k), end: k, group: true };
    }
    if (t.v === '-' && toks[j + 1]) return { inner: [t, toks[j + 1]], end: j + 1, group: false };
    return { inner: [t], end: j, group: false };
  }

  /* ------------------------------------------------------------- html */
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function idHtml(v) {
    if (/^[A-Za-z]+$/.test(v)) return '<i>' + v + '</i>';
    return esc(v);
  }

  function toHtml(toks) {
    var out = '';
    for (var i = 0; i < toks.length; i++) {
      var t = toks[i];
      if (t.v === '^' || t.v === '_') {
        var g = operand(toks, i + 1);
        var tag = t.v === '^' ? 'sup' : 'sub';
        out += '<' + tag + '>' + toHtml(g.inner) + '</' + tag + '>';
        i = g.end;
      } else if (t.k === 'id') out += idHtml(t.v);
      else if (t.k === 'fn') out += t.v;
      else if (t.k === 'ws') out += ' ';
      else if (t.v === '-') out += '−';
      else out += esc(t.v);
    }
    return out;
  }

  function toPlain(toks) {
    return toks.map(function (t) { return t.k === 'ws' ? ' ' : t.v; }).join('');
  }

  /* ----------------------------------------------------------- speech */
  function sayId(v) {
    if (GREEK[v]) return GREEK[v];
    // Spoken letter by letter, upper-cased so "a" reads as "ay", not "uh".
    return v.split('').map(function (c) { return GREEK[c] || c.toUpperCase(); }).join(' ');
  }

  function hasOp(toks) {
    return toks.some(function (t) { return t.k === 'op' && !OPEN[t.v] && !CLOSE[t.v]; });
  }
  function hasTopComma(toks) {
    var depth = 0;
    return toks.some(function (t) {
      if (OPEN[t.v]) depth++; else if (CLOSE[t.v]) depth--;
      return depth === 0 && t.v === ',';
    });
  }

  function sayPower(g) {
    var inner = g.inner;
    if (inner.length === 1 && inner[0].v === '2') return 'squared';
    if (inner.length === 1 && inner[0].v === '3') return 'cubed';
    return 'to the power of ' + say(inner) + (inner.length > 1 ? ',' : '');
  }

  function say(toks) {
    var w = [], abs = false, callNext = false;
    for (var i = 0; i < toks.length; i++) {
      var t = toks[i], p = toks[i - 1], ps = prevSolid(toks, i);
      if (t.k === 'ws') continue;
      // sin^2(x), log_2(x): the bracket after the power/base is still the argument
      var called = callNext; callNext = false;
      if (t.k === 'num') { w.push(t.v); continue; }
      if (t.k === 'id') { w.push(sayId(t.v)); continue; }
      if (t.k === 'fn') { w.push(FUNCS[t.v]); continue; }

      var v = t.v;
      if (v === '^') {
        var gp = operand(toks, i + 1);
        if (ps && CLOSE[ps.v]) w.push(',');
        w.push(sayPower(gp)); i = gp.end;
        callNext = !!ps && ps.k === 'fn'; continue;
      }
      if (v === '_') {
        var gs = operand(toks, i + 1);
        if (ps && ps.v === 'lim') w.push('as', say(gs.inner) + ',', 'of');
        else if (ps && ps.v === 'log') w.push('base', say(gs.inner));
        else w.push('sub', say(gs.inner));
        i = gs.end;
        callNext = !!ps && ps.v === 'log'; continue;
      }
      if (OPEN[v]) {
        var k = matchClose(toks, i);
        if (k < 0) continue;
        var inner = toks.slice(i + 1, k);
        var touch = p && p.k !== 'ws' ? p : null;
        var comma = hasTopComma(inner);
        var callee = called || touch && (touch.k === 'fn' || touch.v === "'" ||
          (touch.k === 'id' && touch.v.length === 1 && FUNC_LETTERS.indexOf(touch.v) >= 0));
        if (callee) w.push('of');
        else if (touch && touch.k === 'id' && /^[A-Z]$/.test(touch.v) && comma) w.push('at');
        else if (touch && (touch.k === 'num' || touch.k === 'id' || CLOSE[touch.v])) w.push(hasOp(inner) ? 'times the quantity' : 'times');
        else if (comma && !touch) {
          // an interval like (0, 2) or [1, +∞)
          var parts = splitTop(inner);
          if (parts.length === 2) {
            w.push('from', say(parts[0]), 'to', say(parts[1]));
            i = k; continue;
          }
        } else if (hasOp(inner) && !(i === 0 && k === toks.length - 1)) w.push('the quantity');
        w.push(say(inner));
        i = k; continue;
      }
      if (CLOSE[v] || v === '.') continue;
      if (v === '|') { if (!abs) w.push('the absolute value of'); abs = !abs; continue; }
      if (v === '-') {
        var unary = !ps || (ps.k === 'op' && !CLOSE[ps.v] && !/[!°%']/.test(ps.v));
        w.push(unary ? 'negative' : 'minus'); continue;
      }
      if (v === '+' && (!ps || (ps.k === 'op' && !CLOSE[ps.v]))) {
        var nx = nextSolid(toks, i);
        if (!(nx && nx.v === '∞')) w.push('positive');
        continue;
      }
      if (SAY[v] !== undefined) { w.push(SAY[v]); continue; }
      w.push(v);
    }
    return w.join(' ');
  }

  function splitTop(toks) {
    var parts = [[]], depth = 0;
    toks.forEach(function (t) {
      if (OPEN[t.v]) depth++; else if (CLOSE[t.v]) depth--;
      if (depth === 0 && t.v === ',') parts.push([]); else parts[parts.length - 1].push(t);
    });
    return parts;
  }

  function tidy(s) {
    return s.replace(/\s+/g, ' ').replace(/\s+,/g, ',').replace(/,(\s*,)+/g, ',')
      .replace(/^,\s*/, '').replace(/,\s*$/, '').trim();
  }

  /* -------------------------------------------------------------- api */
  // analyze('x^2 - 5x + 6 = 0') → { plain, html, speech }
  // opts.vn keeps Vietnamese number and interval style (for Vietnamese text).
  function analyze(raw, opts) {
    var vn = !!(opts && opts.vn);
    var toks = normalize(raw.trim(), vn);
    return {
      raw: raw,
      plain: toPlain(toks),
      html: '<span class="math">' + toHtml(toks) + '</span>',
      speech: tidy(say(toks))
    };
  }

  // Text with formulas inside `backticks` (used by the vocabulary examples).
  function inline(text, opts) {
    var html = '', speech = '';
    text.split('`').forEach(function (piece, i) {
      if (i % 2) { var a = analyze(piece, opts); html += a.html; speech += a.speech; }
      else { html += esc(piece); speech += piece; }
    });
    return { html: html, speech: tidy(speech) };
  }

  root.MathText = { segment: segment, analyze: analyze, inline: inline, esc: esc };
})(typeof window !== 'undefined' ? window : globalThis);
