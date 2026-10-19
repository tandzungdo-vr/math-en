/* =====================================================================
   Math English — Vietnamese → English math translator for teachers.
   Translation: Google Cloud Translation v2 (key in window.MATH_EN).
   Audio: the browser's own speech synthesis, American English voice.
   Everything the user keeps (history, saved items, language, voice)
   lives in localStorage on this device; saved items can also sync
   across devices through an Apps Script web app (sync/Code.gs).
===================================================================== */
(function () {
  'use strict';

  var M = window.MathText;
  var esc = M.esc;
  var $ = function (id) { return document.getElementById(id); };

  /* ------------------------------------------------------------ store */
  var store = {
    get: function (k, d) {
      try { var v = localStorage.getItem('mathen.' + k); return v === null ? d : JSON.parse(v); }
      catch (e) { return d; }
    },
    set: function (k, v) {
      try { localStorage.setItem('mathen.' + k, JSON.stringify(v)); } catch (e) {}
      if (store.changed) store.changed(k);
    },
    changed: null   // set by the sync section
  };

  /* ------------------------------------------------------------- i18n */
  var STR = {
    vi: {
      title: 'Tiếng Anh Toán học',
      alias: 'Math in English',
      intro: 'Nhập câu toán bằng tiếng Việt để dịch sang tiếng Anh, nghe cách đọc giọng Mỹ và học từ vựng toán theo chủ đề. Gõ công thức như bình thường, ví dụ x^2 - 5x + 6 = 0, sqrt(x), f\'(x), (0; 2).',
      tabTranslate: 'Dịch câu', tabVocab: 'Từ vựng', tabSaved: 'Đã lưu',
      labelVi: 'Tiếng Việt', labelEn: 'Tiếng Anh',
      inputPh: 'Ví dụ: Giải phương trình x^2 - 5x + 6 = 0.',
      translate: 'Dịch', translating: 'Đang dịch…',
      optGlossary: 'Dùng thuật ngữ toán chuẩn',
      tryExample: 'Thử ví dụ',
      play: 'Nghe', slow: 'Đọc chậm', copy: 'Sao chép', copied: 'Đã chép',
      save: 'Lưu', saved: 'Đã lưu', remove: 'Bỏ lưu',
      labelFormulas: 'Đọc công thức', labelTerms: 'Từ vựng trong câu',
      glossaryNote: 'Từ được gạch chân lấy từ bảng thuật ngữ, không phải từ Google.',
      history: 'Câu đã dịch gần đây', clearHistory: 'Xoá lịch sử', noHistory: 'Chưa có câu nào.',
      search: 'Tìm từ, tiếng Việt hoặc tiếng Anh…', allTopics: 'Tất cả', grades: 'Lớp',
      noResults: 'Không tìm thấy từ nào.', terms: 'từ',
      flashcards: 'Thẻ ôn tập', flip: 'Lật thẻ', next: 'Tiếp', prev: 'Trước', shuffle: 'Trộn',
      deckLabel: 'Ôn', deckGroupSaved: 'Đã lưu', deckGroupVocab: 'Từ vựng',
      deckSavedAll: 'Tất cả từ đã lưu', deckVocabAll: 'Tất cả từ vựng',
      deckHint: 'Lưu từ ở mục Từ vựng để tạo bộ ôn riêng.',
      mySets: 'Bộ của tôi', newSet: '+ Tạo bộ mới', setNamePh: 'Tên bộ, ví dụ: Ôn tập chương 1',
      createSet: 'Tạo và lưu', deleteSet: 'Xoá bộ',
      confirmDeleteSet: 'Xoá bộ “%s” và bỏ lưu các từ trong bộ? Các từ vẫn còn trong mục Từ vựng.',
      backup: 'Sao lưu',
      backupNote: 'Từ, bộ từ và câu đã lưu chỉ nằm trong trình duyệt này. Xuất ra tệp để giữ bản sao hoặc chuyển sang thiết bị khác. Khi nhập, dữ liệu trong tệp được gộp vào dữ liệu hiện có, không xoá gì.',
      export: 'Xuất tệp sao lưu', import: 'Nhập tệp sao lưu',
      exported: 'Đã tải xuống %s.',
      imported: 'Đã nhập: %w từ, %s bộ, %c câu mới.',
      importBad: 'Không đọc được tệp này. Hãy chọn tệp sao lưu .json xuất từ trang này.',
      backupSync: 'Đồng bộ và sao lưu',
      backupNoteSync: 'Từ, bộ từ, câu đã lưu và bản dịch tự động đồng bộ giữa các thiết bị mở trang này. Bạn vẫn có thể xuất tệp để giữ thêm một bản sao. Khi nhập, dữ liệu trong tệp được gộp vào, không xoá gì.',
      syncNow: 'Đồng bộ ngay', syncBusy: 'Đang đồng bộ…', syncOk: 'Đã đồng bộ lúc %s.',
      syncOff: 'Chưa đồng bộ được (mất mạng?). Dữ liệu vẫn lưu trên máy này và sẽ đồng bộ khi có mạng.',
      syncDenied: 'Máy chủ đồng bộ từ chối khoá. Kiểm tra SYNC_KEY trong .env và trong Apps Script.',
      savedSentences: 'Câu đã lưu', savedWords: 'Từ đã lưu', noSaved: 'Chưa lưu mục nào.',
      grade: 'Lớp', topic: 'Chủ đề', unsorted: 'Chưa phân loại',
      saveTo: 'Lưu vào', savedIn: 'Đã lưu ở', starred: 'Chủ đề gắn sao',
      star: 'Gắn sao cho lớp · chủ đề này', unstar: 'Bỏ sao',
      starHint: 'Bấm ☆ bên dưới để gắn sao cho chủ đề hay dùng.',
      voice: 'Giọng đọc', home: 'Trang chủ',
      voiceNatural: 'Giọng tự nhiên (Google)', voiceBrowser: 'Giọng của trình duyệt',
      errVoice: 'Không tải được giọng Google, dùng giọng trình duyệt: ',
      errNoKey: 'Chưa có khoá Google API. Xem hướng dẫn trong README.md.',
      errApi: 'Không dịch được: ', errNet: 'Không kết nối được tới Google. Kiểm tra mạng và thử lại.',
      errNoSpeech: 'Trình duyệt này không hỗ trợ đọc thành tiếng.',
      usageTr: 'Dịch', usageTts: 'Đọc',
      usageTitle: 'Số ký tự đã gửi tới Google trong tháng này, tính trên thiết bị này (câu và giọng đọc đã có trong bộ nhớ đệm không tính). ' +
        'Miễn phí mỗi tháng: 500.000 ký tự dịch và 1.000.000 ký tự giọng đọc. Số liệu chính xác xem ở Google Cloud Console.',
      themeDark: 'Chuyển sang nền tối', themeLight: 'Chuyển sang nền sáng'
    },
    en: {
      title: 'Math in English',
      alias: 'Tiếng Anh Toán học',
      intro: 'Type a math sentence in Vietnamese to translate it into English, hear it read aloud in an American voice, and study math vocabulary by topic. Type formulas as usual, e.g. x^2 - 5x + 6 = 0, sqrt(x), f\'(x), (0; 2).',
      tabTranslate: 'Translate', tabVocab: 'Vocabulary', tabSaved: 'Saved',
      labelVi: 'Vietnamese', labelEn: 'English',
      inputPh: 'e.g. Giải phương trình x^2 - 5x + 6 = 0.',
      translate: 'Translate', translating: 'Translating…',
      optGlossary: 'Use standard math terms',
      tryExample: 'Try an example',
      play: 'Listen', slow: 'Slow', copy: 'Copy', copied: 'Copied',
      save: 'Save', saved: 'Saved', remove: 'Unsave',
      labelFormulas: 'Reading formulas', labelTerms: 'Terms in this sentence',
      glossaryNote: 'Underlined words come from the glossary, not from Google.',
      history: 'Recent translations', clearHistory: 'Clear history', noHistory: 'Nothing yet.',
      search: 'Search Vietnamese or English…', allTopics: 'All', grades: 'Grades',
      noResults: 'No terms found.', terms: 'terms',
      flashcards: 'Flashcards', flip: 'Flip', next: 'Next', prev: 'Previous', shuffle: 'Shuffle',
      deckLabel: 'Review', deckGroupSaved: 'Saved', deckGroupVocab: 'Vocabulary',
      deckSavedAll: 'All saved terms', deckVocabAll: 'All vocabulary',
      deckHint: 'Save terms under Vocabulary to build your own review sets.',
      mySets: 'My sets', newSet: '+ New set', setNamePh: 'Set name, e.g. Chapter 1 review',
      createSet: 'Create & save', deleteSet: 'Delete set',
      confirmDeleteSet: 'Delete the set “%s” and unsave its terms? They stay under Vocabulary.',
      backup: 'Backup',
      backupNote: 'Saved terms, sets and sentences live only in this browser. Export a file to keep a copy or to move to another device. Importing merges the file into what is here and never deletes anything.',
      export: 'Export backup', import: 'Import backup',
      exported: 'Downloaded %s.',
      imported: 'Imported: %w terms, %s sets, %c sentences that were new.',
      importBad: 'Could not read this file. Choose a .json backup exported from this page.',
      backupSync: 'Sync & backup',
      backupNoteSync: 'Saved terms, sets, sentences and translations sync automatically between devices that open this page. You can still export a file as an extra copy. Importing merges the file in and never deletes anything.',
      syncNow: 'Sync now', syncBusy: 'Syncing…', syncOk: 'Synced at %s.',
      syncOff: 'Could not sync (offline?). Everything is still saved on this device and will sync when back online.',
      syncDenied: 'The sync server rejected the key. Check SYNC_KEY in .env and in the Apps Script.',
      savedSentences: 'Saved sentences', savedWords: 'Saved terms', noSaved: 'Nothing saved yet.',
      grade: 'Grade', topic: 'Topic', unsorted: 'Unsorted',
      saveTo: 'Save to', savedIn: 'Saved in', starred: 'Starred topics',
      star: 'Star this grade · topic', unstar: 'Unstar',
      starHint: 'Tap ☆ below to star a topic you use often.',
      voice: 'Voice', home: 'Home',
      voiceNatural: 'Natural voices (Google)', voiceBrowser: 'Browser voices',
      errVoice: 'Google voice unavailable, using the browser voice: ',
      errNoKey: 'No Google API key yet. See README.md.',
      errApi: 'Translation failed: ', errNet: 'Could not reach Google. Check the connection and try again.',
      errNoSpeech: 'This browser cannot read text aloud.',
      usageTr: 'Translate', usageTts: 'Voice',
      usageTitle: 'Characters sent to Google this month, counted on this device (cached sentences and audio are free). ' +
        'Free each month: 500,000 translation and 1,000,000 voice characters. Google Cloud Console has the exact numbers.',
      themeDark: 'Switch to dark mode', themeLight: 'Switch to light mode'
    }
  };
  var lang = store.get('lang', 'vi');
  function t(k) { return STR[lang][k] || STR.vi[k] || k; }

  function applyLang() {
    document.documentElement.lang = lang;
    document.title = t('title');
    document.querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) { el.placeholder = t(el.dataset.i18nPh); });
    document.querySelectorAll('.lang-switch button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
    });
    syncTheme();
    renderUsage(); renderSync();
    loadVoices();
    renderTopics(); renderVocab(); renderHistory(); renderSaved();
    if (current) renderResult(current);
  }

  /* ------------------------------------------------------------ theme */
  var rootEl = document.documentElement;
  function isDark() { return rootEl.getAttribute('data-theme') === 'dark'; }
  function syncTheme() { $('theme-switch').setAttribute('aria-label', t(isDark() ? 'themeLight' : 'themeDark')); }
  $('theme-switch').addEventListener('click', function () {
    var mode = isDark() ? 'light' : 'dark';
    rootEl.setAttribute('data-theme', mode);
    try { localStorage.setItem('theme', mode); } catch (e) {}
    syncTheme();
  });

  /* ------------------------------------------------------- vocabulary */
  var VOCAB = [];   // flat list of { key, topic, vis[], vi, en, ipa, exVi, exEn, force }
  window.MATH_VOCAB.forEach(function (topic) {
    topic.terms.forEach(function (r) {
      var vis = r[0].normalize('NFC').split('|');
      VOCAB.push({ key: vis[0], topic: topic, vis: vis, vi: vis[0], en: r[1], ipa: r[2], exVi: r[3], exEn: r[4], force: !!r[5] });
    });
  });
  var BY_KEY = {};
  VOCAB.forEach(function (v) { BY_KEY[v.key] = v; });

  // Topics by id, their order in vocab.js, and the single grades they cover
  // ('6–9' → 6, 7, 8, 9), for the save menu's grade → topic pickers.
  var TOPIC = {}, TOPIC_ORDER = {}, GRADES = [];
  function gradeRange(tp) { var m = tp.grades.split(/\D+/); return [+m[0], +(m[1] || m[0])]; }
  window.MATH_VOCAB.forEach(function (tp, i) {
    TOPIC[tp.id] = tp; TOPIC_ORDER[tp.id] = i;
    var r = gradeRange(tp);
    for (var g = r[0]; g <= r[1]; g++) if (GRADES.indexOf(g) < 0) GRADES.push(g);
  });
  GRADES.sort(function (a, b) { return a - b; });
  function topicsFor(g) {
    return window.MATH_VOCAB.filter(function (tp) { var r = gradeRange(tp); return g >= r[0] && g <= r[1]; });
  }
  function topicName(tp) { return lang === 'vi' ? tp.vi : tp.en; }
  // every spelling, longest first, so "tiệm cận đứng" wins over "tiệm cận"
  var SPELLINGS = [];
  VOCAB.forEach(function (v) { v.vis.forEach(function (s) { SPELLINGS.push({ s: s.toLowerCase(), v: v }); }); });
  SPELLINGS.sort(function (a, b) { return b.s.length - a.s.length; });

  var LETTER = /[\p{L}\p{N}]/u;
  // Find vocabulary terms in Vietnamese text: [{start, end, v}] in order.
  function findTerms(text, onlyForced) {
    var low = text.toLowerCase(), taken = new Array(text.length), hits = [];
    SPELLINGS.forEach(function (sp) {
      if (onlyForced && !sp.v.force) return;
      var from = 0, i;
      while ((i = low.indexOf(sp.s, from)) >= 0) {
        var end = i + sp.s.length;
        from = i + 1;
        if ((i > 0 && LETTER.test(low[i - 1])) || (end < low.length && LETTER.test(low[end]))) continue;
        var free = true;
        for (var j = i; j < end; j++) if (taken[j]) { free = false; break; }
        if (!free) continue;
        for (j = i; j < end; j++) taken[j] = true;
        hits.push({ start: i, end: end, v: sp.v });
      }
    });
    return hits.sort(function (a, b) { return a.start - b.start; });
  }

  /* ----------------------------------------------------------- speech */
  // Two engines:
  //  - Google Cloud Text-to-Speech neural voices (natural; same API key),
  //    slow mode = slightly slower + short pauses at commas and periods;
  //  - the browser's own en-US voices, as a fallback and for offline use.
  // Voice ids in the picker: "g:<google voice>" or "b:<browser voiceURI>".
  var API_KEY = (window.MATH_EN && window.MATH_EN.apiKey) || '';
  if (/^%%/.test(API_KEY)) API_KEY = '';

  /* ------------------------------------------------------------ usage */
  // Characters sent to Google this month from this device, against the
  // monthly free tiers. A browser key can't read the real figures (that
  // needs Cloud Monitoring with OAuth), so count what we send; cache hits
  // never reach Google and aren't counted.
  var FREE = { tr: 500000, tts: 1000000 };
  function usage() {
    var d = new Date(), m = d.getFullYear() + '-' + (d.getMonth() + 1), u = store.get('usage', null);
    return u && u.m === m ? u : { m: m, tr: 0, tts: 0 };
  }
  function addUsage(kind, chars) {
    var u = usage();
    u[kind] += chars;
    store.set('usage', u);
    renderUsage();
  }
  function renderUsage() {
    var el = $('usage');
    if (!el) return;
    el.hidden = !API_KEY;
    var u = usage(), loc = lang === 'vi' ? 'vi-VN' : 'en-US';
    function n(x) { return x < 1000 ? String(x) : (x / 1000).toLocaleString(loc, { maximumFractionDigits: x < 10000 ? 1 : 0 }) + 'k'; }
    function part(kind, label, cap) {
      return '<span' + (u[kind] > cap * 0.8 ? ' class="high"' : '') + '>' + esc(label) + ' ' + n(u[kind]) + '/' + esc(cap === 1000000 ? '1M' : n(cap)) + '</span>';
    }
    el.innerHTML = 'API ' + part('tr', t('usageTr'), FREE.tr) + ' · ' + part('tts', t('usageTts'), FREE.tts);
    el.title = t('usageTitle');
    el.setAttribute('aria-label', t('usageTitle'));
  }

  var GOOGLE_VOICES = [
    ['en-US-Neural2-F', 'Google · Female 1'], ['en-US-Neural2-H', 'Google · Female 2'],
    ['en-US-Neural2-D', 'Google · Male 1'], ['en-US-Neural2-J', 'Google · Male 2']
  ];
  var synth = window.speechSynthesis;
  var browserVoices = [];
  var PREFERRED = ['Samantha', 'Microsoft Aria', 'Microsoft Jenny', 'Google US English', 'Microsoft Guy', 'Ava', 'Allison', 'Alex'];

  function bestBrowserVoice() {
    for (var i = 0; i < PREFERRED.length; i++) {
      var v = browserVoices.find(function (x) { return x.name.indexOf(PREFERRED[i]) === 0; });
      if (v) return v;
    }
    return browserVoices.find(function (x) { return x.localService; }) || browserVoices[0] || null;
  }
  var googleFailed = false;   // after one failure, use the browser voice for the rest of the visit
  function voiceId() {
    var saved = store.get('voice', null);
    if (saved && saved.indexOf('g:') === 0 && API_KEY && !googleFailed) return saved;
    if (saved && saved.indexOf('b:') === 0 && browserVoices.some(function (v) { return 'b:' + v.voiceURI === saved; })) return saved;
    if (API_KEY && !googleFailed) return 'g:' + GOOGLE_VOICES[0][0];
    var b = bestBrowserVoice();
    return b ? 'b:' + b.voiceURI : '';
  }
  function loadVoices() {
    browserVoices = synth ? synth.getVoices().filter(function (v) { return /^en[-_]US/i.test(v.lang); }) : [];
    var id = voiceId();
    function opt(value, label) {
      return '<option value="' + esc(value) + '"' + (value === id ? ' selected' : '') + '>' + esc(label) + '</option>';
    }
    var html = '';
    if (API_KEY) html += '<optgroup label="' + esc(t('voiceNatural')) + '">' +
      GOOGLE_VOICES.map(function (g) { return opt('g:' + g[0], g[1]); }).join('') + '</optgroup>';
    if (browserVoices.length) html += '<optgroup label="' + esc(t('voiceBrowser')) + '">' +
      browserVoices.map(function (v) { return opt('b:' + v.voiceURI, v.name); }).join('') + '</optgroup>';
    $('voice').innerHTML = html;
    $('voice-row').hidden = !html;
  }

  // Web Audio, unlocked inside the click, so iPhones play audio that
  // arrives after the network request.
  var ctx = null, playing = null, audioCache = {};
  function audioContext() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function ssml(text, slow) {
    var s = esc(text);
    if (slow) s = s.replace(/([,;:.?!])\s+/g, '$1 <break time="400ms"/> ');
    return '<speak>' + s + '</speak>';
  }
  // Google MP3s are also kept across visits in IndexedDB ('mathen-audio'):
  // the newest CLIP_MAX clips, keyed like audioCache. Any IndexedDB trouble
  // (private mode, quota) just means we fetch from Google as before.
  var CLIP_MAX = 500, clipDb = null;
  function clips() {
    if (!clipDb) clipDb = new Promise(function (ok) {
      try {
        var req = indexedDB.open('mathen-audio', 1);
        req.onupgradeneeded = function () { req.result.createObjectStore('clips', { keyPath: 'key' }).createIndex('used', 'used'); };
        req.onsuccess = function () { ok(req.result); };
        req.onerror = req.onblocked = function () { ok(null); };
      } catch (e) { ok(null); }
    });
    return clipDb;
  }
  function clipStore(db, mode) { return db.transaction('clips', mode).objectStore('clips'); }
  function clipGet(key) {
    return clips().then(function (db) {
      if (!db) return null;
      return new Promise(function (ok) {
        try {
          var os = clipStore(db, 'readwrite'), req = os.get(key);
          req.onsuccess = function () {
            var c = req.result;
            if (c) { c.used = Date.now(); os.put(c); }   // keep recently played clips
            ok(c ? c.mp3 : null);
          };
          req.onerror = function () { ok(null); };
        } catch (e) { ok(null); }
      });
    });
  }
  function clipPut(key, mp3) {
    clips().then(function (db) {
      if (!db) return;
      try {
        var os = clipStore(db, 'readwrite');
        os.put({ key: key, mp3: mp3, used: Date.now() });
        var count = os.count();
        count.onsuccess = function () {
          var extra = count.result - CLIP_MAX;
          if (extra <= 0) return;
          os.index('used').openCursor().onsuccess = function (e) {   // oldest first
            var cur = e.target.result;
            if (cur && extra-- > 0) { cur.delete(); cur.continue(); }
          };
        };
      } catch (e) {}
    });
  }
  function clipDelete(key) {
    clips().then(function (db) { try { if (db) clipStore(db, 'readwrite').delete(key); } catch (e) {} });
  }

  // callbacks for old Safari; newer browsers also return a promise, whose
  // rejection the fail callback already handles
  function decodeMp3(buf) {
    return new Promise(function (ok, fail) {
      var p = ctx.decodeAudioData(buf, ok, fail);
      if (p && p.catch) p.catch(function () {});
    });
  }
  function downloadAudio(key, text, slow, name) {
    var input = ssml(text, slow);
    return fetch('https://texttospeech.googleapis.com/v1/text:synthesize?key=' + encodeURIComponent(API_KEY), {
      method: 'POST',
      referrerPolicy: 'no-referrer-when-downgrade',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { ssml: input },
        voice: { languageCode: 'en-US', name: name },
        audioConfig: { audioEncoding: 'MP3', speakingRate: slow ? 0.85 : 1 }
      })
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) throw new Error((j.error && j.error.message) || ('HTTP ' + r.status));
        addUsage('tts', input.length);
        var bin = atob(j.audioContent), bytes = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        clipPut(key, bytes.buffer.slice(0));   // copy: decoding detaches the buffer
        return decodeMp3(bytes.buffer);
      });
    });
  }
  function googleAudio(text, slow, name) {
    var key = name + (slow ? '|slow|' : '|') + text;
    if (!audioCache[key]) {
      audioCache[key] = clipGet(key).then(function (mp3) {
        if (!mp3) return downloadAudio(key, text, slow, name);
        // a damaged stored clip: drop it and fetch a fresh one
        return decodeMp3(mp3).catch(function () { clipDelete(key); return downloadAudio(key, text, slow, name); });
      });
      audioCache[key].catch(function () { delete audioCache[key]; });
    }
    return audioCache[key];
  }
  function stopAll() {
    if (playing) { try { playing.stop(); } catch (e) {} playing = null; }
    if (synth) synth.cancel();
  }
  function speakBrowser(text, slow) {
    if (!synth) { showStatus(t('errNoSpeech')); return; }
    var id = voiceId(), v = browserVoices.find(function (x) { return 'b:' + x.voiceURI === id; }) || bestBrowserVoice();
    // Slow mode: phrase by phrase, so the pauses carry the pace instead of
    // stretching every word.
    var parts = [text];
    if (slow) {
      var bits = text.split(/([,;:.?!])\s+/);   // "2.5" stays whole: needs a space after
      parts = [];
      for (var i = 0; i < bits.length; i += 2) parts.push(bits[i] + (bits[i + 1] || ''));
    }
    parts.forEach(function (part) {
      var u = new SpeechSynthesisUtterance(part);
      if (v) u.voice = v;
      u.lang = 'en-US';
      u.rate = slow ? 0.85 : 1;
      synth.speak(u);
    });
  }
  function speak(text, slow) {
    stopAll();
    var id = voiceId();
    if (id.indexOf('g:') !== 0 || !audioContext()) { speakBrowser(text, slow); return; }
    googleAudio(text, slow, id.slice(2)).then(function (buffer) {
      stopAll();
      var src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(ctx.destination);
      src.start(0);
      playing = src;
    }).catch(function (err) {
      googleFailed = true;
      showStatus(t('errVoice') + err.message);
      speakBrowser(text, slow);
    });
  }
  loadVoices();
  if (synth) synth.addEventListener('voiceschanged', loadVoices);
  $('voice').addEventListener('change', function (e) { store.set('voice', e.target.value); });

  /* ------------------------------------------------------ translation */
  // Vietnamese text → HTML for Google: formulas and glossary terms are
  // wrapped in notranslate spans, which Google passes through untouched.
  function buildRequest(text, useGlossary) {
    var maths = {}, forced = {}, html = '';
    M.segment(text).forEach(function (part) {
      if (part.type === 'math') {
        var a = M.analyze(part.value);
        maths[a.plain] = a;
        html += '<span class="notranslate">' + esc(a.plain) + '</span>';
        return;
      }
      var s = part.value, at = 0;
      (useGlossary ? findTerms(s, true) : []).forEach(function (h) {
        html += esc(s.slice(at, h.start));
        forced[h.v.en] = h.v;
        html += '<span class="notranslate">' + esc(h.v.en) + '</span>';
        at = h.end;
      });
      html += esc(s.slice(at));
    });
    return { html: html.replace(/\n/g, '<br>'), maths: maths, forced: forced };
  }

  // Google's HTML answer → { html, speech, plain }
  function readResponse(translated, req) {
    var doc = new DOMParser().parseFromString('<div>' + translated + '</div>', 'text/html');
    var out = { html: '', speech: '', plain: '' };
    (function walk(node) {
      node.childNodes.forEach(function (n) {
        if (n.nodeType === 3) {
          out.html += esc(n.nodeValue); out.speech += n.nodeValue; out.plain += n.nodeValue;
        } else if (n.nodeName === 'BR') {
          out.html += '<br>'; out.speech += '. '; out.plain += '\n';
        } else if (n.nodeName === 'SPAN' && /notranslate/.test(n.className)) {
          var key = n.textContent.trim(), a = req.maths[key];
          if (a) { out.html += a.html; out.speech += ' ' + a.speech + ' '; out.plain += a.plain; }
          else { out.html += '<span class="term">' + esc(key) + '</span>'; out.speech += key; out.plain += key; }
        } else walk(n);
      });
    })(doc.body.firstChild);
    out.speech = out.speech.replace(/\s+/g, ' ').replace(/\s+([,.?!;:])/g, '$1').trim();
    out.plain = out.plain.replace(/[ \t]+/g, ' ').trim();
    return out;
  }

  function callGoogle(html) {
    return fetch('https://translation.googleapis.com/language/translate/v2?key=' + encodeURIComponent(API_KEY), {
      method: 'POST',
      // send the full page URL so the key can be restricted to /math-en/
      referrerPolicy: 'no-referrer-when-downgrade',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: html, source: 'vi', target: 'en', format: 'html' })
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) throw new Error((j.error && j.error.message) || ('HTTP ' + r.status));
        addUsage('tr', html.length);
        return j.data.translations[0].translatedText;
      });
    }, function () { throw new Error(t('errNet')); });
  }

  var cache = store.get('cache', {});
  var current = null;

  function translate() {
    var text = $('input').value.normalize('NFC').trim();
    if (!text) return;
    if (!API_KEY) { showStatus(t('errNoKey')); return; }
    var useGlossary = $('opt-glossary').checked;
    var req = buildRequest(text, useGlossary);
    var cacheKey = (useGlossary ? 'g|' : 'n|') + text;
    var btn = $('btn-translate');
    showStatus('');
    btn.disabled = true; btn.textContent = t('translating');
    var job = cache[cacheKey] ? Promise.resolve(cache[cacheKey]) : callGoogle(req.html);
    job.then(function (translated) {
      cache[cacheKey] = translated;
      var keys = Object.keys(cache);
      if (keys.length > 300) keys.slice(0, keys.length - 300).forEach(function (k) { delete cache[k]; });
      store.set('cache', cache);
      var res = readResponse(translated, req);
      var seen = {};
      current = {
        vi: text,
        en: res,
        maths: Object.keys(req.maths).map(function (k) { return req.maths[k]; }),
        terms: findTerms(text, false).map(function (h) { return h.v.key; })
          .filter(function (k) { return seen[k] ? false : (seen[k] = true); }),
        glossary: Object.keys(req.forced).length > 0,
        time: Date.now()
      };
      addHistory(current);
      renderResult(current);
    }).catch(function (err) {
      showStatus(err.message === t('errNet') ? err.message : t('errApi') + err.message);
    }).then(function () {
      btn.disabled = false; btn.textContent = t('translate');
    });
  }

  function showStatus(msg) {
    $('status').textContent = msg;
    $('status').hidden = !msg;
  }

  /* ------------------------------------------------------ render: tab 1 */
  function actions(list) {
    return '<div class="actions">' + list.map(function (a) {
      return '<button type="button" class="link" data-act="' + a[0] + '"' + (a[2] !== undefined ? ' data-arg="' + esc(a[2]) + '"' : '') +
        (a[0] === 'save-word' ? ' aria-haspopup="dialog" aria-expanded="false"' : '') + '>' + esc(a[1]) + '</button>';
    }).join('') + '</div>';
  }

  function termCard(v) {
    return '<li class="term-chip"><span class="term-en">' + esc(v.en) + '</span> <span class="ipa">' + esc(v.ipa) + '</span>' +
      '<span class="term-vi">' + esc(v.vi) + '</span>' +
      actions([['say', t('play'), v.en], ['save-word', saveLabel(v.key), v.key]]) + '</li>';
  }

  function renderResult(r) {
    $('result').hidden = false;
    $('output').innerHTML = r.en.html;
    $('glossary-note').hidden = !r.glossary;
    var saved = isSavedSentence(r.vi);
    $('result-actions').innerHTML = actions([
      ['play', t('play')], ['slow', t('slow')], ['copy', t('copy')], ['save-sentence', saved ? t('remove') : t('save')]
    ]).replace(/^<div class="actions">|<\/div>$/g, '');

    $('formulas-item').hidden = !r.maths.length;
    $('formulas').innerHTML = r.maths.map(function (a) {
      return '<li><span class="formula">' + a.html + '</span><span class="spoken">“' + esc(a.speech) + '”</span>' +
        actions([['say', t('play'), a.speech], ['say-slow', t('slow'), a.speech]]) + '</li>';
    }).join('');

    var terms = r.terms.map(function (k) { return BY_KEY[k]; }).filter(Boolean);
    $('terms-item').hidden = !terms.length;
    $('terms').innerHTML = terms.map(termCard).join('');
  }

  var EXAMPLES = [
    'Giải phương trình x^2 - 5x + 6 = 0.',
    'Tìm tập xác định của hàm số y = sqrt(x - 1).',
    'Cho tam giác ABC vuông tại A có AB = 3 cm, AC = 4 cm. Tính độ dài cạnh huyền BC.',
    'Hàm số y = x^3 - 3x + 2 đồng biến trên khoảng nào?',
    'Tính đạo hàm của hàm số f(x) = sin(2x) + ln x.',
    'Tìm tiệm cận đứng và tiệm cận ngang của đồ thị hàm số y = (2x + 1)/(x - 1).'
  ];
  $('examples').innerHTML = EXAMPLES.map(function (e, i) {
    return '<button type="button" class="link" data-act="example" data-arg="' + i + '">' + (i + 1) + '</button>';
  }).join('');

  /* ---------------------------------------------------------- history */
  function addHistory(r) {
    var h = store.get('history', []).filter(function (x) { return x.vi !== r.vi; });
    h.unshift(r);
    store.set('history', h.slice(0, 30));
    renderHistory();
  }
  function sentenceRow(r, i, kind) {
    return '<div class="item"><div class="item-meta">' + new Date(r.time).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US') + '</div>' +
      '<div class="item-content"><p class="row-en">' + r.en.html + '</p><p class="row-vi">' + esc(r.vi) + '</p>' +
      actions([['open-' + kind, lang === 'vi' ? 'Mở' : 'Open', i], ['say', t('play'), r.en.speech]].concat(
        kind === 'saved' ? [['unsave-sentence', t('remove'), i]] : [])) + '</div></div>';
  }
  function renderHistory() {
    var h = store.get('history', []);
    $('history').innerHTML = h.length ? h.map(function (r, i) { return sentenceRow(r, i, 'history'); }).join('')
      : '<p class="empty">' + esc(t('noHistory')) + '</p>';
    $('clear-history').hidden = !h.length;
  }

  /* ------------------------------------------------------------ saved */
  // Saved words: [{ k: term key, g: grade or null, t: topic id or null }],
  // newest first. One word may be saved under several places: a grade · topic,
  // or a custom set (g null, t 'set:<id>'; sets live in mathen.sets as
  // [{ id, name }]). Older saves were plain keys; they show up as "unsorted".
  function savedWords() {
    return store.get('words', []).map(function (x) { return typeof x === 'string' ? { k: x, g: null, t: null } : x; });
  }
  function customSets() { return store.get('sets', []); }
  function findSet(id) { return customSets().find(function (s) { return s.id === id; }); }
  function isSetId(tp) { return /^set:/.test(tp || ''); }
  function placeId(g, tp) { return (g || '') + '|' + (tp || ''); }
  function parsePlace(id) { var p = id.split('|'); return { g: +p[0] || null, t: p[1] || null }; }
  function samePlace(x, g, tp) { return (x.g || null) === (g || null) && (x.t || null) === (tp || null); }
  function placeLabel(g, tp) {
    if (isSetId(tp)) { var s = findSet(tp); return s ? s.name : t('unsorted'); }
    return g && TOPIC[tp] ? t('grade') + ' ' + g + ' · ' + topicName(TOPIC[tp]) : t('unsorted');
  }
  function createSet(name) {
    var sets = customSets(), low = name.toLowerCase();
    var s = sets.find(function (x) { return x.name.toLowerCase() === low; });   // same name → reuse it
    if (!s) { s = { id: 'set:' + Date.now().toString(36), name: name }; sets.push(s); store.set('sets', sets); }
    return s;
  }
  function deleteSet(id) {
    store.set('sets', customSets().filter(function (s) { return s.id !== id; }));
    store.set('words', savedWords().filter(function (x) { return x.t !== id; }));
  }
  function isSavedWord(k) { return savedWords().some(function (x) { return x.k === k; }); }
  function saveLabel(k) { return (isSavedWord(k) ? t('saved') : t('save')) + ' ▾'; }
  function addWord(k, g, tp) {
    var w = savedWords().filter(function (x) { return !(x.k === k && samePlace(x, g, tp)); });
    w.unshift({ k: k, g: g, t: tp });
    store.set('words', w);
  }
  function removeWord(k, g, tp) {
    store.set('words', savedWords().filter(function (x) { return !(x.k === k && samePlace(x, g, tp)); }));
  }
  function savedKeys() {
    var seen = {};
    return savedWords().map(function (x) { return x.k; })
      .filter(function (k) { return BY_KEY[k] && (seen[k] ? false : (seen[k] = true)); });
  }
  function isSavedSentence(vi) { return store.get('sentences', []).some(function (s) { return s.vi === vi; }); }
  function toggleSentence(r) {
    var s = store.get('sentences', []), i = s.findIndex(function (x) { return x.vi === r.vi; });
    if (i >= 0) s.splice(i, 1); else s.unshift(r);
    store.set('sentences', s);
  }

  // entry: the saved-word entry when shown in the Saved tab (adds "Unsave" for that place)
  function vocabRow(v, entry) {
    var exVi = M.inline(v.exVi, { vn: true }), exEn = M.inline(v.exEn);
    return '<div class="item"><div class="item-meta">' + esc(v.vi) +
      '<span class="venue">' + esc(topicName(v.topic) + ' · ' + v.topic.grades) + '</span></div>' +
      '<div class="item-content"><h3 class="pub-title">' + esc(v.en) + ' <span class="ipa">' + esc(v.ipa) + '</span></h3>' +
      '<p class="example"><span class="ex-en">' + exEn.html + '</span><span class="ex-vi">' + exVi.html + '</span></p>' +
      actions([['say', t('play'), v.en], ['say-slow', t('slow'), v.en], ['say', lang === 'vi' ? 'Nghe ví dụ' : 'Example', exEn.speech],
        ['save-word', saveLabel(v.key), v.key]].concat(
        entry ? [['unsave-word', t('remove'), v.key + '|' + placeId(entry.g, entry.t)]] : [])) + '</div></div>';
  }

  // Saved words grouped by place: grade · topic (by grade, then topic order),
  // then custom sets (in creation order), then unsorted / unknown places.
  function savedGroups() {
    var groups = [], sets = customSets();
    savedWords().forEach(function (x) {
      if (!BY_KEY[x.k]) return;
      var si = isSetId(x.t) ? sets.findIndex(function (s) { return s.id === x.t; }) : -1;
      var topicPlace = !!(x.g && TOPIC[x.t]), known = topicPlace || si >= 0, id = known ? placeId(x.g, x.t) : '';
      var gr = groups.find(function (y) { return y.id === id; });
      if (!gr) groups.push(gr = {
        id: id, set: si >= 0 ? x.t : null, label: placeLabel(x.g, x.t), items: [],
        rank: topicPlace ? x.g : si >= 0 ? 50 : 99, order: topicPlace ? TOPIC_ORDER[x.t] : Math.max(si, 0)
      });
      gr.items.push(x);
    });
    return groups.sort(function (a, b) { return a.rank - b.rank || a.order - b.order; });
  }

  function renderSaved() {
    var s = store.get('sentences', []);
    $('saved-sentences').innerHTML = s.length ? s.map(function (r, i) { return sentenceRow(r, i, 'saved'); }).join('')
      : '<p class="empty">' + esc(t('noSaved')) + '</p>';
    var groups = savedGroups();
    $('saved-words').innerHTML = groups.length ? groups.map(function (gr) {
      return '<h3 class="group-title">' + esc(gr.label) + ' <span class="count">' + gr.items.length + ' ' + esc(t('terms')) + '</span>' +
        (gr.set ? '<button type="button" class="link" data-act="delete-set" data-arg="' + esc(gr.set) + '">' + esc(t('deleteSet')) + '</button>' : '') +
        '</h3>' + gr.items.map(function (x) { return vocabRow(BY_KEY[x.k], x); }).join('');
    }).join('') : '<p class="empty">' + esc(t('noSaved')) + '</p>';
    buildDeck(false);
  }

  /* -------------------------------------------------------- save menu */
  // "Save ▾" opens this menu: save the word under a grade → topic, or in one
  // click under a starred grade · topic, or remove it from a place.
  var menu = document.createElement('div');
  menu.className = 'save-menu';
  menu.setAttribute('role', 'dialog');
  menu.hidden = true;
  document.body.appendChild(menu);
  var menuWord = null, menuAnchor = null, menuPick = null, menuNewSet = false;

  function sortedStars() {
    return store.get('stars', []).filter(function (id) { var p = parsePlace(id); return p.g && TOPIC[p.t]; })
      .sort(function (a, b) { var p = parsePlace(a), q = parsePlace(b); return p.g - q.g || TOPIC_ORDER[p.t] - TOPIC_ORDER[q.t]; });
  }
  function openMenu(btn, k) {
    var v = BY_KEY[k];
    if (!v) return;
    closeMenu();
    // default: the word's own topic, in the last grade used if it fits
    var r = gradeRange(v.topic), last = store.get('lastGrade', null);
    menuWord = k; menuAnchor = btn; menuNewSet = false;
    menuPick = { g: last >= r[0] && last <= r[1] ? last : r[0], t: v.topic.id };
    renderMenu();
    menu.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    var a = btn.getBoundingClientRect(), maxLeft = document.documentElement.clientWidth - menu.offsetWidth - 16;
    menu.style.left = Math.max(16, Math.min(a.left, maxLeft)) + window.scrollX + 'px';
    menu.style.top = a.bottom + 6 + window.scrollY + 'px';
  }
  function closeMenu() {
    if (menuAnchor) menuAnchor.setAttribute('aria-expanded', 'false');
    menu.hidden = true; menuWord = menuAnchor = null;
  }
  function renderMenu() {
    var v = BY_KEY[menuWord], here = savedWords().filter(function (x) { return x.k === menuWord; });
    var stars = sortedStars(), pick = placeId(menuPick.g, menuPick.t), starred = stars.indexOf(pick) >= 0;
    function isHere(g, tp) { return here.some(function (x) { return samePlace(x, g, tp); }); }
    function sec(title, body) { return '<div class="menu-sec">' + esc(title) + '</div>' + body; }
    var html = '<div class="menu-term">' + esc(v.en) + ' <span class="ipa">' + esc(v.vi) + '</span></div>';
    if (here.length) html += sec(t('savedIn'), '<ul class="menu-list">' + here.map(function (x) {
      return '<li><span>' + esc(placeLabel(x.g, x.t)) + '</span><button type="button" class="link" data-act="menu-unsave" data-arg="' +
        esc(placeId(x.g, x.t)) + '">' + esc(t('remove')) + '</button></li>';
    }).join('') + '</ul>');
    html += sec('★ ' + t('starred'), stars.length ? '<div class="menu-stars">' + stars.map(function (id) {
      var p = parsePlace(id);
      return '<button type="button" class="link" data-act="menu-save" data-arg="' + esc(id) + '" aria-pressed="' + isHere(p.g, p.t) + '">' +
        esc(placeLabel(p.g, p.t)) + '</button>';
    }).join('') + '</div>' : '<p class="menu-hint">' + esc(t('starHint')) + '</p>');
    var setButtons = customSets().map(function (s) {
      return '<button type="button" class="link" data-act="menu-save" data-arg="' + esc(placeId(null, s.id)) + '" aria-pressed="' + isHere(null, s.id) + '">' +
        esc(s.name) + '</button>';
    }).join('') + (menuNewSet ? '' : '<button type="button" class="link add" data-act="menu-new-set">' + esc(t('newSet')) + '</button>');
    html += sec(t('mySets'), (setButtons ? '<div class="menu-stars">' + setButtons + '</div>' : '') +
      (menuNewSet ? '<div class="menu-new"><input type="text" id="menu-set-name" maxlength="60" autocomplete="off" placeholder="' + esc(t('setNamePh')) + '">' +
        '<button type="button" class="btn" data-act="menu-create-set">' + esc(t('createSet')) + '</button></div>' : ''));
    html += sec(t('saveTo'), '<div class="menu-pick">' +
      '<select id="menu-grade" aria-label="' + esc(t('grade')) + '">' + GRADES.map(function (g) {
        return '<option value="' + g + '"' + (g === menuPick.g ? ' selected' : '') + '>' + esc(t('grade') + ' ' + g) + '</option>';
      }).join('') + '</select>' +
      '<select id="menu-topic" aria-label="' + esc(t('topic')) + '">' + topicsFor(menuPick.g).map(function (tp) {
        return '<option value="' + esc(tp.id) + '"' + (tp.id === menuPick.t ? ' selected' : '') + '>' + esc(topicName(tp)) + '</option>';
      }).join('') + '</select>' +
      '<button type="button" class="star" data-act="menu-star" aria-pressed="' + starred + '" aria-label="' + esc(t(starred ? 'unstar' : 'star')) +
        '" title="' + esc(t(starred ? 'unstar' : 'star')) + '">' + (starred ? '★' : '☆') + '</button></div>' +
      '<button type="button" class="btn" data-act="menu-save" data-arg="' + esc(pick) + '"' + (isHere(menuPick.g, menuPick.t) ? ' disabled' : '') + '>' +
        esc(isHere(menuPick.g, menuPick.t) ? t('saved') : t('save')) + '</button>');
    menu.innerHTML = html;
  }
  menu.addEventListener('change', function (e) {
    var id = e.target.id;
    if (id === 'menu-grade') {
      menuPick.g = +e.target.value;
      var list = topicsFor(menuPick.g);
      if (!list.some(function (tp) { return tp.id === menuPick.t; })) menuPick.t = list[0].id;
    } else if (id === 'menu-topic') menuPick.t = e.target.value;
    else return;
    renderMenu();
    $(id).focus();
  });
  function wordsChanged() {
    document.querySelectorAll('[data-act="save-word"]').forEach(function (b) { b.textContent = saveLabel(b.dataset.arg); });
    renderSaved();
  }
  function createSetFromMenu() {
    var name = $('menu-set-name').value.replace(/\s+/g, ' ').trim();
    if (!name) { $('menu-set-name').focus(); return; }
    addWord(menuWord, null, createSet(name).id);
    closeMenu(); wordsChanged();
  }
  menu.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.id === 'menu-set-name') { e.preventDefault(); createSetFromMenu(); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !menu.hidden) { var a = menuAnchor; closeMenu(); if (a && a.isConnected) a.focus(); }
  });
  // width only: phones fire resize when the address bar hides while scrolling
  var lastWidth = window.innerWidth;
  window.addEventListener('resize', function () {
    if (window.innerWidth !== lastWidth) { lastWidth = window.innerWidth; closeMenu(); }
  });

  /* ------------------------------------------------------- vocabulary */
  var topic = 'all';
  function renderTopics() {
    function btn(id, label) {
      return '<button type="button" class="link" data-act="topic" data-arg="' + id + '" aria-pressed="' + (id === topic) + '">' + esc(label) + '</button>';
    }
    var groups = [];
    window.MATH_VOCAB.forEach(function (tp) {
      var g = groups.find(function (x) { return x.grades === tp.grades; });
      if (!g) groups.push(g = { grades: tp.grades, topics: [] });
      g.topics.push(tp);
    });
    function row(label, buttons) {
      return '<div class="topic-row"><span class="topic-grade">' + esc(label) + '</span><div class="topic-list">' + buttons + '</div></div>';
    }
    $('topics').innerHTML = row('', btn('all', t('allTopics'))) + groups.map(function (g) {
      return row(t('grades') + ' ' + g.grades, g.topics.map(function (tp) { return btn(tp.id, lang === 'vi' ? tp.vi : tp.en); }).join(''));
    }).join('');
  }
  function fold(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase(); }
  function renderVocab() {
    var q = fold($('vocab-search').value.trim());
    var list = VOCAB.filter(function (v) {
      if (topic !== 'all' && v.topic.id !== topic) return false;
      return !q || fold(v.vis.join(' ') + ' ' + v.en).indexOf(q) >= 0;
    });
    $('vocab-count').textContent = list.length + ' ' + t('terms');
    $('vocab-list').innerHTML = list.length ? list.map(function (v) { return vocabRow(v); }).join('') : '<p class="empty">' + esc(t('noResults')) + '</p>';
  }
  $('vocab-search').addEventListener('input', renderVocab);

  /* ------------------------------------------------------- flashcards */
  // Decks: 'saved' (all saved words), 'saved:<place id>' (one saved group or
  // custom set), 'vocab' (every term) or 'vocab:<topic id>'. The choice is kept
  // in mathen.deck; an empty or vanished deck falls back to saved, then vocab.
  var deck = [], card = 0, flipped = false;
  function deckList() {
    var saved = savedKeys().length, list = [];
    if (saved) {
      list.push({ id: 'saved', group: 'deckGroupSaved', label: t('deckSavedAll'), words: function () { return savedKeys().map(function (k) { return BY_KEY[k]; }); } });
      savedGroups().forEach(function (gr) {
        list.push({ id: 'saved:' + gr.id, group: 'deckGroupSaved', label: gr.label, words: function () {
          var seen = {};
          return gr.items.filter(function (x) { return seen[x.k] ? false : (seen[x.k] = true); }).map(function (x) { return BY_KEY[x.k]; });
        } });
      });
    }
    list.push({ id: 'vocab', group: 'deckGroupVocab', label: t('deckVocabAll'), words: function () { return VOCAB.slice(); } });
    window.MATH_VOCAB.forEach(function (tp) {
      list.push({ id: 'vocab:' + tp.id, group: 'deckGroupVocab', label: t('grades') + ' ' + tp.grades + ' · ' + topicName(tp), words: function () {
        return VOCAB.filter(function (v) { return v.topic === tp; });
      } });
    });
    return list;
  }
  function buildDeck(shuffle) {
    var list = deckList(), want = store.get('deck', null);
    var d = list.find(function (x) { return x.id === want; }) || list[0];
    deck = d.words();
    if (shuffle) for (var i = deck.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var x = deck[i]; deck[i] = deck[j]; deck[j] = x; }
    var html = '', group = null;
    list.forEach(function (x) {
      if (x.group !== group) { html += (group ? '</optgroup>' : '') + '<optgroup label="' + esc(t(x.group)) + '">'; group = x.group; }
      html += '<option value="' + esc(x.id) + '"' + (x === d ? ' selected' : '') + '>' + esc(x.label + ' (' + x.words().length + ')') + '</option>';
    });
    $('deck-select').innerHTML = html + '</optgroup>';
    $('deck-note').textContent = t('deckHint');
    $('deck-note').hidden = list[0].id === 'saved';
    card = Math.max(0, Math.min(card, deck.length - 1)); flipped = false;
    renderCard();
  }
  $('deck-select').addEventListener('change', function (e) {
    store.set('deck', e.target.value);
    card = 0; buildDeck(false);
  });
  function renderCard() {
    var v = deck[card];
    if (!v) return;
    $('card-count').textContent = (card + 1) + ' / ' + deck.length;
    $('card-front').textContent = v.vi;
    $('card-back').hidden = !flipped;
    $('card-back').innerHTML = '<span class="term-en">' + esc(v.en) + '</span> <span class="ipa">' + esc(v.ipa) + '</span>' +
      '<span class="ex-en">' + M.inline(v.exEn).html + '</span>';
    $('card-flip').textContent = t('flip');
  }

  /* ----------------------------------------------------------- backup */
  // Export: one JSON file with what the teacher made. Import merges it into
  // this browser (never deletes), so the same file can be imported twice.
  function showBackup(msg, bad) {
    var el = $('backup-status');
    el.textContent = msg; el.hidden = !msg; el.classList.toggle('bad', !!bad);
  }
  function exportBackup() {
    var data = {
      words: savedWords(), sets: customSets(), stars: store.get('stars', []),
      sentences: store.get('sentences', []), history: store.get('history', []),
      deck: store.get('deck', null), lastGrade: store.get('lastGrade', null)
    };
    var name = 'math-en-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    var url = URL.createObjectURL(new Blob([JSON.stringify({ app: 'math-en', version: 1, exported: new Date().toISOString(), data: data }, null, 1)],
      { type: 'application/json' }));
    var a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    showBackup(t('exported').replace('%s', name));
  }
  function importBackup(text) {
    var file = JSON.parse(text), d = file && file.app === 'math-en' && file.data;
    if (!d || typeof d !== 'object') throw new Error('not a backup');
    function list(x) { return Array.isArray(x) ? x : []; }
    var added = { w: 0, s: 0, c: 0 };
    // sets: same id → same set; same name → reuse the set already here
    var sets = customSets(), setMap = {};
    list(d.sets).forEach(function (s) {
      if (!s || typeof s.id !== 'string' || !isSetId(s.id) || typeof s.name !== 'string') return;
      var low = s.name.toLowerCase();
      var mine = sets.find(function (x) { return x.id === s.id; }) || sets.find(function (x) { return x.name.toLowerCase() === low; });
      if (!mine) { mine = { id: s.id, name: s.name }; sets.push(mine); added.s++; }
      setMap[s.id] = mine.id;
    });
    store.set('sets', sets);
    var words = savedWords();
    list(d.words).forEach(function (x) {
      if (typeof x === 'string') x = { k: x, g: null, t: null };
      if (!x || typeof x.k !== 'string') return;
      var g = +x.g || null, tp = typeof x.t === 'string' ? (setMap[x.t] || x.t) : null;
      if (isSetId(tp) && !sets.some(function (s) { return s.id === tp; })) return;
      if (words.some(function (y) { return y.k === x.k && samePlace(y, g, tp); })) return;
      words.push({ k: x.k, g: g, t: tp }); added.w++;
    });
    store.set('words', words);
    var stars = store.get('stars', []);
    list(d.stars).forEach(function (id) { if (typeof id === 'string' && stars.indexOf(id) < 0) stars.push(id); });
    store.set('stars', stars);
    function mergeSentences(key, max) {
      var have = store.get(key, []), n = 0;
      list(d[key]).forEach(function (r) {
        if (!r || typeof r.vi !== 'string' || !r.en || have.some(function (x) { return x.vi === r.vi; })) return;
        have.push(r); n++;
      });
      have.sort(function (a, b) { return (b.time || 0) - (a.time || 0); });
      store.set(key, max ? have.slice(0, max) : have);
      return n;
    }
    added.c = mergeSentences('sentences');
    mergeSentences('history', 30);
    if (!store.get('deck', null) && typeof d.deck === 'string') {
      store.set('deck', d.deck.replace(/set:[\w-]+$/, function (id) { return setMap[id] || id; }));
    }
    if (!store.get('lastGrade', null) && +d.lastGrade) store.set('lastGrade', +d.lastGrade);
    return added;
  }
  $('import-file').addEventListener('change', function (e) {
    var f = e.target.files[0];
    e.target.value = '';   // so choosing the same file again still fires
    if (!f) return;
    f.text().then(function (text) {
      var a = importBackup(text);
      wordsChanged(); renderHistory();
      if (current) renderResult(current);
      showBackup(t('imported').replace('%w', a.w).replace('%s', a.s).replace('%c', a.c));
    }).catch(function () { showBackup(t('importBad'), true); });
  });

  /* ------------------------------------------------------------- sync */
  // Optional cross-device sync: an Apps Script web app (sync/Code.gs) keeps
  // one JSON copy of SYNCED. localStorage stays the working copy; syncing
  // is a three-way merge of this device (mine), the server (theirs) and the
  // copy both had at the last sync (mathen.syncBase), so a deletion on one
  // device is a deletion everywhere, and edits on both sides are kept.
  // Writes are compare-and-swap on the server's revision number.
  var SYNC_URL = (window.MATH_EN && window.MATH_EN.syncUrl) || '';
  var SYNC_KEY = (window.MATH_EN && window.MATH_EN.syncKey) || '';
  if (/^%%/.test(SYNC_URL) || /^%%/.test(SYNC_KEY)) SYNC_URL = SYNC_KEY = '';
  var SYNC = !!(SYNC_URL && SYNC_KEY);
  var SYNCED = ['words', 'sets', 'stars', 'sentences', 'history', 'deck', 'lastGrade', 'cache'];
  var syncState = { s: 'idle', at: 0 }, syncBusy = false, syncAgain = false, syncTimer = null, syncApplying = false;

  function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  function syncData() {
    var d = {};
    SYNCED.forEach(function (k) { d[k] = k === 'words' ? savedWords() : store.get(k, null); });
    return d;
  }
  // Merge keyed lists. Changed or added here → ours; deleted on either side
  // (and not changed here) → gone; otherwise theirs. Items new on the other
  // device go first (lists are newest first).
  function merge3(base, mine, theirs, keyOf) {
    function index(a) { var m = {}; (a || []).forEach(function (x) { m[keyOf(x)] = x; }); return m; }
    var b = index(base), l = index(mine), r = index(theirs), news = [], out = [];
    (mine || []).forEach(function (x) {
      var k = keyOf(x);
      if (!(k in b) || !same(x, b[k])) out.push(x);
      else if (k in r) out.push(r[k]);
    });
    (theirs || []).forEach(function (x) { var k = keyOf(x); if (!(k in l) && !(k in b)) news.push(x); });
    return news.concat(out);
  }
  function byTime(a) { return a.sort(function (x, y) { return (y.time || 0) - (x.time || 0); }); }
  function mergeAll(base, mine, theirs) {
    base = base || {}; theirs = theirs || {};
    function list(k, keyOf) { return merge3(base[k], mine[k], theirs[k], keyOf); }
    function value(k) { return k in theirs && (mine[k] == null || same(mine[k], base[k])) ? theirs[k] : mine[k]; }
    // the translation cache is an object, oldest first; keep the newest 300
    function entries(o) { return Object.keys(o || {}).map(function (k) { return [k, o[k]]; }); }
    var mineCache = mine.cache || {}, cache = {};
    var ce = merge3(entries(base.cache), entries(mineCache), entries(theirs.cache), function (e) { return e[0]; });
    ce = ce.filter(function (e) { return e[0] in mineCache; }).concat(ce.filter(function (e) { return !(e[0] in mineCache); }));
    ce.slice(-300).forEach(function (e) { cache[e[0]] = e[1]; });
    return {
      words: list('words', function (x) { return typeof x === 'string' ? x + '||' : x.k + '|' + (x.g || '') + '|' + (x.t || ''); }),
      sets: list('sets', function (x) { return x.id; }),
      stars: list('stars', String),
      sentences: byTime(list('sentences', function (r) { return r.vi; })),
      history: byTime(list('history', function (r) { return r.vi; })).slice(0, 30),
      deck: value('deck'), lastGrade: value('lastGrade'),
      cache: cache
    };
  }
  function syncPost(body) {
    body.key = SYNC_KEY;
    // text/plain keeps it a "simple" request: no CORS preflight, which Apps Script can't answer
    return fetch(SYNC_URL, { method: 'POST', body: JSON.stringify(body) })
      .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
      .then(function (j) { if (j.error) throw new Error(j.error); return j; });
  }
  // write the merged copy here without starting another sync, then redraw
  function applySynced(merged, mine) {
    var changed = SYNCED.filter(function (k) { return !same(merged[k], mine[k]); });
    if (!changed.length) return;
    syncApplying = true;
    changed.forEach(function (k) { store.set(k, merged[k]); });
    syncApplying = false;
    if (changed.indexOf('cache') >= 0) {
      Object.keys(cache).forEach(function (k) { delete cache[k]; });
      Object.keys(merged.cache).forEach(function (k) { cache[k] = merged.cache[k]; });
    }
    wordsChanged(); renderHistory();
    if (current) renderResult(current);
    if (!menu.hidden) renderMenu();
  }
  // remote: the server's { rev, data } when known (pull, or a rejected write);
  // without it, try to write straight on top of the revision we last saw.
  function syncRound(remote, tries) {
    var mine = syncData(), merged = mine, rev = store.get('syncRev', 0);
    if (remote) {
      merged = mergeAll(store.get('syncBase', null), mine, remote.data);
      rev = remote.rev;
      applySynced(merged, mine);
      if (remote.data && same(merged, mergeAll(null, remote.data, {}))) return done(rev);
    }
    return syncPost({ action: 'put', rev: rev, data: merged }).then(function (res) {
      if (!res.conflict) return done(res.rev);
      if (tries > 4) throw new Error('conflict');
      return syncRound(res, tries + 1);
    });
    function done(r) { store.set('syncBase', merged); store.set('syncRev', r); }
  }
  function syncNow(pull) {
    if (!SYNC) return;
    clearTimeout(syncTimer); syncTimer = null;
    if (syncBusy) { syncAgain = true; return; }
    syncBusy = true; setSync('busy');
    var job = pull || !store.get('syncBase', null)
      ? syncPost({ action: 'get' }).then(function (res) { return syncRound(res, 0); })
      : syncRound(null, 0);
    job.then(function () { setSync('ok'); }, function (e) { setSync(/forbidden/.test(e && e.message) ? 'denied' : 'off'); })
      .then(function () {
        syncBusy = false;
        if (syncAgain) { syncAgain = false; syncNow(); }
      });
  }
  function setSync(s) {
    syncState = { s: s, at: s === 'ok' ? Date.now() : syncState.at };
    renderSync();
  }
  function renderSync() {
    if (!SYNC) return;
    $('sync-row').hidden = false;
    $('backup-title').dataset.i18n = 'backupSync';
    $('backup-title').textContent = t('backupSync');
    $('backup-note').dataset.i18n = 'backupNoteSync';
    $('backup-note').textContent = t('backupNoteSync');
    var el = $('sync-status'), s = syncState.s;
    el.textContent = s === 'busy' ? t('syncBusy') : s === 'off' ? t('syncOff') : s === 'denied' ? t('syncDenied')
      : s === 'ok' ? t('syncOk').replace('%s', new Date(syncState.at).toLocaleTimeString(lang === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' }))
      : '';
    el.classList.toggle('bad', s === 'off' || s === 'denied');
  }
  if (SYNC) {
    store.changed = function (k) {
      if (syncApplying || SYNCED.indexOf(k) < 0) return;
      clearTimeout(syncTimer);
      syncTimer = setTimeout(syncNow, 1500);
    };
    // pull when the page comes back into view; push right away when it is hidden
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') { if (syncTimer) syncNow(); }
      else if (Date.now() - syncState.at > 20000) syncNow(true);
    });
    window.addEventListener('online', function () { syncNow(true); });
  }

  /* ----------------------------------------------------------- events */
  function flash(btn, label) {
    var old = btn.textContent; btn.textContent = label;
    setTimeout(function () { btn.textContent = old; }, 1200);
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]');
    if (!menu.hidden && !menu.contains(e.target) && !(b && b.dataset.act === 'save-word')) closeMenu();
    if (!b) return;
    var act = b.dataset.act, arg = b.dataset.arg, p;
    switch (act) {
      case 'play': speak(current.en.speech); break;
      case 'slow': speak(current.en.speech, true); break;
      case 'say': speak(arg); break;
      case 'say-slow': speak(arg, true); break;
      case 'copy':
        navigator.clipboard.writeText(current.en.plain).then(function () { flash(b, t('copied')); });
        break;
      case 'save-sentence': toggleSentence(current); renderResult(current); renderSaved(); break;
      case 'save-word':
        if (menuAnchor === b) closeMenu(); else openMenu(b, arg);
        break;
      case 'menu-save':
        p = parsePlace(arg);
        addWord(menuWord, p.g, p.t);
        if (p.g) store.set('lastGrade', p.g);
        closeMenu(); wordsChanged();
        break;
      case 'menu-new-set': menuNewSet = true; renderMenu(); $('menu-set-name').focus(); break;
      case 'menu-create-set': createSetFromMenu(); break;
      case 'delete-set':
        var set = findSet(arg);
        if (set && confirm(t('confirmDeleteSet').replace('%s', set.name))) { deleteSet(arg); wordsChanged(); }
        break;
      case 'menu-unsave':
        p = parsePlace(arg);
        removeWord(menuWord, p.g, p.t);
        wordsChanged(); renderMenu();
        break;
      case 'menu-star':
        var stars = store.get('stars', []), id = placeId(menuPick.g, menuPick.t), i = stars.indexOf(id);
        if (i >= 0) stars.splice(i, 1); else stars.push(id);
        store.set('stars', stars);
        renderMenu();
        break;
      case 'unsave-word':
        var k = arg.split('|')[0];
        p = parsePlace(arg.slice(k.length + 1));
        removeWord(k, p.g, p.t);
        wordsChanged();
        break;
      case 'unsave-sentence':
        toggleSentence(store.get('sentences', [])[+arg]); renderSaved();
        if (current) renderResult(current);
        break;
      case 'open-history':
      case 'open-saved':
        current = store.get(act === 'open-saved' ? 'sentences' : 'history', [])[+arg];
        $('input').value = current.vi;
        showTab('translate'); renderResult(current); window.scrollTo(0, 0);
        break;
      case 'example': $('input').value = EXAMPLES[+arg]; translate(); break;
      case 'topic': topic = arg; renderTopics(); renderVocab(); break;
      case 'tab': e.preventDefault(); showTab(arg); break;
      case 'lang': lang = arg; store.set('lang', lang); applyLang(); break;
      case 'clear-history': store.set('history', []); renderHistory(); break;
      case 'export': exportBackup(); break;
      case 'import': showBackup(''); $('import-file').click(); break;
      case 'sync': syncNow(true); break;
      case 'card-flip':
        flipped = !flipped; renderCard();
        if (flipped) speak(deck[card].en);
        break;
      case 'card-next': card = (card + 1) % deck.length; flipped = false; renderCard(); break;
      case 'card-prev': card = (card - 1 + deck.length) % deck.length; flipped = false; renderCard(); break;
      case 'card-shuffle': card = 0; buildDeck(true); break;
    }
  });

  $('btn-translate').addEventListener('click', translate);
  $('input').addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); translate(); }
  });
  $('opt-glossary').checked = store.get('glossary', true);
  $('opt-glossary').addEventListener('change', function (e) { store.set('glossary', e.target.checked); });

  /* ------------------------------------------------------------- tabs */
  function showTab(name) {
    ['translate', 'vocab', 'saved'].forEach(function (n) {
      $('tab-' + n).hidden = n !== name;
      document.querySelector('[data-arg="' + n + '"][data-act="tab"]').setAttribute('aria-current', n === name ? 'page' : 'false');
    });
    if (location.hash !== '#' + name) history.replaceState(null, '', '#' + name);
  }

  applyLang();
  showTab(/^#(vocab|saved)$/.test(location.hash) ? location.hash.slice(1) : 'translate');
  syncNow(true);
})();
