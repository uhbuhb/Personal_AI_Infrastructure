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

# Memory summary section (universal, always runs)
MEMORIES_DIR="$HOME/.claude/memories"

if [[ -d "$MEMORIES_DIR" ]]; then
    echo "=== MEMORY SUMMARY ==="

    # Session memories (current task)
    if [[ -d "$MEMORIES_DIR/session" ]]; then
        session_files=$(find "$MEMORIES_DIR/session" -name "*.md" 2>/dev/null)
        if [[ -n "$session_files" ]]; then
            echo "📌 Active session memories:"
            for f in $session_files; do
                title=$(grep -m1 "^# " "$f" 2>/dev/null | sed 's/^# //' || basename "$f" .md)
                echo "   - $title"
            done
        fi
    fi

    # Count memories
    learning_count=$(find "$MEMORIES_DIR/learnings" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
    review_count=$(find "$MEMORIES_DIR/reviews" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')

    echo "📚 Available: ${learning_count} learnings, ${review_count} reviews"
    echo "💡 Load with: read ~/.claude/memories/[category]/[file].md"
    echo "=== END MEMORY SUMMARY ==="
fi
