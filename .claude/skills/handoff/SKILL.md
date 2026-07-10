---
name: handoff
description: Write a self-contained handoff/task doc so in-progress work can continue cleanly in a fresh Claude session. Use when context is getting full, when wrapping up with unfinished work, or when the user asks to hand off, continue later, resume elsewhere, or start a new session.
argument-hint: [what to hand off]
---

# Handoff

Capture the current in-progress work as a **self-contained task doc** a *zero-context* session can
pick up and execute — no reliance on this conversation's history.

## Critical
- **Run in the main session with full context. NEVER fork / delegate this** — the whole point is to
  summarize what *this* session has been doing. A subagent would have none of it.
- **Write only verified state.** Don't claim work is done, tested, committed, or pushed unless it
  actually is. Distinguish "done" from "in progress" from "not started" honestly (Rule Zero).
- **Self-contained.** The reader has *nothing* but the repo + this doc. Spell out file paths,
  commands, tickets, branches. No "as we discussed", no dangling pronouns.

## Instructions

1. **Decide the scope** — from `$ARGUMENTS` if given, else the current in-progress work. If it's
   ambiguous what to hand off, ask one clarifying question.

2. **Pick a discoverable, stable path** (NOT the scratchpad — that's per-session and the new session
   can't see it). Prefer near the work: `<area>/docs/<slug>-handoff.md` or repo-root `HANDOFF.md`.
   **Leave it untracked by default** (don't `git add`/commit) so it never rides into a PR — tell the
   user the exact path, and that it's a scratch doc to delete when done. Only commit if asked.

3. **Write the doc** from [template.md](template.md). Fill every section; drop a section only if
   genuinely N/A. Keep it tight — a page or two, signal over noise.

4. **Save a memory breadcrumb** for significant/ongoing work (via the memory system) so the fresh
   session auto-loads a one-line pointer to the handoff and the project state. Skip for throwaway tasks.

5. **Give the kickoff line** — tell the user exactly what to paste into the new session, e.g.
   `Read <path> and let's build it. Start with the open questions.`

## What a good handoff contains (see template.md)
- **Where things stand** — done / in-progress / not-started, with commits, tickets, branch, PR.
- **Context pointers** — auto-loaded memory, the 2–4 files/docs to read first, setup commands.
- **The goal** — what to build and why now (what's unblocked vs blocked, and by whom).
- **Deliverables** — priority-ordered, each with a concrete acceptance criterion.
- **Guardrails** — project conventions to carry over (build/test/lint commands, `/coding`, layering,
  data rules, commit-ticket policy) that the new session won't infer on its own.
- **Open questions** — decisions to confirm with the user *before* coding.
- **Definition of done** — the finish line, verifiable.

## Constraints
- Analysis/summarization + one file write. Don't start the handed-off work itself.
- Don't dump raw conversation transcript — synthesize into an actionable spec.
- Verify anything load-bearing (a ticket exists, a test passed, a commit landed) before asserting it.
