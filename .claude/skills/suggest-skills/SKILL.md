---
name: suggest-skills
description: Discover WHICH new skills you should create, from your own prompt history and work sessions. Read-only and proposal-only — it surfaces recurring pain no existing skill or command covers and hands back a ranked shortlist. Use when asked what skills should I build, am I missing a skill, skill gap, suggest skills, based on my recent work.
argument-hint: [days to look back]
---

# Suggest Skills — what should I build next?

A read-only analytics pass over your own work. It answers one question: given what you have
actually been doing, is there a recurring problem that deserves its own skill and does not have
one yet? It proposes; you decide; `create-skill` builds. It has no capability to create or edit a
skill, by design — that permission boundary is what makes "never auto-create" real rather than a
promise in prose.

Adapted from the LifeOS `SuggestSkills` skill.

## Workflow

`Workflows/Scan.md` — the only workflow. In short:

1. **Gather deterministically.** Run `Tools/CollectSignals.ts`. The LLM does not gather; it only
   judges what the tool returns, so two runs over unchanged stores see the same evidence.
2. **Cluster by recurring pain.** Group the prompt corpus into themes, carrying how often each
   recurs and across how many separate sessions and projects.
3. **Dedup against real coverage.** For each candidate, read the BODIES of the skills and commands
   that might cover it. Name-match is not coverage — the covering unit must actually address the
   failure class.
4. **Verify with two independent passes, report the UNION.** Do not require both passes to agree:
   strict intersection suppresses exactly the subtle discipline gaps this exists to find. Tag each
   gap with its agreement level (both = high confidence, one = needs review).
5. **Propose, never create.** Emit a ranked shortlist with evidence. Route accepted proposals to
   `create-skill` as a separate step.

## The signal that is missing here

Upstream weights *frustration* (low satisfaction ratings) above raw topic frequency, because a
topic can look covered while you keep hitting the same wall inside it. **This install has no
frustration store**, and `CollectSignals.ts` reports `missing: ["frustration-signal"]` on every run.
Deriving one from prompt phrasing was measured against 2,215 real prompts and produced essentially
nothing but false positives.

So recurrence is the only weight available. Two consequences the scan must respect:

- A clean result is **not** evidence that nothing is wrong — it is a scan with its strongest signal
  unavailable. Say so in the output rather than reporting "no gaps found".
- Severity must be judged from the work itself (how long the thread ran, how many sessions it spans,
  whether the same ground is retrod), not from a rating that does not exist.

## Gotchas

- **Behavior is not a skill.** "Too verbose", "misread scope", "repeated a reminder" are steering
  feedback — route them to memory or CLAUDE.md, not to `create-skill`.
- **Recurrence is severity-weighted, not a bare count.** Three trivial prompts matter less than one
  long, painful, repeated migration.
- **Gathering is deterministic on purpose.** If you find yourself grepping history by hand, use the
  tool — hand-gathering makes runs non-reproducible.
- **A wider window makes the prompt list longer, not the analysis better.** The default 45-day
  window is the lever; widen it deliberately and expect the cluster step to carry the cost.
- **The corpus is your real prompts.** Redact secrets, client names, and personal paths from
  anything written out of this skill.
