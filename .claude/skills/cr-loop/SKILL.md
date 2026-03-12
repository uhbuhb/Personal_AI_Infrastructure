---
name: cr-loop
description: Automated code review feedback loop. INVOKE when user wants iterative review-fix cycles, continuous code review, or review loop after implementation.
disable-model-invocation: true
---

# Code Review Feedback Loop

Automate the cycle of: review changes → triage issues → fix/dismiss/escalate → re-review → repeat until clean.

## Arguments

- `base` (optional): Base branch to diff against (default: `dev-agentic-os`)
- `max` (optional): Maximum review cycles (default: 5)

Examples:
- `/cr-loop` — review all changes vs `dev-agentic-os`, up to 5 cycles
- `/cr-loop main` — review against `main` instead
- `/cr-loop dev-agentic-os 3` — limit to 3 cycles

## Instructions

### Phase 1: Initialize

1. Parse arguments:
   - `base_branch`: first argument or default `dev-agentic-os`
   - `max_cycles`: second argument (if numeric) or default 5
2. Determine review scope:
   - Run `git fetch origin` to ensure remote refs are up to date
   - Run `git diff origin/{base_branch}...HEAD --stat` to see all changes on this branch relative to base
   - Run `git log origin/{base_branch}..HEAD --oneline` to see commits being reviewed
   - Also check `git diff --stat` for any uncommitted changes (include these too)
   - The full review scope is: everything between `origin/{base_branch}` and current working tree
   - If no differences exist at all, inform the user and exit
3. Create state file at `~/.claude/scratchpad/cr-loop-{timestamp}.md` (e.g., `cr-loop-2026-03-09-143022.md`):
   ```markdown
   # CR Loop Transcript
   ## Config
   - Base: origin/{base_branch}
   - Branch: {current branch}
   - Max cycles: {max_cycles}
   - Started: {timestamp}
   - Scope: {N} files changed, {N} commits

   ## Review Scope
   {git log --oneline output}
   {git diff --stat output}

   ## Cycle 1
   ### Reviewer Findings
   (full review output from the code-reviewer subagent)

   ### Triage Decisions
   (for each issue: what the reviewer said, what the implementer decided, and why)

   ### User Decisions
   (if any issues were escalated: what the user chose and why)

   ### Files Modified
   (list of files changed by fixes this cycle)

   ## Cycle 2
   ...

   ## Dismissed Issues (Running List)
   (accumulated — each entry includes: issue description, cycle dismissed, reasoning)

   ## Final Summary
   (written on termination)
   ```

### Phase 2: Review Cycle

For each cycle:

0. **Read state file** (the `~/.claude/scratchpad/cr-loop-*.md` file created in Phase 1) to load dismissed issues list and cycle count. This is the source of truth — do not rely on conversation memory for this data.

1. **Spawn code-reviewer subagent:**
   - Use Task tool with `subagent_type="code-reviewer"`
   - Provide the current diff and context about what was implemented and why
   - Do NOT pass dismissed issues to the reviewer — let it review with completely fresh eyes

2. **Receive and parse review results:**
   - Extract each distinct issue from the review
   - For each issue, note: severity, file, line, description, suggested fix

3. **Triage each issue — apply these rules strictly:**

   First, check if the issue matches a previously dismissed issue. If so, a fresh reviewer independently flagged the same concern — reconsider whether the original dismissal was justified. Apply the same triage rules below as if it were new, but factor in that multiple independent reviewers flagged it.

   For each issue (new or re-raised), ask yourself: "Am I **certain** about the right call here?"

   - **Certain it's valid** (clear bug, real security issue, obvious improvement) → **FIX IT**
   - **Certain it's not applicable** (reviewer misunderstood intent, false positive given context, cosmetic/style nitpick) → **DISMISS with reasoning**
   - **ANY hesitation at all** — even slight doubt in either direction → **ESCALATE to user**

   Err heavily toward escalating. When in doubt, escalate.

4. **Apply fixes** for accepted issues

5. **Commit fixes** — if any files were changed this cycle, stage and commit them:
   ```
   git add <changed files>
   git commit -m "cr: cycle {N} fixes

   - <brief description of each fix>

   Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
   ```
   If escalated issues are pending user input, commit what's been fixed so far. After user decisions are applied, commit those as a separate commit for the same cycle:
   ```
   git commit -m "cr: cycle {N} fixes (user-directed)

   - <brief description of each fix>

   Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
   ```

6. **Report cycle summary to user:**

   ```
   ## Review Cycle {N} Summary

   ### Fixed ({count})
   - [severity] file:line — description (what was done)

   ### Dismissed ({count})
   - [severity] file:line — description
     → Reason: [why this is not applicable]

   ### Re-raised from prior cycle ({count})
   - [severity] file:line — description (previously dismissed in cycle {N})
     → Original dismissal reason: [why it was dismissed before]
     → Reconsidered: [still dismiss / now fixing / escalating to user]

   ### Need Your Input ({count})
   - [severity] file:line — description
     → Reviewer says: [their concern]
     → My take: [your assessment and why you're unsure]
     → Recommendation: [lean fix / lean dismiss / genuinely unsure]
   ```

7. **Update state file** — append full cycle transcript:
   - **Reviewer Findings**: the complete review output from the subagent
   - **Triage Decisions**: for each issue — reviewer's concern, implementer's decision (fix/dismiss/escalate), and reasoning
   - **Commit**: the commit hash(es) created this cycle
   - **Files Modified**: list of files changed by fixes this cycle
   - Update `## Dismissed Issues (Running List)` with any newly dismissed items
   This persists everything to disk so the main context can be compacted without losing state.

8. **If there are escalated issues**: Stop and wait for user decisions before proceeding. Apply user's decisions, commit the user-directed fixes, append **User Decisions** section to current cycle in state file (what the user chose and their reasoning), then continue to next cycle.

9. **If no escalated issues**: Proceed directly to next cycle.

### Phase 3: Loop Termination

Stop the loop when ANY of these conditions is met:
- Reviewer returns **zero issues**
- All issues raised were re-raises that were reconsidered and still dismissed
- User explicitly says to stop
- `cycle_count` reaches `max_cycles`

On termination:
1. Append `## Final Summary` to the state file with totals and status
2. Print the final summary to the user:

```
## CR Loop Complete

- Total cycles: {N}
- Total issues found: {N}
- Fixed: {N}
- Dismissed: {N}
- Escalated to user: {N}
- Status: [clean / stopped by user / max cycles reached]
- Transcript: ~/.claude/scratchpad/cr-loop-{timestamp}.md
```

## Constraints

- Never auto-fix an issue you have even slight doubt about — escalate instead
- When an issue is re-raised from a prior cycle, reconsider the original dismissal — a second independent reviewer flagging the same thing is a meaningful signal
- Always show the user what was fixed and what was dismissed — full transparency
- Do not invoke `/coding` skill from within this loop — you are already the implementing agent
- Respect the max cycle cap to prevent runaway loops
- Each review cycle must use a fresh code-reviewer subagent (no reusing prior agent)

## Important Notes

- This skill runs in the main conversation context so you retain full knowledge of what was implemented and why — use that context when triaging
- The code-reviewer agent is read-only (no Write/Edit tools) — all fixes happen here in the main context
- If a fix introduces new complexity, note that it will be caught in the next review cycle
