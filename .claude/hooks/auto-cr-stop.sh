#!/bin/bash
# Auto Code Review Stop Hook
# Detects code edits in the session transcript and blocks exit to trigger
# a lightweight review agent before returning control to the user.

set -euo pipefail

# Read hook input from stdin
HOOK_INPUT=$(cat)
SESSION_ID=$(echo "$HOOK_INPUT" | jq -r '.session_id')
TRANSCRIPT_PATH=$(echo "$HOOK_INPUT" | jq -r '.transcript_path')

# --- Guard 1: Environment variable opt-out ---
if [[ "${AUTO_CR:-1}" == "0" ]]; then
  exit 0
fi

# --- Guard 2: Active ralph-loop (don't interfere) ---
if [[ -f ".claude/ralph-loop.local.md" ]]; then
  exit 0
fi

# --- Guard 3: Already reviewed this session ---
MARKER_DIR="/tmp/.claude-auto-cr"
MARKER_FILE="${MARKER_DIR}/done.${SESSION_ID}"
if [[ -f "$MARKER_FILE" ]]; then
  exit 0
fi

# --- Guard 4: Transcript exists ---
if [[ ! -f "$TRANSCRIPT_PATH" ]]; then
  exit 0
fi

# --- Guard 5: User said "skip review" ---
SKIP_DETECTED=$(grep '"role":"human"' "$TRANSCRIPT_PATH" | tail -5 | \
  jq -r '.message.content[]? | select(.type == "text") | .text' 2>/dev/null | \
  grep -iE 'skip\s*(code\s*)?review|no\s*review|skip\s*cr' || true)

if [[ -n "$SKIP_DETECTED" ]]; then
  exit 0
fi

# --- Guard 6: Detect code-writing tools in transcript ---
CODE_EXTENSIONS="py|ts|tsx|js|jsx|swift|go|rs|java|kt|rb|c|cpp|h|hpp|cs|sh|sql"

WRITTEN_FILES=$(grep '"role":"assistant"' "$TRANSCRIPT_PATH" | \
  jq -r '
    .message.content[]? |
    select(.type == "tool_use") |
    select(.name == "Edit" or .name == "Write" or .name == "MultiEdit") |
    if .name == "MultiEdit" then
      .input.edits[]?.file_path // empty
    else
      .input.file_path // empty
    end
  ' 2>/dev/null | sort -u || true)

if [[ -z "$WRITTEN_FILES" ]]; then
  exit 0
fi

# --- Guard 7: Filter to code files only ---
CODE_FILES=$(echo "$WRITTEN_FILES" | grep -iE "\.(${CODE_EXTENSIONS})$" || true)

if [[ -z "$CODE_FILES" ]]; then
  exit 0
fi

# --- Guard 8: code-reviewer or auto-reviewer already invoked ---
REVIEWER_INVOKED=$(grep '"role":"assistant"' "$TRANSCRIPT_PATH" | \
  jq -r '
    .message.content[]? |
    select(.type == "tool_use") |
    select(.name == "Task") |
    .input.subagent_type // empty
  ' 2>/dev/null | grep -iE 'code-reviewer|auto-reviewer' || true)

if [[ -n "$REVIEWER_INVOKED" ]]; then
  exit 0
fi

# --- All guards passed: block exit and trigger review ---

mkdir -p "$MARKER_DIR"
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$MARKER_FILE"

FILE_COUNT=$(echo "$CODE_FILES" | wc -l | tr -d ' ')
FILE_LIST=$(echo "$CODE_FILES" | sed 's/^/  - /' | head -20)

REVIEW_PROMPT="Before finishing, run an automatic code review of the changes you just made.

Steps:
1. Run \`git diff\` (include both staged and unstaged) to get the full diff
2. Launch the auto-reviewer agent via Task(subagent_type=\"auto-reviewer\") and pass it the diff output
3. If the reviewer finds critical or high severity issues, present them to the user
4. If no issues found, briefly note that and continue

Files changed:
${FILE_LIST}

Do NOT skip this step. Do NOT review inline — use the auto-reviewer agent."

SYSTEM_MSG="Auto-review: ${FILE_COUNT} code file(s) modified. Reviewing before completing."

jq -n \
  --arg reason "$REVIEW_PROMPT" \
  --arg msg "$SYSTEM_MSG" \
  '{
    "decision": "block",
    "reason": $reason,
    "systemMessage": $msg
  }'

exit 0
