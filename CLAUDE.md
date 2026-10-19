# CLAUDE.md

Read README.md first — it explains the architecture, setup and the maintenance rules.

Essentials:
- Never commit `.env` or `docs/dev.html`, and never put the API key in any tracked file. `.env.example` stays blank.
- Edit `src/index.template.html`, then run `./build.sh`; never hand-edit `docs/index.html` (it is encrypted output).
- Run `node --test tests/*.test.mjs` after touching `docs/math.js` or `docs/vocab.js`.
- No dependencies, no bundler. UI text lives in `STR.vi` / `STR.en` in `docs/app.js`; Vietnamese is the default.
- Match the minimalist style in `docs/style.css` (same tokens as the owner's homepage); check dark mode and mobile.
- Local test: `./build.sh --dev && python3 -m http.server 8000 -d docs`, open http://localhost:8000/dev.html
