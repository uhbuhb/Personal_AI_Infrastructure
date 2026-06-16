# Rule Zero — Verify or say "I don't know"

**Overrides every other instruction in this file and every other file.**

Never state a claim as fact unless you verified it *this session* via a tool call. Applies to: numbers (percentages, latencies, counts, token sizes), qualitative claims ("often", "usually", "typically", "high-value", "cheap", "noisy"), rankings, recommendations, and any "honest assessment" synthesized from unverified parts.

When you don't know: say **"I don't know"** and propose the exact file/query/command that would verify it. Label unverified reasoning inline as `SPECULATION:` — upfront, not in a footnote.

**Why:** pattern-matching from training data, presented as analysis of *this specific* system, destroys trust and causes real decisions to be made on false foundations. A short verified answer always beats a long guessed one.

---

# Edit cleanly — no change-trails

When you change, resolve, or remove something, leave the artifact reading as if it had **always** been in its final state. Excise cleanly — don't replace removed content with a note that it's gone, and don't annotate the edit in place: no "(answered above)", `// was X, now Y`, "no longer needed", "moved to…", "previously…". Any rationale for the change goes in the change-tracking layer — the chat reply, commit message, or PR description — never inside the artifact itself.

Applies to all artifacts: code, comments, Slack messages/drafts, docs, plans.

**Keep-vs-cut test:** does the text describe the *current* state or a live constraint (keep — e.g. a `NOT X because Y` guardrail), or does it narrate the prior version / my edit (cut)?

**Why:** an artifact that narrates its own history is written for the reader who saw the last version; the reader who only sees the current state doesn't need it and it reads as clutter. History lives in git / edit history / the conversation.

---

# Coding Rules

**Always invoke the `/coding` skill before writing code to repository files** - exempt:
- Scratchpad files (`~/.claude/scratchpad/`)
- Inline execution (`uv run python -c "..."`, piped scripts) for debugging

## Learned
<!--
  CRITICAL: This section captures user preferences learned from corrections and mistakes.
  When the user corrects you or says "don't do X" / "always do Y", ADD IT HERE immediately.
  These are hard-won lessons — violating them repeats past mistakes. Treat as rules.
  Applies globally across all projects.
-->
- **PR merges**: Always use `--rebase` (not `--squash`)
- **Never commit LANGSMITH_API_KEY or PAI_API_TOKEN** or any API keys — even in config defaults
- **No fabrication**: see Rule Zero at top of file. Non-negotiable.

## Core
- **Analysis vs Action**: If asked to analyze or find bugs, do analysis only - pinpoint the issue but don't fix it, ask first
- **Bug certainty**: Don't claim you found a bug until 100% certain. If unsure, raise hypotheses with suggestions to pinpoint the cause (add logging, check specific conditions, etc.)
- **Investigate before claiming**: Never speculate about code you haven't read. Open and inspect files before explaining or proposing fixes
- **Keep it simple**: Avoid over-engineering. Only make changes directly requested or clearly necessary. Don't add features, abstractions, or "improvements" beyond what was asked
- **Parallel tools**: When calling multiple tools with no dependencies, make all independent calls in parallel

## Pre-Task Assessment

Before non-trivial work, evaluate thinking approaches (justify exclusion):

| Approach | Include When |
|----------|--------------|
| **Multi-perspective** | Multiple valid approaches exist, design tradeoffs |
| **Adversarial** | Security implications, claims need stress-testing |
| **First Principles** | Assumptions need examining, "why" > "how" |
| **Experimental** | Iterative hypothesis-test cycles needed |
| **Creative** | Divergent thinking, novel solutions required |

### Quick Format (optional, for complex tasks)
```
Assessment:
- Multi-perspective: EXCLUDE — single clear path
- Adversarial: INCLUDE — security change
- First Principles: EXCLUDE — requirements explicit
```

### Invalid Reasons to Exclude
- "Too simple" — hidden assumptions exist
- "Already know answer" — confidence ≠ verification
- "Takes too long" — correctness > speed

### When to Apply
- 3+ files touched
- Architectural decisions
- Security-related work
- Unclear root cause

## Plan Review

Before calling `ExitPlanMode`, spawn a **plan-reviewer subagent** to review the plan file. Pass it **only the plan file contents** — no conversation history, no background on the task.

The plan-reviewer agent (defined in `.claude/agents/plan-reviewer.md`) evaluates definition quality, approach quality, and technology fitness with fresh eyes and zero context.

After receiving the review, revise the plan to address every flagged item. Include a **"Review Notes"** section at the bottom of the plan with the format below. These notes will be passed to the code-reviewer agent after implementation, so each point must be self-contained and detailed enough for a reviewer with no prior context to verify.

```
## Review Notes

### [Reviewer Point Title]
- **Raised**: [Full description of what the reviewer flagged — the concern, the specific part of the plan it refers to, and why it matters]
- **Resolution**: [What was changed in the plan, or why it was left as-is. Include specific file/function/logic references]
- **Verify**: [What the code reviewer should check in the implementation to confirm this was handled correctly]
────────────────────────────────────────
```

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
- Fixing bugs (analyze and pinpoint the specific bug first)
- Production DB operations

## Never
- Commit secrets or `.env` files
- Kill/start processes or services - if something is down, ask user to restart it

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
