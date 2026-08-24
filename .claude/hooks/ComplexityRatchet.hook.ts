#!/usr/bin/env bun
/**
 * ComplexityRatchet — PostToolUse advisory measuring the complexity a session ADDS.
 * Ported from danielmiessler/LifeOS (LifeOS/install/hooks/ComplexityRatchet.hook.ts).
 *
 * Baseline windowing is automatic: PostToolUse only ever sees NEW edits, so every
 * pre-existing line of debt is the baseline for free.
 *
 * ADVISE-ONLY by design. The tool has already run by PostToolUse, and a measurement
 * hook that can break an edit is worse than the debt it watches. Fail-open is
 * absolute: any parse, fs, or measurement error exits silently.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { statePath } from "./lib/paths";
import { readStdin, parseInput, emitAdditionalContext, type HookInput } from "./lib/hook-io";

const BIG_EDIT_LINES = 200;
const SESSION_BAND = 1000;

interface RatchetState { cumulative: number; deps: number; lastBand: number; alerted: string[]; }
interface StatePaths { dir: string; file: string; }

function readState(file: string): RatchetState {
  if (!existsSync(file)) return { cumulative: 0, deps: 0, lastBand: 0, alerted: [] };
  try {
    const p = JSON.parse(readFileSync(file, "utf8"));
    return {
      cumulative: typeof p?.cumulative === "number" ? p.cumulative : 0,
      deps: typeof p?.deps === "number" ? p.deps : 0,
      lastBand: typeof p?.lastBand === "number" ? p.lastBand : 0,
      alerted: Array.isArray(p?.alerted) ? p.alerted.filter((x: unknown) => typeof x === "string") : [],
    };
  } catch {
    return { cumulative: 0, deps: 0, lastBand: 0, alerted: [] };
  }
}

function persistState(paths: StatePaths, state: RatchetState): void {
  mkdirSync(paths.dir, { recursive: true });
  writeFileSync(paths.file, JSON.stringify(state, null, 2));
}

function lineCount(s: unknown): number {
  return typeof s === "string" && s.length ? s.split("\n").length : 0;
}

const DEP_LINE = /^\s*"[^"]+"\s*:\s*"[\^~>=<]*\d/;
const DEP_FILE = /(package\.json|pyproject\.toml|go\.mod)$/;
const PY_DEP_LINE = /^\s*"[^"]+[=<>~]=?[^"]*"\s*,?\s*$/;
const GO_DEP_LINE = /^\s*[a-z0-9.\-\/]+\s+v\d[^\s]*/i;

function depLines(text: string, filePath: string): Set<string> {
  const test = /package\.json$/.test(filePath) ? DEP_LINE
    : /pyproject\.toml$/.test(filePath) ? PY_DEP_LINE
    : GO_DEP_LINE;
  return new Set(text.split("\n").filter((l) => test.test(l)).map((l) => l.trim()));
}

function countNewDeps(oldStr: string, newStr: string, filePath: string): number {
  if (!DEP_FILE.test(filePath)) return 0;
  const before = depLines(oldStr, filePath);
  let added = 0;
  for (const l of depLines(newStr, filePath)) if (!before.has(l)) added += 1;
  return added;
}

interface Measure { net: number; deps: number; }

function measure(input: HookInput): Measure {
  const ti = (input.tool_input ?? {}) as Record<string, unknown>;
  const filePath = String(ti.file_path ?? "");
  const tool = input.tool_name;

  if (tool === "Edit") {
    const oldS = String(ti.old_string ?? "");
    const newS = String(ti.new_string ?? "");
    return { net: lineCount(newS) - lineCount(oldS), deps: countNewDeps(oldS, newS, filePath) };
  }

  if (tool === "MultiEdit") {
    const edits = Array.isArray(ti.edits) ? ti.edits : [];
    let net = 0, deps = 0;
    for (const e of edits) {
      const oldS = String((e as Record<string, unknown>)?.old_string ?? "");
      const newS = String((e as Record<string, unknown>)?.new_string ?? "");
      net += lineCount(newS) - lineCount(oldS);
      deps += countNewDeps(oldS, newS, filePath);
    }
    return { net, deps };
  }

  if (tool === "Write") {
    // PostToolUse can't see the pre-write length, so a whole-file rewrite reads as
    // its full size. Honest approximation: Write counts its content as added.
    const content = String(ti.content ?? ti.file_text ?? "");
    return { net: lineCount(content), deps: countNewDeps("", content, filePath) };
  }

  return { net: 0, deps: 0 };
}

