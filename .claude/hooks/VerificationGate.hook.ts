#!/usr/bin/env bun
/**
 * VerificationGate — Stop hook. THE MESSAGE IS A CLAIM; THE TRANSCRIPT IS THE EVIDENCE.
 * Ported from danielmiessler/LifeOS (LifeOS/install/hooks/VerificationGate.hook.ts),
 * scoped to the claim types this repo's work actually produces.
 *
 * Claims are detected from the last assistant message; evidence ONLY from the
 * transcript's real tool calls — so rewording never passes the gate, and a terse
 * message whose transcript shows a green test run does.
 *
 * Types:
 *   TF  contradicted completion — final tool result hard-failed, message claims done. BLOCKS.
 *   T4  code/test claim with no passing test after the last code edit. LOG-ONLY
 *       (VERIFGATE_T4=1 arms it). Upstream ships this log-only too: its
 *       false-positive corpus was never proven clean.
 *   T5  publicity — "pushed / merged / released / public" with nothing in the
 *       session probing the remote. BLOCKS. Local state cannot prove remote state:
 *       a checkout sits ahead of origin with commits that were never pushed.
 *
 * Kill switches: VERIFGATE_OFF=1 (all), VERIFGATE_TF=0, VERIFGATE_T5=off|logonly,
 * VERIFGATE_T4=1 to arm. Fail-OPEN on any read/parse error.
 */

import { appendFileSync, mkdirSync, existsSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { createHash } from "crypto";
import { paiPath } from "./lib/paths";
import { readStdin, parseInput, type HookInput } from "./lib/hook-io";
import {
  parseTurnEvents, lastAssistantMessage,
  hadCodeEdit, spawnedAgent, testPassedAfterEdit,
  type TxEvent,
} from "./lib/transcript-evidence";

const OBS_PATH = paiPath("state", "verification-gate", "observability.jsonl");
const STATE_PATH = paiPath("state", "verification-gate", "blocked.json");

/**
 * Split on commas/semicolons too, so each claim in a comma-run summary is judged
 * against its OWN evidence. The lookarounds keep dotted numbers intact — a plain
 * split shredded "7.23.2 is public" into ["7","23","2 is public"], destroying the
 * version token. A newline always splits: no number spans two lines, and fusing
 * unrelated lines let a neighbouring hedge suppress a real claim.
 */
export function splitIntoUnits(text: string): string[] {
  return text
    .split(/\n+|(?<!\d)[.!?;,]+|[.!?;,]+(?!\d)/)
    .map((u) => (u ?? "").trim())
    .filter(Boolean);
}

/** A spec or example that CONTAINS "the tests pass" is not a claim. */
export function stripNoise(msg: string): string {
  return msg
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/^\s*>.*$/gm, " ");
}

