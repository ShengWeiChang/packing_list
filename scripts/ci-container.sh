#!/bin/sh
set -eu

root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$root"
mode=${1:-}
if [ "$#" -gt 0 ]; then shift; fi
case "$mode" in
  full) set -- npm run verify:feature ;;
  smoke) set -- node scripts/linuxSmoke.js ;;
  probe) set -- npx playwright test --config=docker/probe.config.js ;;
  focused) set -- npx playwright test tests/end2end-tests/checklist-dates.spec.js tests/end2end-tests/interaction-feedback.spec.js tests/end2end-tests/rwd-overlays.spec.js --project=chromium --grep 'edits labeled dates and confirms changes at 320px|ends an old name edit when dragging a different item|short dialogs and narrow date editing fit without horizontal overflow' --retries=0 ;;
  case) [ "$#" -gt 0 ] || { echo 'Pass Playwright arguments after case.' >&2; exit 2; }; set -- npx playwright test "$@" ;;
  *) echo 'Usage: sh scripts/ci-container.sh full|smoke|focused|probe|case [Playwright arguments]' >&2; exit 2 ;;
esac

mkdir -p .container-test-artifacts
if [ -n "${CI_ARTIFACT_DIR:-}" ]; then
  output=$CI_ARTIFACT_DIR
  case "$output" in .container-test-artifacts/*) ;; *) echo 'CI_ARTIFACT_DIR must be inside .container-test-artifacts.' >&2; exit 2;; esac
  case "$output" in *..*|*[!a-zA-Z0-9._/-]*|*/) echo 'Invalid artifact directory.' >&2; exit 2;; esac
  mkdir "$output"
else
  output=$(mktemp -d .container-test-artifacts/run.XXXXXXXX)
fi
output=$(CDPATH= cd -- "$output" && pwd)
for folder in coverage test-inventory-reports test-results dist; do mkdir "$output/$folder"; done
printf 'Artifacts: %s\n' "$output"
checkout=$(git rev-parse HEAD)
printf 'Checkout: %s\n' "$checkout"
{
  printf 'checkout=%s\n' "$checkout"
  printf 'expected_checkout=%s\n' "${GITHUB_SHA:-not-a-github-run}"
  if [ -n "$(git status --porcelain --untracked-files=normal)" ]; then
    printf 'worktree=dirty\n'
  else
    printf 'worktree=clean\n'
  fi
  printf 'run_id=%s\nattempt=%s\n' "${GITHUB_RUN_ID:-local}" "${GITHUB_RUN_ATTEMPT:-local}"
  printf 'pr_head=%s\npr_base=%s\n' "${PR_HEAD_SHA:-not-a-pr}" "${PR_BASE_SHA:-not-a-pr}"
  printf 'base_image_index=sha256:6446946a1d9fd62d9ae501312a2d76a43ee688542b21622056a372959b65d63d\n'
  printf 'base_linux_amd64=sha256:65cefd09a5e943921ecd3a6e5414c603db2eb161e9eb48f2e2ccc63486dc7dc0\n'
  printf 'base_linux_arm64=sha256:68f1c3dca663d0e8331e8af4681b0b315eca7de1bd7fa934aac0accbeb9f8323\n'
} > "$output/test-inventory-reports/run-metadata.txt"
if [ -n "${GITHUB_SHA:-}" ] && [ "$checkout" != "$GITHUB_SHA" ]; then
  echo 'Checkout does not match the GitHub event revision.' >&2
  exit 1
fi
docker build --file docker/Dockerfile --tag packing-list-test:local .
docker run --rm --init --ipc=host \
  --env "HOST_UID=$(id -u)" --env "HOST_GID=$(id -g)" \
  --mount "type=bind,source=$root,target=/source,readonly" \
  --mount type=volume,target=/workspace/node_modules \
  --mount "type=bind,source=$output,target=/artifacts" \
  packing-list-test:local "$@"
