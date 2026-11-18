#!/usr/bin/env bash
# Bundle each TS test with rolldown (already a Vite dependency) and run it in node.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p node_modules/.tmp/tests
status=0
for file in test/*.test.ts; do
  name="$(basename "$file" .test.ts)"
  out="node_modules/.tmp/tests/${name}.mjs"
  ./node_modules/.bin/rolldown "$file" -o "$out" -f esm >/dev/null
  if node "$out"; then
    :
  else
    echo "  FAIL  ${name}"
    status=1
  fi
done
exit "$status"
