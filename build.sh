#!/usr/bin/env bash
# Build docs/index.html: put the Google API key (and the optional sync URL
# and key) into src/index.template.html and encrypt the page with StatiCrypt, so only someone with the password
# can open it (and see the key).
#
#   ./build.sh          encrypted page → docs/index.html (commit this)
#   ./build.sh --dev    plain page     → docs/dev.html   (git-ignored, local testing only)
#
# Needs .env (copy .env.example) and Node.js for npx.
set -euo pipefail

root="$(cd "$(dirname "$0")" && pwd)"
cd "$root"   # StatiCrypt wants relative paths

if [ ! -f .env ]; then
  echo "Missing .env — copy .env.example and fill it in." >&2
  exit 1
fi
set -a; . ./.env; set +a
: "${GOOGLE_API_KEY:?GOOGLE_API_KEY is empty in .env}"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
node -e '
  const fs = require("fs");
  const [src, dst] = process.argv.slice(1);
  const env = (k) => (process.env[k] || "").replace(/[\\\x27]/g, "");   // it lands inside a JS string
  fs.writeFileSync(dst, fs.readFileSync(src, "utf8")
    .replace("%%GOOGLE_API_KEY%%", env("GOOGLE_API_KEY"))
    .replace("%%SYNC_URL%%", env("SYNC_URL"))
    .replace("%%SYNC_KEY%%", env("SYNC_KEY")));
' src/index.template.html "$tmp/index.html"

if [ "${1:-}" = "--dev" ]; then
  cp "$tmp/index.html" docs/dev.html
  echo "Wrote docs/dev.html (unencrypted — never commit it)."
  echo "Test:  python3 -m http.server 8000 -d docs   then open http://localhost:8000/dev.html"
  exit 0
fi

: "${STATICRYPT_PASSWORD:?STATICRYPT_PASSWORD is empty in .env}"
export STATICRYPT_PASSWORD
npx -y staticrypt@3 "$tmp/index.html" \
  -d docs \
  -c .staticrypt.json \
  --short \
  --remember 30 \
  --template-title "Tiếng Anh Toán học" \
  --template-instructions "Nhập mật khẩu để vào trang. · Enter the password to continue." \
  --template-placeholder "Mật khẩu · Password" \
  --template-button "Vào · Enter" \
  --template-remember "Ghi nhớ 30 ngày · Remember me" \
  --template-error "Sai mật khẩu · Wrong password" \
  --template-color-primary "#111111" \
  --template-color-secondary "#f4f4f4" </dev/null
echo "Wrote docs/index.html (encrypted). Commit and push to publish."
