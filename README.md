# Math in English · Tiếng Anh Toán học

A small, password-protected web app for a Vietnamese high-school math teacher.
The teacher types a math sentence in Vietnamese and gets:

- an **English translation**, with formulas kept intact and shown in US notation;
- **American English audio**: a natural Google neural voice, plus a slow mode;
- a **"how to read the formula"** line, e.g. `x^2 - 5x + 6 = 0` → "x squared minus 5 x plus 6 equals 0";
- the **math vocabulary** found in the sentence, with IPA and audio.

It also has a **vocabulary browser**: 346 terms, grades 6–12 of the Vietnamese
GDPT 2018 curriculum, each with an example sentence in both languages. There
are also **flashcards**, **saved items**, and **history**. The UI is
Vietnamese by default, with a VI / EN switch. The visual style copies the
owner's homepage (dotandung.github.io): minimalist, Inter, black rules,
underlined links, and a light/dark toggle.

Live URL (once published): **https://dotandung.github.io/math-en/**

---

## How it works

```
Browser (teacher) ──password──▶ StatiCrypt decrypts docs/index.html in the page
        │
        ├─ docs/math.js   finds formulas in the Vietnamese text, rewrites them in US style,
        │                 renders HTML (sup/sub/√/≤), produces spoken English
        ├─ docs/app.js    UI, Google calls, glossary, speech, localStorage
        ├─ docs/vocab.js  vocabulary data (also the glossary)
        │
        ├──▶ Google Cloud Translation v2   (format=html; formulas and glossary terms
        │                                   are wrapped in <span class="notranslate">)
        └──▶ Google Cloud Text-to-Speech   (en-US Neural2 voices; SSML pauses for slow mode)
             fallback: the browser's speechSynthesis en-US voices
```

