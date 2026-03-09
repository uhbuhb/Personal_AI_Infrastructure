---
name: park
description: >-
  Save current task state to ~/.claude/to-continue.md for later resumption.
  INVOKE when user says "park this", "save state", "pause this task",
  "I need to discuss this first", or wants to come back to a task later.
disable-model-invocation: true
argument-hint: "[optional task title]"
---

# Park Task

Save the current task to `~/.claude/to-continue.md` (global, not project-specific)
so the user can close this terminal, discuss with their manager, and resume later.
Tasks from any repo are stored in the same file.

## Instructions

1. Read `~/.claude/to-continue.md`
   - If it doesn't exist, create it using the template below
2. Review the full conversation to extract:
   - What task was being worked on and why
   - What's been completed (with `file:line` references)
   - What remains to be done
   - Decision points that need input — frame as clear questions with options
   - All files touched or inspected
3. Generate a timestamped entry and append it to `~/.claude/to-continue.md`
4. Confirm to the user what was saved

## Entry Format

Append this exact structure (fill in all sections):

```markdown
---

## [YYYYMMDD-HHMMSS] Task Title Here

**Status:** 🟡 Parked — awaiting [decision/discussion/input]
**Repo:** `repo-name`
**Branch:** `branch-name` (or `uncommitted` if no branch yet)
**Jira:** TICKET-123 (omit line if no ticket)

### Context
What is this task and why does it matter? 2-3 sentences max.

### What's Done
- Concrete completed steps with `file:line` references
- e.g. Added migration `backend/alembic/versions/abc123_add_col.py`

### What's Not Done
- Remaining work items
- Ordered by dependency if possible

### Decision Points
> These are the questions that need answers before resuming.

1. **[Question framed as a clear choice]**
   - Option A: [description] — tradeoff: [pro/con]
   - Option B: [description] — tradeoff: [pro/con]
   - Recommendation: [your suggestion and why]

2. **[Next question if any]**
   - ...

### Files Touched
- `path/to/file.py:42` — [what was changed/inspected]

### How to Resume
1. Check out branch `xyz` (if applicable)
2. [Specific next action]
3. [Specific next action]
```

## File Creation

If `~/.claude/to-continue.md` doesn't exist, create it with this header before appending:

```markdown
# To Continue

<!-- Parked tasks awaiting discussion or later resumption.
     Use `/park` to add entries. Update Status to ✅ Done when resolved. -->
```

## Rules

- APPEND only — never overwrite or remove existing entries
- Use current timestamp for the entry ID
- Be specific and concrete — someone reads this cold with no prior context
- Decision Points are the most important section: always include options with tradeoffs
- Include `file:line` references for every file touched or inspected
- If arguments were provided, use them as the task title
- If no arguments, derive a short descriptive title from the conversation
- Always include `**Repo:**` with the current repo name (from git remote or directory name)

## Output

After appending, confirm:
- Entry ID and title
- Number of decision points captured
- Remind user: "When you're ready to resume, tell Claude: check ~/.claude/to-continue.md and resume [entry ID]"
