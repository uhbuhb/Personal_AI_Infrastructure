---
name: memory
description: Memory management for persistent context across sessions. INVOKE when user says "remember this", "save for later", "what do you remember", or needs to persist learnings.
user-invocable: true
---

# Memory Skill

Manage persistent memory across sessions using ~/.claude/memories/

## Memory Structure

```
~/.claude/memories/
├── session/     # Current task state (cleared on session end)
├── learnings/   # Patterns Claude discovers (persistent)
├── standards/   # Reference docs loaded on-demand (persistent)
└── reviews/     # Code review findings (persistent)
```

## Operations

| Action | Method |
|--------|--------|
| **View** | `read ~/.claude/memories/[category]/[file].md` |
| **List** | `ls ~/.claude/memories/[category]/` |
| **Create** | Write tool to appropriate directory |
| **Update** | Edit tool on existing file |
| **Delete** | `rm ~/.claude/memories/[category]/[file].md` |
| **Search** | `grep -r "pattern" ~/.claude/memories/` |

## Memory File Format

```markdown
---
created: [ISO timestamp]
updated: [ISO timestamp]
tags: [relevant, tags]
---

# Title

## Summary
[One-line summary for quick scanning]

## Content
[Detailed content]
```

## When to Create Memories

| Type | Trigger | Example |
|------|---------|---------|
| **learning** | Debugging reveals pattern, user confirms solution | "TSConfig paths need baseUrl set" |
| **standard** | User wants reference doc for coding/reviews | Coding patterns, review checklists |
| **session** | Track current task progress | "Working on memory implementation" |
| **review** | Persist code review findings | Project-specific issues catalog |

## Just-In-Time Protocol

1. **Session start**: Only summaries shown (via hook)
2. **On demand**: Load full content when specifically needed
3. **Never**: Don't load all memories at once

## Trigger Phrases

- "Remember this pattern"
- "Save this for later"
- "What do you remember about X"
- "Load my coding standards"
- "Show my learnings"
- "Clear session memories"

## Examples

### Save a Learning
```
User: "Remember that MCP servers need the full path in .mcp.json"
Action: Create ~/.claude/memories/learnings/mcp-server-paths.md
```

### Load Standards
```
User: "Load my review checklist"
Action: Read ~/.claude/memories/standards/review-checklist.md
```

### Track Session Progress
```
Action: Write current task state to ~/.claude/memories/session/current-task.md
```
