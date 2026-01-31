# Coding Rules

**Always invoke the `/coding` skill before writing code to repository files** - exempt:
- Scratchpad files (`~/.claude/scratchpad/`)
- Inline execution (`uv run python -c "..."`, piped scripts) for debugging

## Core
- **Analysis vs Action**: If asked to analyze or find bugs, do analysis only - pinpoint the issue but don't fix it, ask first
- **Bug certainty**: Don't claim you found a bug until 100% certain. If unsure, raise hypotheses with suggestions to pinpoint the cause (add logging, check specific conditions, etc.)
- **Investigate before claiming**: Never speculate about code you haven't read. Open and inspect files before explaining or proposing fixes
- **Keep it simple**: Avoid over-engineering. Only make changes directly requested or clearly necessary. Don't add features, abstractions, or "improvements" beyond what was asked
- **Parallel tools**: When calling multiple tools with no dependencies, make all independent calls in parallel

## Always
- `uv run python` (never bare python)
- `uv add/remove/sync` (never pip)
- `file:line` refs when reporting bugs

## Scratchpad
Save ALL temporary files to `~/.claude/scratchpad/YYYY-MM-DD-HHMMSS_description/`:
- Drafts, notes, test code, experiments, one-off requests
- NEVER drop temp files in `~/.claude/` root or current working directory
- Applies to main AI and all sub-agents

## Ask First
- Committing from `~/.claude/`
- Infrastructure changes
- Pushing to remote
- Fixing bugs (analyze and pinpoint the specific bug first)
- Production DB operations

## Never
- Commit secrets or `.env` files
- Push to remote
- Kill/start processes or services - if something is down, ask user to restart it

## Memory Protocol

**Check memory summary at session start** (shown automatically via hook)

### Rules:
1. **Before complex tasks**: Check relevant memories first
2. **After debugging**: Save patterns to `~/.claude/memories/learnings/`
3. **Just-in-time**: Load full content only when needed
4. **Session state**: Keep current task in `~/.claude/memories/session/`
5. **Persistent findings**: Save to `learnings/` or `reviews/`

### Quick Reference:
- View: `read ~/.claude/memories/[category]/[file].md`
- Create: Write to `~/.claude/memories/[category]/[name].md`
- List: `ls ~/.claude/memories/[category]/`

## Session Context

When completing significant work or before ending a session:
- Update `.claude/context.md` with current state:
  - Current task and status
  - Key decisions made
  - Blockers or next steps
- Keep it concise (under 50 lines)
- This file is gitignored and per-developer

## Context Limits

Your context window will be automatically compacted as it approaches its limit, allowing you to continue working indefinitely from where you left off. Therefore, do not stop tasks early due to token budget concerns. As you approach your token budget limit, save your current progress and state to memory before the context window refreshes. Always be as persistent and autonomous as possible and complete tasks fully, even if the end of your budget is approaching. Never artificially stop any task early regardless of the context remaining.

## Response Format

Use this structured format:
- **SUMMARY:** Brief overview of request and accomplishment
- **ANALYSIS:** Key findings and context
- **ACTIONS:** Steps taken with tools used
- **RESULTS:** Outcomes and changes made - SHOW ACTUAL OUTPUT
- **STATUS:** Current state after completion
- **NEXT:** Recommended follow-up actions
- **COMPLETED:** [Task description in 12 words]