- **No server, no build framework.** Plain HTML, CSS, and JS, hosted on GitHub Pages from `docs/`.
- **Password protection** comes from [StatiCrypt](https://github.com/robinmoisson/staticrypt).
  The page (including the API key) is AES-encrypted. The password decrypts it
  in the browser. "Remember me" keeps the teacher logged in for 30 days.
- **The API key** lives only in `.env` (git-ignored) and inside the encrypted
  `docs/index.html`. Google also restricts it by website (HTTP referrer) and
  by API (see setup).
- **Teacher data** (history, saved sentences and words, language, voice, translation cache)
  is stored in `localStorage` under `mathen.*` on the teacher's device only. The theme key
  `theme` is shared with the homepage on purpose.
- **Saving a word** opens a menu (built in `app.js`): pick grade (6–12) → topic, or a starred
  grade · topic in one click. `mathen.words` is `[{k, g, t}]` (term key, grade, topic id; one word
  may be saved in several places), `mathen.stars` is `["7|numbers", …]`. Old saves (plain keys) show
  as "unsorted". The Saved tab groups words by grade · topic.
- **Custom sets**: "+ New set" in the save menu creates a named set (`mathen.sets` = `[{id, name}]`;
  a word in a set is saved as `{k, g: null, t: 'set:<id>'}`). Sets can be deleted from the Saved tab.
- **Flashcard decks**: the "Review" picker offers all saved words, each saved group or set, all
  vocabulary, or one topic. The choice is kept in `mathen.deck`.
- **Backup** (bottom of the Saved tab): Export downloads `math-en-backup-<date>.json`
  (`{app: 'math-en', version: 1, data: {words, sets, stars, sentences, history, deck, lastGrade}}`).
  Import merges, never deletes: duplicates are skipped and a set with the same name is reused.
  Safari deletes site data after 7 days without a visit, so Safari users should export now and then.
- **Sync** (optional, on when `SYNC_URL` and `SYNC_KEY` are set): an Apps Script web app
  (`sync/Code.gs`, running as the owner) keeps one JSON copy of words, sets, stars, sentences,
  history, deck, last grade and the translation cache in the owner's Drive (`math-en-sync.json`).
  No Google sign-in: the shared key is inside the encrypted page, like the API key. localStorage
  stays the working copy. The page pulls on load and when the tab comes back into view, and pushes
  1.5 s after a change. Merging is three-way (this device, the server, and the copy both had at the
  last sync, `mathen.syncBase`), so deletions spread too. Writes are compare-and-swap on the server's
  revision (`mathen.syncRev`). Everyone with the password shares one copy. Audio, voice and language stay per device.

## Files

```
src/index.template.html  page markup — EDIT THIS (has %%GOOGLE_API_KEY%% placeholder)
docs/index.html          GENERATED, encrypted — never edit by hand; commit it after building
docs/dev.html            GENERATED, unencrypted, contains the key — git-ignored, local only
docs/app.js              app logic (i18n strings at the top: STR.vi / STR.en)
docs/math.js             formula detection / normalization / HTML / speech (pure, testable in node)
docs/vocab.js            vocabulary topics and terms
docs/style.css           styles (tokens copied from the homepage)
build.sh                 builds docs/index.html (encrypted) or docs/dev.html (--dev)
sync/Code.gs             Apps Script sync backend: paste into script.google.com (no secrets in it)
.env                     GOOGLE_API_KEY, STATICRYPT_PASSWORD, SYNC_URL, SYNC_KEY — git-ignored, never commit
.env.example             blank template — must stay blank
.staticrypt.json         StatiCrypt salt — commit it; changing it logs everyone out
tests/math.test.mjs      regression tests for math.js and vocab.js
```

## Setup

### 1. Google Cloud (one time)

1. <https://console.cloud.google.com/> → create or select a project.
2. Link a **billing account**. Google requires one even for the free tiers:
   Translation is free up to 500k characters a month, and Neural2 voices up to
   1M characters a month.
3. **APIs & Services → Library**: enable **Cloud Translation API** and **Cloud Text-to-Speech API**.
4. **APIs & Services → Credentials → Create credentials → API key**, then edit it:
   - *Application restrictions → Websites:* `https://dotandung.github.io/math-en/*`
     and `http://localhost:8000/*`.
   - *API restrictions:* **Cloud Translation API** and **Cloud Text-to-Speech API**.
5. Safety net: under **Billing → Budgets & alerts**, set a small budget (e.g. $1)
   with email alerts.

### 2. Local

```sh
cp .env.example .env          # fill in GOOGLE_API_KEY and STATICRYPT_PASSWORD (14+ chars recommended)
./build.sh --dev              # → docs/dev.html (no password)
python3 -m http.server 8000 -d docs
#   open http://localhost:8000/dev.html     (no password)
#   or   http://localhost:8000/              (password page, as the teacher sees it)
node --test tests/*.test.mjs  # math + vocab tests
```

Needs Node.js (for `npx staticrypt@3` and the tests) and Python 3 (only for the local server).

### 3. Sync between devices (optional)

1. Make a key: `openssl rand -hex 24`. Put it in `.env` as `SYNC_KEY=…`.
2. <https://script.google.com/> → **New project**, name it "math-en sync", and replace `Code.gs`
   with the contents of `sync/Code.gs`.
3. **Project Settings** (gear) → **Script properties** → add `SYNC_KEY` with the same value.
4. **Deploy → New deployment** → type **Web app** → *Execute as:* **Me**, *Who has access:* **Anyone**
   → Deploy. Authorize it: Google warns the app is unverified because it is your own script,
   so choose *Advanced → Go to math-en sync*. It asks for Drive access so it can keep its one file.
5. Copy the **Web app URL** (ends in `/exec`) into `.env` as `SYNC_URL=…`. Opening it in a browser
   should show `{"ok":true}`.
6. `./build.sh` (and `./build.sh --dev`), then commit and push. The Saved tab now shows
   "Đã đồng bộ lúc …".

To change `Code.gs` later, use **Deploy → Manage deployments → Edit → Version: New version**. That keeps
the URL; a *new deployment* gets a new URL. To change the key, update the script property and `.env`, then rebuild.
Leaving `SYNC_URL`/`SYNC_KEY` empty turns sync off.

### 4. Publish

1. Create a GitHub repo named **`math-en`** under the `dotandung` account. The
   name matters: GitHub Pages serves it at `dotandung.github.io/math-en/`,
   which matches the key restriction.
2. `./build.sh` → commit → push.
3. Repo **Settings → Pages → Deploy from a branch → `main` / `/docs`**.
4. Send the teacher the URL and the password.

To change the password, edit `.env`, run `./build.sh`, then commit and push.

---

## Maintenance guide (for agents and humans)

### Rules

- **Never commit secrets.** `.env` and `docs/dev.html` are git-ignored. Keep
  `.env.example` blank, and never put `SYNC_KEY` in `sync/Code.gs` (it goes in the script properties).
  Before committing, run `git diff --cached | grep -i "AIza"` and expect no output.
- **Edit `src/index.template.html`, never `docs/index.html`.** Run `./build.sh` after any template change.
  Changes to `docs/*.js` or `docs/style.css` don't need a rebuild (they are loaded as separate files),
  but run the tests.
- Keep it dependency-free: no bundler and no framework. External resources are
  Google Fonts and the two Google APIs only.
- Use Inter for all text (`--title` and `--mono` point to it): other fonts lack full
  Vietnamese diacritics. The API usage label in the header is a per-device estimate
  (`mathen.usage`, characters sent this month; cache hits not counted), because a browser key
  can't read Google's real usage figures.
- Keep the homepage look: reuse the tokens in `style.css`, keep the link
  buttons, and test dark mode and narrow screens (the mobile breakpoint is 850px).
- All UI text goes in `STR.vi` and `STR.en` in `app.js`. Vietnamese is the default.

### Adding vocabulary (`docs/vocab.js`)

Each term is `[vi, en, ipa, exampleVi, exampleEn, force]`:

- `vi` may list alternative spellings separated by `|` (e.g. `'định lí|định lý'`). The first one is
  shown and is the saved-item id, so **don't rename existing first spellings**; that loses saved items.
- `ipa` is **American** English, between slashes.
- Write formulas in examples inside backticks, in plain style (`` `x^2 + 1` ``). Use Vietnamese style
  (`;`, `2,5`) in the Vietnamese example and US style in the English one.
- `force = 1` puts the term in the **glossary**: the English term replaces Google's wording.
  Only force terms that Google gets wrong, and that are unambiguous
  as whole words. Short words that appear inside everyday phrases (e.g. `cung` in
  `cung cấp`) must not be forced.
- Each Vietnamese spelling may appear only once in the whole file (the tests check this).
- Topics have `grades: '6–9'` or `'10–12'`. The Vocabulary tab groups topics by this.
- Run `node --test tests/*.test.mjs` afterwards.

### Formula syntax (`docs/math.js`)

The teacher types: `^` power, `_` subscript, `sqrt(…)`, `|x|`, `f'(x)`, `<= >= !=`, `->`, `=>`,
`//` (parallel), `pi`, `inf`, `sin cos tan cot (tg cotg) log ln lim`, Greek letters, `(0; 2)`, `[1; +inf)`,
`2,5` (decimal), `1.000` (thousands), and `6 : 2` (division).

How a sentence is processed:

1. `segment()` splits the text into text and math runs. Words with Vietnamese
   diacritics are always text. Single Latin letters, uppercase point names
   (`ABC`), `Oxy`, function names, and letters attached to digits or operators
   are math.
2. `analyze()` normalizes to US style and returns `{plain, html, speech}`.
3. In `app.js`, `buildRequest()` sends math and forced glossary terms inside
   `notranslate` spans. `readResponse()` swaps them back, matching by span text.

If something is read aloud wrongly, add a failing case to `tests/math.test.mjs` first, then fix `say()`.

### Speech

- Default: Google TTS `en-US-Neural2-F`. The voice list is `GOOGLE_VOICES` in `app.js`.
  Slow mode uses `speakingRate 0.85` plus 400 ms SSML pauses at punctuation.
  Pausing between phrases sounds more natural than slowing every word.
- Audio plays through Web Audio, and the context is unlocked during the click,
  so iOS will play audio that arrives later.
  Decoded audio is cached in memory per text, voice, and speed. The MP3s are also kept across
  visits in IndexedDB (`mathen-audio`, newest 500 clips, oldest dropped), so a repeated word plays
  instantly with no request. If IndexedDB is unavailable (e.g. private mode) the page just fetches.
- If Google fails once (API disabled, quota, network), the page shows one
  message and uses the browser voice for the rest of the visit.

### Ideas not done yet

- Projector mode (very large output text) for class use.
- Teacher-editable glossary (could ride on the sync file).
- A "quiz" mode for vocabulary (multiple choice, listen-and-type).

### Known limitations

- The formula reader is rule-based. Unusual notation can come out stilted. Long `\frac`-like nesting
  isn't supported; `(a + b)/(c + d)` reads as "the quantity a plus b over the quantity c plus d".
- Forced glossary terms are sent to Google as English words inside a Vietnamese sentence. Usually
  Google builds a correct sentence around them, but grammar can occasionally suffer. The checkbox
  "Dùng thuật ngữ toán chuẩn" turns the glossary off.
- The StatiCrypt-encrypted file is public, so a short password can be brute-forced offline. Use 14+ characters.
