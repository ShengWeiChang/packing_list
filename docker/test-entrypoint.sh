#!/bin/sh
set -eu

if [ "$(id -u)" -ne 0 ]; then
  echo 'Container entrypoint needs root to prepare its isolated dependency volume.' >&2
  exit 1
fi
: "${HOST_UID:?HOST_UID is required}"
: "${HOST_GID:?HOST_GID is required}"
tar -C /source -cf /tmp/packing-list-source.tar \
  --exclude='./.git' --exclude='./node_modules' --exclude='./coverage' \
  --exclude='./test-inventory-reports' --exclude='./test-results' --exclude='./dist' \
  --exclude='./.container-test-artifacts' --exclude='./plans' --exclude='./learning' \
  --exclude='./.env' --exclude='./.env.*' --exclude='./playwright-report' \
  --exclude='./blob-report' --exclude='./.vite' --exclude='./.codex' --exclude='./.aws' .
tar -C /workspace -xf /tmp/packing-list-source.tar
rm /tmp/packing-list-source.tar
chown -R "$HOST_UID:$HOST_GID" /workspace
export HOME=/tmp/packing-list-home
mkdir -p "$HOME"
chown "$HOST_UID:$HOST_GID" "$HOME"

status=0
setpriv --reuid "$HOST_UID" --regid "$HOST_GID" --clear-groups /bin/sh -eu -c '
  mkdir -p /workspace/test-inventory-reports
  printf "Environment: %s, Node %s, npm %s\n" "$(uname -sm)" "$(node --version)" "$(npm --version)"
  case "$(node --version)" in v24.*) ;; *) echo "Node 24 is required" >&2; exit 1;; esac
  npm ci
  actual=$(node -p "require(\"@playwright/test/package.json\").version")
  if [ "$actual" != 1.58.2 ]; then
    echo "Playwright version $actual does not match image version 1.58.2" >&2
    exit 1
  fi
  arch=$(uname -m)
  case "$arch" in
    x86_64) manifest=sha256:65cefd09a5e943921ecd3a6e5414c603db2eb161e9eb48f2e2ccc63486dc7dc0 ;;
    aarch64) manifest=sha256:68f1c3dca663d0e8331e8af4681b0b315eca7de1bd7fa934aac0accbeb9f8323 ;;
    *) echo "Unsupported container architecture: $arch" >&2; exit 1 ;;
  esac
  node -e "const fs = require(\"node:fs\"); const p = require(\"playwright\"); for (const name of [\"chromium\", \"webkit\"]) { const path = p[name].executablePath(); if (!fs.existsSync(path)) throw new Error(\`Missing browser: \${path}\`); console.log(name + \"=\" + path); }" > /workspace/test-inventory-reports/browsers.txt
  {
    printf "architecture=%s\nbase_platform_manifest=%s\n" "$arch" "$manifest"
    printf "kernel=%s\n" "$(uname -r)"
    printf "node=%s\nnpm=%s\nplaywright=%s\n" "$(node --version)" "$(npm --version)" "$actual"
    printf "locale=%s\ntimezone=%s\n" "${LANG:-unset}" "$(date +%Z)"
    printf "font=%s\n" "$(fc-match sans-serif --format "%{family}\n" | head -n 1)"
    printf "browser-directory=%s\n" "$PLAYWRIGHT_BROWSERS_PATH"
    ls "$PLAYWRIGHT_BROWSERS_PATH"
  } > /workspace/test-inventory-reports/container-environment.txt
  node --test docker/*-contract.test.js
  exec "$@"
' packing-list-test "$@" || status=$?

for directory in coverage test-inventory-reports test-results dist; do
  if [ -d "/workspace/$directory" ]; then
    setpriv --reuid "$HOST_UID" --regid "$HOST_GID" --clear-groups \
      cp -a "/workspace/$directory/." "/artifacts/$directory/" || status=1
  fi
done
exit "$status"
