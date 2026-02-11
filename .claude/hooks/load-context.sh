#!/bin/bash
# Load per-project session context if it exists
# Hook location: ~/.claude/hooks/ (universal)
# Context location: .claude/context.md (per-project, relative to CWD)

CONTEXT_FILE=".claude/context.md"
CONTEXT_DIR=".claude"

if [[ -f "$CONTEXT_FILE" ]]; then
    echo "=== SESSION CONTEXT ==="
    cat "$CONTEXT_FILE"
    echo "=== END SESSION CONTEXT ==="
elif [[ -d "$CONTEXT_DIR" ]]; then
    # .claude dir exists but no context file - create template
    cat > "$CONTEXT_FILE" << 'EOF'
# Session Context

## Current Task
<!-- What you're working on -->

## Decisions
<!-- Key decisions made this session -->

## Next Steps
<!-- What to do next -->
EOF
    echo "Created new session context file: $CONTEXT_FILE"
fi
# If no .claude dir exists, stay silent (not a Claude-enabled project)
