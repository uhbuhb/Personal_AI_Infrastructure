---
name: trim
description: Shrink an always-on context file that has grown too big — ranked, human-gated cuts behind a safety gate that never drops a directive. Use when a doctrine file is too big, CLAUDE.md is bloated, or the user asks to trim, prune, or reduce an always-loaded file.
argument-hint: [file to trim]
---

# Trim

Shrink an always-on context file without dropping a single directive. Safest cuts first; the human approves every judgment call.

Adapted from the LifeOS `Trim` skill. Its zero-risk first pass (deterministic GC of self-marked
`[SUPERSEDED]` proposal entries) is **not** part of this version — we have no proposal inbox, so
every cut here is a judgment call and the safety gate in step 3 is the load-bearing part.

## Step 0 — Resolve the target

The always-on set is: `~/.claude/CLAUDE.md`, the repo's `.claude/CLAUDE.md`, any `@`-imports those
declare, `MEMORY.md`, and the skill files loaded every session.

- Arg given: match it against that set by basename.
- No arg: `wc -c` the whole set and take the largest.

Confirm the resolved absolute path before touching anything.

## Step 1 — Show the state

```bash
wc -c <resolved-path>
```

Report `<file> — <bytes>`, and **where the weight sits** — per-section byte counts beat a single
total. State the target reduction for this run so step 4 has something to measure against.

## Step 2 — Rank the candidates

Read the file. Build a RANKED list of candidate trims, each with the exact target text and estimated
bytes saved. Three moves, in decreasing safety:

- **RELOCATE** (safest) — rarely-referenced detail (long mechanism explanations, enumerations,
  examples) moves to an on-demand reference doc, leaving a one-line stub + pointer. Nothing is lost;
  it just stops loading every turn.
- **TIGHTEN** — a verbose multi-sentence rule becomes one plain sentence carrying the same
  directive. Kill throat-clearing, war-story prose, and intensifier-only restatements — never the
  instruction.
- **MERGE** — two or more rules saying overlapping things become one rule carrying every distinct
  directive from all of them.

Rank by `bytes_saved × safety`. Present the list; the human picks which to apply (or "all the safe
ones"). Apply one at a time.

## Step 3 — Safety gate (before every write — non-negotiable)

A trim edits live doctrine. Before writing any merge or tighten:

1. **Coverage check** — enumerate every proper noun, file path, tool/command name, env-var name, and
   imperative verb in the ORIGINAL. Confirm each survives in the replacement. A missing one means the
   edit drops a directive: **abort that edit, keep the original.**
2. **Re-read as the reader** — does the replacement still compel the same behavior? If it reads
   weaker, it is a bad trim.
3. **Relocations** — confirm the moved content landed verbatim in the reference AND the stub points
   at it, before deleting from the source.

## Step 4 — Re-verify and report

Re-run `wc -c` and report the new byte count. Lead with the before→after
(`CLAUDE.md 40,456 → 28,043 B (−31%)`), then what was removed, merged, or relocated. If any candidate
was declined by the safety gate, say which and why.

Never claim the file was trimmed without the re-run `wc -c` number as evidence.

Committing is the user's call — show the diff and ask.

## Gotchas

- **The file can change mid-edit.** If a Write/Edit reports "modified since read", RE-READ before
  writing. Never write from a stale read.
- **A merge that loses a directive is worse than a big file.** When the coverage check is ambiguous,
  keep the original.
