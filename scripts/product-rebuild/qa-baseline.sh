#!/usr/bin/env bash
# Rerun the Wave 0 QA baseline commands. Does not modify product code.
# Usage:
#   scripts/product-rebuild/qa-baseline.sh
#   scripts/product-rebuild/qa-baseline.sh --with-playwright   # needs APP_URL + seeded DB + Playwright
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

OUT="${QA_BASELINE_OUT:-/tmp/qa-baseline}"
mkdir -p "$OUT"

with_playwright=0
if [[ "${1:-}" == "--with-playwright" ]]; then
    with_playwright=1
fi

echo "== git identity =="
git rev-parse --abbrev-ref HEAD
git rev-parse HEAD
git log -1 --oneline
git status --porcelain

run() {
    local name="$1"
    shift
    echo
    echo "== ${name} =="
    set +e
    "$@" | tee "${OUT}/${name}.log"
    local code=${PIPESTATUS[0]}
    set -e
    echo "EXIT:${code}" | tee -a "${OUT}/${name}.log"
    return 0
}

run types-check npm run types:check
run vitest npm test
run lint-check npm run lint:check
run vite-build npm run build
run pest composer ci:check

if [[ "$with_playwright" -eq 1 ]]; then
    echo
    echo "== playwright (optional; not a package.json script) =="
    echo "This helper does not add Playwright to the product tree."
    echo "Seeded login: owner@evosales.local / password"
    echo "Routes: /dashboard /crm/contacts /crm/contacts/1 /crm/companies"
    echo "        /crm/leads /crm/deals /crm/deals/board /crm/deals/1"
    echo "        /inbox /crm/quotes /crm/quotes/1 /settings"
    echo "Do not install Playwright at /tmp/pw if you want CI-equivalent Pest:"
    echo "GoldenCopyGuardTest skips without it and fails against APP_URL=http://localhost when it is present."
fi

echo
echo "Logs: ${OUT}"
echo "CI equivalent: composer ci:check (Pest only)."
