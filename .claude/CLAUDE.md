# Coding Rules

**Do not write production code directly** - temporary code for testing connections or gathering info is fine, but code that will be committed/deployed must be passed to the coder agent after planning.

## Core
- **Analysis vs Action**: If asked to analyze or find bugs, do analysis only - pinpoint the issue but don't fix it, ask first
- **Bug certainty**: Don't claim you found a bug until 100% certain. If unsure, raise hypotheses with suggestions to pinpoint the cause (add logging, check specific conditions, etc.)

## Always
- `uv run python` (never bare python)
- `uv add/remove/sync` (never pip)
- Temp files to `~/.claude/scratchpad/YYYY-MM-DD-HHMMSS_description/`
- `file:line` refs when reporting bugs

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

