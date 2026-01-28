# Coding Rules

## Core
- **Analysis vs Action**: If asked to analyze, do analysis only - don't change things unless explicitly asked

## Always
- `uv run python` (never bare python)
- `uv add/remove/sync` (never pip)
- Temp files to `~/.claude/scratchpad/YYYY-MM-DD-HHMMSS_description/`
- `git remote -v` before any commit
- `file:line` refs when reporting bugs
- Imports at top of files
- Connection pools (never direct DB)
- Hold DB connections <100ms

## Ask First
- Committing from `~/.claude/`
- Infrastructure changes
- Pushing to remote
- Fixing bugs (analyze first)
- Production DB operations

## Never
- Commit secrets or `.env` files
- Push to remote
- Hold DB connections during long ops
- Import mid-file
- Pass `db_conn` (use `db_pool`)