export function processInput(input: HookInput, paths: StatePaths): string | null {
  const tool = input.tool_name;
  if (tool !== "Edit" && tool !== "Write" && tool !== "MultiEdit") return null;

  const m = measure(input);
  const state = readState(paths.file);
  if (m.net > 0) state.cumulative += m.net;
  state.deps += m.deps;

  const notes: string[] = [];

  if (m.deps > 0) {
    const key = `dep:${state.deps}`;
    if (!state.alerted.includes(key)) {
      state.alerted.push(key);
      notes.push(`added ${m.deps} new ${m.deps === 1 ? "dependency" : "dependencies"} (${state.deps} this session) — a dependency is the most expensive kind of complexity to walk back; confirm it earns its keep and that PE would sign off`);
    }
  }

  if (m.net > BIG_EDIT_LINES) {
    const key = `big:${state.cumulative}`;
    if (!state.alerted.includes(key)) {
      state.alerted.push(key);
      notes.push(`this edit added ${m.net} net lines in one shot — a blob that large is usually worth a second look for something simpler`);
    }
  }

  const band = Math.floor(state.cumulative / SESSION_BAND);
  if (band > state.lastBand) {
    state.lastBand = band;
    notes.push(`net complexity this session has crossed ~${band * SESSION_BAND} added lines — the ratchet only turns down when someone turns it; make sure the growth is deliberate`);
  }

  persistState(paths, state);
  return notes.length ? `[COMPLEXITY RATCHET] ${notes.join("; ")}.` : null;
}

export function run(input: HookInput): string | null {
  try {
    return processInput(input, statePath("complexity-ratchet", input.session_id));
  } catch {
    return null;
  }
}

function assert(cond: boolean, label: string): void { if (!cond) throw new Error(label); }
function testPaths(name: string): StatePaths {
  const dir = join(process.env.TMPDIR || process.cwd(), "complexity-ratchet-selftest");
  return { dir, file: join(dir, `${name}.json`) };
}
function bigString(lines: number): string {
  return Array.from({ length: lines }, (_, i) => `line ${i}`).join("\n");
}

function runSelftest(): void {
  const stamp = `${process.pid}`;
  try {
    const p1 = testPaths(`small-${stamp}`);
    assert(processInput({ tool_name: "Edit", tool_input: { file_path: "a.ts", old_string: "x", new_string: "x\ny" } }, p1) === null, "small edit silent");

    const p2 = testPaths(`big-${stamp}`);
    const bigMsg = processInput({ tool_name: "Write", tool_input: { file_path: "b.ts", content: bigString(250) } }, p2);
    assert(!!bigMsg && bigMsg.includes("net lines"), "big write fires blob advisory");

    const p3 = testPaths(`dep-${stamp}`);
    const depMsg = processInput({ tool_name: "Edit", tool_input: { file_path: "package.json", old_string: '  "deps": {\n', new_string: '  "deps": {\n    "left-pad": "^1.3.0"\n' } }, p3);
    assert(!!depMsg && depMsg.includes("dependency"), "new dep fires advisory");

    const p3b = testPaths(`pydep-${stamp}`);
    const pyMsg = processInput({ tool_name: "Edit", tool_input: { file_path: "pyproject.toml", old_string: "dependencies = [\n", new_string: 'dependencies = [\n  "httpx>=0.27",\n' } }, p3b);
    assert(!!pyMsg && pyMsg.includes("dependency"), "new python dep fires advisory");

    const p4 = testPaths(`ignore-${stamp}`);
    assert(processInput({ tool_name: "Bash", tool_input: { command: "ls" } }, p4) === null, "non-edit ignored");

    const p5 = testPaths(`band-${stamp}`);
    const bandMsg = processInput({ tool_name: "Write", tool_input: { file_path: "c.ts", content: bigString(1100) } }, p5);
    assert(!!bandMsg && bandMsg.includes("crossed"), "session band fires");
    assert(processInput({ tool_name: "Edit", tool_input: { file_path: "c.ts", old_string: "a", new_string: "a\nb" } }, p5) === null, "band silent once crossed");

    assert(parseInput("") === null && parseInput("{bad") === null, "bad input parses to null");

    process.stdout.write("SELFTEST: PASS\n");
    process.exit(0);
  } catch (e) {
    process.stdout.write(`SELFTEST: FAIL ${e instanceof Error ? e.message : "unknown"}\n`);
    process.exit(1);
  } finally {
    const dir = testPaths("x").dir;
    if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  }
}

if (import.meta.main) {
  (async () => {
    if (process.argv.includes("--selftest")) runSelftest();
    const input = parseInput(await readStdin());
    if (input) {
      const message = run(input);
      if (message) emitAdditionalContext(message, input.hook_event_name);
    }
    process.exit(0);
  })().catch(() => process.exit(0));
}