const HONEST_DOWNGRADE =
  /\b(not\s+(yet\s+)?verif\w*|not\s+verified\b|haven'?t\s+(yet\s+)?(actually\s+)?(verif\w*|tested|run|checked)|not\s+(yet\s+)?tested|untested\b|pending\s+(verif\w*|test|review)|verifying\s+(next|now)|verify\s+next|checking\s+now|about\s+to\s+(verify|test|check)|running\s+the\s+(check|test|verification)|next[\s:]+verif\w*|couldn'?t\s+(verify|run|reach)|can'?t\s+(verify|run))\b/i;

const NONCLAIM =
  /\b(not|isn'?t|aren'?t|wasn'?t|weren'?t|doesn'?t|don'?t|didn'?t|won'?t|can'?t|cannot|couldn'?t|no\s+longer|still\s+(not|broken|failing)|never|needs?\s+to|should\s+be|would\s+be|make\s+sure|please|let'?s|going\s+to|will\s+be|to\s+be|want|hope|expect|if\s|once\s|when\s|after\s|assuming|would|could\s+you|can\s+you)\b/i;
const LEADING_INTERROGATIVE =
  /^\s*(is|are|does|do|did|can|could|should|would|will|has|have|how|why|what|where|when|which|who|isn'?t|aren'?t)\b/i;
const LEADING_IMPERATIVE =
  /^\s*(run|do|execute|try|click|open|deploy|add|set|install|go|check|make|use|call|start|restart|edit|write|create|build|test|verify|ensure|remember\s+to)\b/i;
const RECIPE = /\b(then|and\s+then|after\s+that)\b[^.\n]{0,40}\b(works?|is\s+live|verified|passes?)\b/i;
const ATTRIBUTION =
  /\b(you\s+(said|asked|told|mentioned)|per\s+the|according\s+to|the\s+(ticket|PR|docs?|user|issue|spec)\s+(say|says|said|claims?)|"[^"]*")\b/i;
const NARRATION =
  /\b(earlier|already|previously|in\s+(the\s+)?prior\s+turns?|prior\s+turns?|last\s+turn)\b|\b(in|back\s+in|since|during)\s+(19|20)\d\d\b/i;

export function unitIsClaimable(u: string, opts?: { allowNarration?: boolean }): boolean {
  if (u.includes("?")) return false;
  if (LEADING_INTERROGATIVE.test(u)) return false;
  if (LEADING_IMPERATIVE.test(u)) return false;
  if (RECIPE.test(u)) return false;
  if (NONCLAIM.test(u)) return false;
  if (ATTRIBUTION.test(u)) return false;
  // Re-describing an earlier turn's work must not be re-blocked. T5 opts out:
  // "already pushed" asserts remote state just as hard as the present tense.
  if (!opts?.allowNarration && NARRATION.test(u)) return false;
  return true;
}

// ── T4: code / test claims ───────────────────────────────────────────────────
const T4_CODE = /\b(tests?\s+(pass|green|passing)|\d+\s*\/\s*\d+\s+(pass|green)|all\s+(green|passing)|verified\s+(with|via)\s+a?\s*(run|test)|it\s+works\b)\b/i;

// ── T5: publicity claims ─────────────────────────────────────────────────────
// The narrow subclass where "did you check?" is answerable deterministically by
// one command. A bare version counts as a release surface only because the
// publicity predicate is required alongside it: "the service is at 7.24.2" never
// fires; "7.24.2 is released" does.
// A bare branch name is NOT a release surface. `main`/`master`/`origin` on their own
// made ordinary local-git and unrelated English fire: "the feature is already merged
// into main" (a local merge, nothing pushed) and "our main feature is now live for
// internal beta users" both blocked. Only remote-qualified forms count.
const T5_SURFACE = /\b(public\s+repo(sitory)?|github|the\s+remote|origin\/\S+|the\s+PR\b|pull\s+request|release[ds]?|published|v?\d+\.\d+\.\d+)\b/i;
// `out` and `open` are excluded: they carry non-publication senses that fired on
// "v2.3.1 is now out of support".
const T5_PREDICATE = /\b(is|are|'s|was|were|now|already|has\s+been|have\s+been)\s+(public|live|released|shipped|published|pushed|merged)\b/i;
// Local/staged nouns ⇒ a private-tree statement, never a publicity claim. The
// licensing clause is here because "released" has a non-publication sense: "this is
// released under MIT" asserts a license, not a shipped artifact.
const T5_LOCAL = /\b(local(ly)?|staged?|staging|working\s+tree|uncommitted|private\s+repo|scratchpad|draft\b)\b|\breleased\s+under\b|\bunder\s+(the\s+)?(MIT|Apache|BSD|GPL|MPL|LGPL)\b/i;
// Anything that actually reached the remote surface. Enumerable by construction —
// that is what makes T5 tractable.
const PUBLIC_PROBE =
  /\bgit\s+(ls-remote|fetch|push|pull)\b|\bgh\s+(api|pr|release|repo|run|search|workflow)\b|github\.com|\borigin\/\S+/i;

export function publicityClaimUnit(message: string): string | null {
  const units = splitIntoUnits(stripNoise(message)).filter((u) => unitIsClaimable(u, { allowNarration: true }));
  for (const u of units) {
    if (T5_LOCAL.test(u)) continue;
    if (T5_SURFACE.test(u) && T5_PREDICATE.test(u)) return u;
  }
  return null;
}

export function publicStateProbed(ev: { target: string }[]): boolean {
  return ev.some((e) => PUBLIC_PROBE.test(e.target));
}

// ── TF: contradicted completion ──────────────────────────────────────────────
const HARD_FAIL =
  /\btraceback\s*\(most recent call last\)|\bcommand not found\b|\bpermission denied\b|\bno such file or directory\b|\bexit(ed)?(\s+with)?(\s+code)?\s+[1-9]\d*\b|\bsegmentation fault\b|\bpanic:\s/i;
const COMPLETION =
  /\b(done|complete(d)?|finished|fixed|resolved|all\s+set|checks?\s+out|success(ful|fully)?|works?\s+(now|fine|correctly)|good\s+to\s+go|everything('?s)?\s+(fine|working|good))\b/i;
const ACKNOWLEDGES_FAILURE =
  /\b(fail(s|ed|ure|ing)?|error(s|ed)?|traceback|exception|broke|broken|didn'?t\s+(work|run|parse)|couldn'?t|hit\s+a\s+(snag|wall)|blocked)\b/i;

function completionClaimOverFailingOutput(message: string, resultText: string): string | null {
  if (!HARD_FAIL.test(resultText)) return null;
  const stripped = stripNoise(message);
  if (ACKNOWLEDGES_FAILURE.test(stripped)) return null;
  for (const u of splitIntoUnits(stripped).filter((u) => unitIsClaimable(u))) {
    if (COMPLETION.test(u)) return u;
  }
  return null;
}

/**
 * The raw is_error flag is required alongside the text match. HARD_FAIL alone
 * reads the OUTPUT, so any command merely quoting failure words fired it — a
 * successful `rg -n "exit 1"` read as a contradicted completion.
 */
export function contradictedCompletionUnit(message: string, evs: { isToolError: boolean; resultText: string }[]): string | null {
  if (evs.length === 0) return null;
  const last = evs[evs.length - 1]!;
  if (!last.isToolError) return null;
  return completionClaimOverFailingOutput(message, last.resultText);
}

/** The companion hole the is_error requirement leaves open: the final event printed
 * hard-failure text yet exited 0 (`cmd || true`). Logged, never blocked, so the
 * hole's real rate is measurable instead of invisible. */
export function suppressedContradictionUnit(message: string, evs: { isToolError: boolean; resultText: string }[]): string | null {
  if (evs.length === 0) return null;
  const last = evs[evs.length - 1]!;
  if (last.isToolError) return null;
  return completionClaimOverFailingOutput(message, last.resultText);
}

export function codeClaimUnit(message: string): string | null {
  for (const u of splitIntoUnits(stripNoise(message)).filter((u) => unitIsClaimable(u))) {
    if (T4_CODE.test(u)) return u;
  }
  return null;
}

// ── State + telemetry ────────────────────────────────────────────────────────
function fingerprint(session: string, type: string, unit: string): string {
  return createHash("sha256")
    .update(`${session}|${type}|${unit.toLowerCase().replace(/\s+/g, " ").trim()}`)
    .digest("hex").slice(0, 16);
}

function alreadyBlocked(fp: string): boolean {
  try {
    if (!existsSync(STATE_PATH)) return false;
    return (JSON.parse(readFileSync(STATE_PATH, "utf-8")) as string[]).includes(fp);
  } catch { return false; }
}

function recordBlocked(fp: string): void {
  try {
    mkdirSync(dirname(STATE_PATH), { recursive: true });
    let arr: string[] = [];
    if (existsSync(STATE_PATH)) { try { arr = JSON.parse(readFileSync(STATE_PATH, "utf-8")); } catch {} }
    arr.push(fp);
    if (arr.length > 400) arr = arr.slice(-400);
    writeFileSync(STATE_PATH, JSON.stringify(arr));
  } catch {}
}

function obs(rec: Record<string, unknown>): void {
  try {
    mkdirSync(dirname(OBS_PATH), { recursive: true });
    appendFileSync(OBS_PATH, JSON.stringify({ ts: new Date().toISOString(), ...rec }) + "\n");
  } catch {}
}

export function run(input: HookInput): object | null {
  if (process.env.VERIFGATE_OFF === "1") return null;
  if (input.stop_hook_active === true) { obs({ decision: "skip-recovery" }); return null; }

  const message = lastAssistantMessage(input.transcript_path);
  if (!message.trim()) return null;
  const session = input.session_id ?? "unknown";

  if (HONEST_DOWNGRADE.test(stripNoise(message))) { obs({ decision: "pass-honest-downgrade" }); return null; }

  let ev: TxEvent[] = [];
  try { ev = parseTurnEvents(input.transcript_path); } catch { obs({ decision: "pass-transcript-error" }); return null; }

  // TF — checked before the others: the contradiction is more specific than any
  // typing of the same prose. A sub-agent may hold the recovery evidence.
  if (process.env.VERIFGATE_TF !== "0" && !spawnedAgent(ev)) {
    const tfUnit = contradictedCompletionUnit(message, ev);
    if (tfUnit) {
      const fp = fingerprint(session, "TF", tfUnit);
      if (!alreadyBlocked(fp)) {
        recordBlocked(fp);
        obs({ decision: "block", type: "TF", unit: tfUnit });
        return {
          decision: "block",
          reason: `CONTRADICTED COMPLETION [VerificationGate/TF]. You claimed: "${tfUnit}" — but the turn's FINAL tool result is a hard failure (traceback / non-zero exit / not-found) with nothing succeeding after it. Either fix and re-run the failed step and show it passing, or state the failure honestly instead of claiming completion. This gate reads the transcript's real tool results — rewording won't pass it.`,
        };
      }
      obs({ decision: "pass-dedupe", type: "TF" });
    } else {
      const suppressed = suppressedContradictionUnit(message, ev);
      if (suppressed) obs({ decision: "log-suppressed", type: "TF", reason: "hard-fail-text-but-exit-0", unit: suppressed });
    }
  }

  // T5 — no sub-agent bypass and no act-then-claim precondition, both deliberate:
  // the cure is one command the parent runs in seconds, and this class's failure
  // mode is asserting WITHOUT acting, which an acted-gate would pass.
  if (process.env.VERIFGATE_T5 !== "off") {
    const pubUnit = publicityClaimUnit(message);
    if (pubUnit) {
      let sessionEv: TxEvent[] = [];
      try { sessionEv = parseTurnEvents(input.transcript_path, { sessionWindow: true }); } catch { sessionEv = ev; }
      if (publicStateProbed(sessionEv)) {
        obs({ decision: "pass-verified", type: "T5", unit: pubUnit });
      } else {
        const fp = fingerprint(session, "T5", pubUnit);
        if (alreadyBlocked(fp)) {
          obs({ decision: "pass-dedupe", type: "T5" });
        } else if (process.env.VERIFGATE_T5 === "logonly") {
          obs({ decision: "would-block-logonly", type: "T5", unit: pubUnit });
        } else {
          recordBlocked(fp);
          obs({ decision: "block", type: "T5", unit: pubUnit });
          return {
            decision: "block",
            reason: `UNPROBED PUBLICITY CLAIM [VerificationGate/T5]. You asserted: "${pubUnit}" — but nothing in this session probed the remote (no git ls-remote/fetch/push, no gh api/pr/run, no github.com fetch). Remote state is not knowable from a local checkout: a clone sits ahead of origin with commits that were never pushed. Run the probe and cite it, or downgrade the claim ("committed locally", "staged") or attribute it. This gate reads the transcript's real tool calls — rewording won't pass it.`,
          };
        }
      }
    }
  }

  // T4 — act-then-claim: only scrutinized when the turn actually edited code.
  const t4Unit = codeClaimUnit(message);
  if (!t4Unit) { obs({ decision: "no-claim" }); return null; }
  if (spawnedAgent(ev)) { obs({ decision: "pass-subagent", type: "T4", unit: t4Unit }); return null; }
  if (!hadCodeEdit(ev)) { obs({ decision: "pass-no-activity", type: "T4" }); return null; }
  if (testPassedAfterEdit(ev)) { obs({ decision: "pass-verified", type: "T4" }); return null; }

  const fp = fingerprint(session, "T4", t4Unit);
  if (alreadyBlocked(fp)) { obs({ decision: "pass-dedupe", type: "T4" }); return null; }

  if (process.env.VERIFGATE_T4 !== "1") {
    obs({ decision: "would-block-logonly", type: "T4", unit: t4Unit });
    return null;
  }

  recordBlocked(fp);
  obs({ decision: "block", type: "T4", unit: t4Unit });
  return {
    decision: "block",
    reason: `CODE VERIFICATION GAP [VerificationGate/T4]. You claimed: "${t4Unit}". The transcript shows code was edited this turn but no test run passed after the last edit. Run the test and show the output, or downgrade the claim honestly ("changed, not tested"). This gate reads the transcript's real tool calls — rewording won't pass it.`,
  };
}

function assert(cond: boolean, label: string): void { if (!cond) throw new Error(label); }

function runSelftest(): void {
  try {
    // Unit splitting keeps dotted numbers intact.
    assert(splitIntoUnits("7.23.2 is released").length === 1, "version token survives split");
    assert(splitIntoUnits("a is out, b works").length === 2, "comma splits units");

    // Claim guards.
    assert(!unitIsClaimable("is the PR merged"), "question is not a claim");
    assert(!unitIsClaimable("the tests do not pass"), "negation is not a claim");
    assert(!unitIsClaimable("run the tests and it works"), "imperative recipe is not a claim");
    assert(unitIsClaimable("the tests pass"), "plain assertion is claimable");

    // T5 corpus. The negatives are the expensive half: T5 blocks by default, so a
    // false positive halts a legitimate turn. Every negative below is a sentence
    // that DID wrongly block before the surface/predicate sets were narrowed.
    for (const s of [
      "The PR is merged",
      "v1.2.3 is released",
      "The fix is published to the public repo",
      "The pull request is merged",
      "It's live on github now",
    ]) assert(publicityClaimUnit(s) !== null, `T5 must fire: ${s}`);

    for (const s of [
      "The feature is already merged into main",      // local merge, nothing pushed
      "Our main feature is now live for internal beta users",
      "v2.3.1 is now out of support",
      "This is released under MIT",                    // licensing sense
      "committed locally, nothing pushed",
      "Is the PR merged?",
      "the service is at v1.2.3",
      "I rebased onto main and the tests are green",
      "origin is 3 commits behind",
      "I merged the upstream changes into my working tree",
      "master is checked out",
      "The dashboard is live in staging",
      "I have not pushed anything yet",
      "That refactor is done",
    ]) assert(publicityClaimUnit(s) === null, `T5 must NOT fire: ${s}`);
    assert(publicStateProbed([{ target: "git ls-remote origin" }]), "probe recognized");
    assert(!publicStateProbed([{ target: "git status" }]), "local command is not a probe");

    // TF requires the raw error flag, not just failure-looking text.
    assert(contradictedCompletionUnit("All done.", [{ isToolError: true, resultText: "Traceback (most recent call last)" }]) !== null, "TF fires on traceback + done");
    assert(contradictedCompletionUnit("All done.", [{ isToolError: false, resultText: "Traceback (most recent call last)" }]) === null, "TF silent when exit 0");
    assert(suppressedContradictionUnit("All done.", [{ isToolError: false, resultText: "exit code 1" }]) !== null, "suppressed hole is logged");
    assert(contradictedCompletionUnit("The run failed with a traceback.", [{ isToolError: true, resultText: "Traceback (most recent call last)" }]) === null, "TF silent when honest");

    // T4 detection.
    assert(codeClaimUnit("The tests pass") !== null, "T4 fires on tests pass");
    assert(codeClaimUnit("I have not run the tests") === null, "T4 silent on negation");

    // Noise stripping.
    assert(codeClaimUnit("```\nthe tests pass\n```") === null, "fenced code is not a claim");

    process.stdout.write("SELFTEST: PASS\n");
    process.exit(0);
  } catch (e) {
    process.stdout.write(`SELFTEST: FAIL ${e instanceof Error ? e.message : "unknown"}\n`);
    process.exit(1);
  }
}

if (import.meta.main) {
  (async () => {
    if (process.argv.includes("--selftest")) runSelftest();
    const input = parseInput(await readStdin());
    if (input) {
      try {
        const d = run(input);
        if (d) console.log(JSON.stringify(d));
      } catch { /* fail open */ }
    }
    process.exit(0);
  })().catch(() => process.exit(0));
}
