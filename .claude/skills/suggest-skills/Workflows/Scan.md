# Scan Workflow

**Goal:** a ranked shortlist of skills worth building, each backed by evidence from the user's own
work. Read-only throughout — this workflow never creates or edits a skill.

## Step 1 — Gather (deterministic)

```bash
bun ${PAI_DIR}/skills/suggest-skills/Tools/CollectSignals.ts --days 45
```

Pass `--days N` if the user named a window. Read the returned `warnings`, `missing`, and `sources`
before anything else and surface them — a store that failed to resolve changes what the scan can
conclude. Do not gather by hand; if the tool is missing a store you need, extend the tool.

## Step 2 — Cluster by recurring pain

Group `prompts` into themes. For each theme carry:

- **recurrence** — how many prompts, spread over how many distinct dates and projects
- **shape** — what the user was actually trying to do, in their words
- **retread** — whether the same ground is covered repeatedly across separate sessions (the
  strongest available severity signal, since no frustration store exists)

`sessions` gives per-project transcript counts — use it to weight a theme that dominated real
working time over one that produced a few stray prompts.

## Step 3 — Dedup against real coverage

For each candidate theme, list the `registries` entries that might cover it, then **read their
bodies**. A name or a keyword overlap is not coverage: the covering skill must actually address the
failure class. Two blind spots to defeat:

- **Discipline gaps hide under covered topics.** "App development" maps to a build skill, but the
  recurring pain may be an unowned discipline (state modeling, error handling, migration safety)
  the build skill never addresses.
- **Partial coverage reads as full coverage.** A skill that handles the happy path of a theme does
  not cover the theme's recurring failure.

Drop candidates that are genuinely covered. Keep the rest with a one-line note on why existing
coverage falls short.

## Step 4 — Verify with two independent passes

Judge the surviving candidates twice, independently — once asking "is this a real, recurring,
uncovered problem?" and once asking "what is missing from this list that the corpus supports?"

Report the **UNION**, not the intersection. Tag each: `both` (high confidence) or `one`
(needs review). Requiring agreement suppresses the subtle gaps this scan exists to find.

## Step 5 — Propose

Emit a ranked shortlist. For each proposal:

| Field | Content |
|---|---|
| **Skill** | proposed name + one-line description |
| **Evidence** | prompt count, distinct dates, projects, the specific recurring failure |
| **Why uncovered** | which existing skill looked close and what it does not handle |
| **Confidence** | `both` or `one` |

Then state plainly: nothing was created. Ask which proposals the user wants, and route accepted ones
to `create-skill` one at a time.

## Output rules

- **Never report "no gaps found" flatly.** The frustration signal is absent on this install; a clean
  result means recurrence alone surfaced nothing. Say that.
- Separate steering feedback ("too verbose", "wrong scope") from skill gaps and route it to memory
  or CLAUDE.md instead.
- Redact secrets, client names, and personal paths from the output.
