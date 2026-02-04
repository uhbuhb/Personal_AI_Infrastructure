#!/bin/bash
# SessionEnd hook: prompt Claude to persist session memories
# Output is fed back to Claude before the session closes

MEMORIES_DIR="$HOME/.claude/memories"

echo "=== SESSION END: SAVE MEMORIES ==="
echo ""
echo "Before this session ends, save any valuable context:"
echo ""
echo "1. **Learnings** — If you discovered patterns, solved tricky bugs,"
echo "   or found non-obvious solutions, save them to:"
echo "   $MEMORIES_DIR/learnings/<descriptive-name>.md"
echo ""
echo "2. **Session state** — If there's ongoing work, save current"
echo "   task status and next steps to:"
echo "   $MEMORIES_DIR/session/current-task.md"
echo ""
echo "3. **Reviews** — If you did code reviews with persistent findings,"
echo "   save them to:"
echo "   $MEMORIES_DIR/reviews/<project-name>.md"
echo ""
echo "Use this format for memory files:"
echo '```'
echo "---"
echo "created: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "tags: [tag1, tag2]"
echo "---"
echo "# Title"
echo "## Summary"
echo "One-line summary"
echo "## Content"
echo "Details here"
echo '```'
echo ""
echo "If nothing worth persisting happened this session, skip saving."
echo "=== END MEMORY PROMPT ==="
