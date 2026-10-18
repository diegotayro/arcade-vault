#!/bin/bash
# Hook PostToolUse: formatea con Prettier y corrige con ESLint el archivo escrito.

file=$(node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{process.stdout.write(JSON.parse(d).tool_input.file_path||"")}catch{}})')

[ -f "$file" ] || exit 0
case "$file" in
  "$CLAUDE_PROJECT_DIR"/*) ;;
  *) exit 0 ;;
esac
case "$file" in
  */node_modules/*|*/.next/*|*/references/*) exit 0 ;;
esac

cd "$CLAUDE_PROJECT_DIR" || exit 0

npx prettier --write --ignore-unknown "$file" >/dev/null || exit 2

case "$file" in
  *.js|*.jsx|*.ts|*.tsx|*.mjs|*.cjs)
    if ! output=$(npx eslint --fix "$file" 2>&1); then
      echo "$output" >&2
      exit 2
    fi
    ;;
esac
