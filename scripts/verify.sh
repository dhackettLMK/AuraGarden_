#!/usr/bin/env bash
# Typecheck, lint, unit tests and production build. Exits non-zero on any failure.
set -euo pipefail
cd "$(dirname "$0")/.."
npx tsc --noEmit
npx eslint
npx vitest run
npm run build
