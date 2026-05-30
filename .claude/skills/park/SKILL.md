---
name: park
description: >-
  Bookmark the current Claude session so you can resume it later, and manage
  your list of parked sessions. INVOKE when user says "park this", "park",
  "park list", "park done", "park remove", or wants to close a conversation
  and come back to it directly later.
disable-model-invocation: true
argument-hint: "[title] | list | done | remove <id>"
---

# Park Session

Bookmark the **current Claude session** so you can close the terminal and resume
the exact conversation later — no lossy summary, the conversation itself is the
context. Parked sessions are stored globally in `~/.claude/parked.md` so they span
every repo, are curated (only what you deliberately mark), and carry a one-line
breadcrumb of what to do on reopen.

This supersedes the old "write a summary" behavior. For genuine handoff to another
person or machine (where a local session can't be resumed), write a prose summary
manually instead — `park` is for resuming *your own* sessions.

## Resolving the subcommand

Parse the argument:

- **no arguments** or **a free-text title** → **PARK** (default)
- **`list`** → **LIST**
- **`done`** → **DONE**
- **`remove <id>`** → **REMOVE**

If the argument is ambiguous, treat anything that isn't exactly `list`, `done`, or
`remove ...` as a free-text title for PARK.

## Capturing session identity (all modes)

Always read these from the environment / session file — never guess:

- **Session UUID:** the `CLAUDE_CODE_SESSION_ID` environment variable.
- **Resume directory:** the directory the session was **launched** from — NOT the
  current `pwd`. `claude --resume <uuid>` resolves the session by its original launch
  directory (that's how `~/.claude/projects/<encoded-launch-dir>/<uuid>.jsonl` is
  keyed). If the user `cd`'d mid-session, `pwd` is wrong and the resume command will
  fail with "No conversation found with session ID".

  Get the correct launch directory by reading the first `cwd` recorded in the
  session's own jsonl:
  ```bash
  SID="$CLAUDE_CODE_SESSION_ID"
  F=$(find "$HOME/.claude/projects" -name "${SID}.jsonl" 2>/dev/null | head -1)
  LAUNCH_DIR=$(grep -m1 -o '"cwd":"[^"]*"' "$F" | sed 's/.*"cwd":"//;s/"$//')
  echo "uuid=$SID"; echo "launch_dir=$LAUNCH_DIR"
  ```
- **Repo name:** the basename of `LAUNCH_DIR`.

If `CLAUDE_CODE_SESSION_ID` is empty, or no matching `.jsonl` is found, tell the user
the session can't be parked (no resolvable session id / launch dir) and stop. Do NOT
fall back to `pwd` for the resume command — a wrong directory produces a silently
broken bookmark.

---

## PARK (default)

1. Capture session identity (above).
2. Derive a **title**: use the user-provided argument if given; otherwise write a
   short descriptive title from the conversation (≤ 8 words).
3. Write a **one-line breadcrumb**: what you were doing and the single most useful
   next action on reopen. One sentence.
4. Compute a **short id**: the first 4 characters of the session UUID.
5. Read `~/.claude/parked.md` (create it from the header template below if missing).
6. **Dedup by UUID:** if an entry with the same session UUID already exists, replace
   it in place (refreshing title, breadcrumb, and timestamp). Otherwise append a new
   entry.
7. Confirm to the user: the short id, title, and the reminder line (below).

### Entry format

```markdown
## [<shortid>] <Title>
**Repo:** <repo-name> · **Parked:** <YYYYMMDD-HHMM>
**Next:** <one-line breadcrumb>
`cd <LAUNCH_DIR> && claude --resume <full-uuid>`
```

---

## LIST

1. Read `~/.claude/parked.md`. If missing or empty, tell the user there are no
   parked sessions and stop.
2. Print every entry: short id, title, repo, parked timestamp, breadcrumb, and the
   `cd ... && claude --resume ...` command.
3. End with the reminder line (below).

---

## DONE

Run this **inside a resumed session** to clear its own bookmark.

1. Capture the current session UUID from `CLAUDE_CODE_SESSION_ID`.
2. Read `~/.claude/parked.md` and remove the entry whose `claude --resume <uuid>`
   matches the current session UUID.
3. If no matching entry exists, tell the user this session wasn't parked (nothing to
   remove) and stop.
4. Confirm which entry was removed.

---

## REMOVE `<id>`

1. Read `~/.claude/parked.md`.
2. Remove the entry whose short id matches `<id>` (the `[<shortid>]` in the heading).
3. If no match, say so and list the available short ids.
4. Confirm which entry was removed.

---

## File creation

If `~/.claude/parked.md` doesn't exist, create it with this header before writing:

```markdown
# Parked Sessions

<!-- Bookmarked Claude sessions to resume later. Managed by the `park` skill.
     Park current session: /park [title]
     List:  /park list
     Clear current (run inside a resumed session): /park done
     Remove by id: /park remove <id> -->
```

## The reminder line

After PARK and LIST, always end with:

> Same repo? just type `/resume` and pick it. Different repo / fresh terminal?
> paste the `cd … && claude --resume …` command above.

## Rules

- Read the UUID from the environment and the launch dir from the session jsonl;
  never fabricate them and never use `pwd` for the resume directory.
- Dedup PARK by full session UUID so re-parking refreshes rather than duplicates.
- Keep entries minimal: title, repo, timestamp, one-line breadcrumb, resume command.
- The resume command must `cd` to the session's launch dir (absolute path) so it
  resolves from any terminal.
- Preserve all other entries on every edit — only touch the targeted entry.
