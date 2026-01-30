# Coding Rules

**Always invoke the `/coding` skill before writing code to repository files** - exempt:
- Scratchpad files (`~/.claude/scratchpad/`)
- Inline execution (`uv run python -c "..."`, piped scripts) for debugging

## Core
- **Analysis vs Action**: If asked to analyze or find bugs, do analysis only - pinpoint the issue but don't fix it, ask first
- **Bug certainty**: Don't claim you found a bug until 100% certain. If unsure, raise hypotheses with suggestions to pinpoint the cause (add logging, check specific conditions, etc.)

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

## Response Format

Use this structured format:
- **SUMMARY:** Brief overview of request and accomplishment
- **ANALYSIS:** Key findings and context
- **ACTIONS:** Steps taken with tools used
- **RESULTS:** Outcomes and changes made - SHOW ACTUAL OUTPUT
- **STATUS:** Current state after completion
- **NEXT:** Recommended follow-up actions
- **COMPLETED:** [Task description in 12 words]
