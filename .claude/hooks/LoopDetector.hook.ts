#!/usr/bin/env bun
/**
 * LoopDetector — surfaces stuck-in-a-loop tool patterns while the session is live.
 * Ported from danielmiessler/LifeOS (LifeOS/install/hooks/LoopDetector.hook.ts).
 *
 * Three patterns over a rolling 20-call window: exact repeat, a-b-a-b oscillation,
 * and hammering one tool with repeated failures. Advisory only; fail-open.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { createHash } from "crypto";
import { statePath } from "./lib/paths";
import { readStdin, parseInput, emitAdditionalContext, type HookInput } from "./lib/hook-io";

const COOLDOWN = 4;
const WINDOW = 20;

interface WindowEntry { sig: string; tool: string; failed: boolean; ts: string; }
interface LoopState { window: WindowEntry[]; alerted: string[]; seq: number; lastAlert: number; }
interface StatePaths { dir: string; file: string; }
interface Detection { episodeKey: string; message: string; }

function isWindowEntry(item: unknown): item is WindowEntry {
  if (!item || typeof item !== "object") return false;
  const entry = item as Record<string, unknown>;
  return typeof entry.sig === "string" && typeof entry.tool === "string"
    && typeof entry.failed === "boolean" && typeof entry.ts === "string";
}

function readState(file: string): LoopState {
  if (!existsSync(file)) return { window: [], alerted: [], seq: 0, lastAlert: 0 };
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8"));
    return {
      window: Array.isArray(parsed?.window) ? parsed.window.filter(isWindowEntry) : [],
      alerted: Array.isArray(parsed?.alerted) ? parsed.alerted.filter((i: unknown) => typeof i === "string") : [],
      seq: typeof parsed?.seq === "number" ? parsed.seq : 0,
      lastAlert: typeof parsed?.lastAlert === "number" ? parsed.lastAlert : 0,
    };
  } catch {
    return { window: [], alerted: [], seq: 0, lastAlert: 0 };
  }
}

function persistState(paths: StatePaths, state: LoopState): void {
  mkdirSync(paths.dir, { recursive: true });
  writeFileSync(paths.file, JSON.stringify(state, null, 2));
}

function signatureFor(input: HookInput): string {
  const tool = input.tool_name || "unknown";
  const body = JSON.stringify(input.tool_input ?? {});
  return `${tool}:${createHash("sha256").update(body).digest("hex")}`;
}

function summarizeInput(input: unknown): string {
  const compact = JSON.stringify(input ?? {}).replace(/\s+/g, " ");
  return compact.length > 120 ? `${compact.slice(0, 117)}...` : compact;
}

/**
 * A failed tool call does not emit PostToolUse — Claude Code routes it to
 * PostToolUseFailure. The hook is registered for both; either the error field or
 * the event name marks the entry failed.
 */
function isFailure(input: HookInput): boolean {
  if (input.hook_event_name === "PostToolUseFailure") return true;
  return String(input.error ?? "").trim().length > 0;
}

function pushToWindow(state: LoopState, input: HookInput): void {
  state.window.push({
    sig: signatureFor(input),
    tool: input.tool_name || "unknown",
    failed: isFailure(input),
    ts: new Date().toISOString(),
  });
  if (state.window.length > WINDOW) state.window = state.window.slice(-WINDOW);
}

function detectExactRepeat(state: LoopState, input: HookInput): Detection | null {
  const sig = signatureFor(input);
  const matches = state.window.filter((entry) => entry.sig === sig);
  if (matches.length < 3) return null;
  const tool = input.tool_name || matches[matches.length - 1]?.tool || "unknown";
  return {
    episodeKey: `exact:${sig}`,
    message: `[LOOP DETECTED] You've called ${tool} ${matches.length} times with the same input this session without progress. Last input: ${summarizeInput(input.tool_input)}.`,
  };
}

function detectOscillation(state: LoopState): Detection | null {
  if (state.window.length < 4) return null;
  const last = state.window.slice(-4);
  const a = last[0].sig;
  const b = last[1].sig;
  const alternating = a !== b && last.every((entry, index) => entry.sig === (index % 2 === 0 ? a : b));
  if (!alternating) return null;
  return {
    episodeKey: `osc:${a}|${b}`,
    message: `[LOOP DETECTED] You're flip-flopping between ${last[0].tool} and ${last[1].tool} (a-b-a-b) without progress.`,
  };
}

function detectHammering(state: LoopState): Detection | null {
  const byTool = new Map<string, WindowEntry[]>();
  for (const entry of state.window.slice(-8)) byTool.set(entry.tool, [...(byTool.get(entry.tool) ?? []), entry]);
  for (const [tool, entries] of byTool) {
    const failedCount = entries.filter((entry) => entry.failed).length;
    if (entries.length >= 5 && failedCount >= 3) {
      return {
        episodeKey: `hammer:${tool}`,
        message: `[LOOP DETECTED] You've hit ${tool} ${entries.length} times in quick succession and ${failedCount} failed.`,
      };
    }
  }
  return null;
}

function firstNewDetection(state: LoopState, input: HookInput): Detection | null {
  for (const detection of [detectOscillation(state), detectExactRepeat(state, input), detectHammering(state)]) {
    if (detection && !state.alerted.includes(detection.episodeKey)) return detection;
  }
  return null;
}

export function processInput(input: HookInput, paths: StatePaths): string | null {
  const state = readState(paths.file);
  pushToWindow(state, input);
  state.seq += 1;
  let detection = firstNewDetection(state, input);
  if (detection && state.lastAlert > 0 && state.seq - state.lastAlert < COOLDOWN) detection = null;
  if (detection) { state.alerted.push(detection.episodeKey); state.lastAlert = state.seq; }
  persistState(paths, state);
  return detection?.message ?? null;
}

export function run(input: HookInput): string | null {
  try {
    return processInput(input, statePath("loop-detector", input.session_id));
  } catch {
    return null;
  }
}

function assertSelftest(condition: boolean, label: string): void {
  if (!condition) throw new Error(label);
}
function selftestPaths(name: string): StatePaths {
  const dir = join(process.env.TMPDIR || process.cwd(), "loop-detector-selftest");
  return { dir, file: join(dir, `${name}.json`) };
}

function runSelftest(): void {
  const session = `selftest-${process.pid}`;
  const paths = selftestPaths(session);
  try {
    const repeated = { tool_name: "Read", tool_input: { file: "a.ts" } };
    const messages = [processInput(repeated, paths), processInput(repeated, paths), processInput(repeated, paths)];
    assertSelftest(messages.filter(Boolean).length === 1 && Boolean(messages[2]), "identical third trigger");
    assertSelftest(processInput(repeated, paths) === null, "identical fourth stays silent");

    const varied = selftestPaths(`${session}-varied`);
    for (let index = 0; index < 5; index += 1) {
      assertSelftest(processInput({ tool_name: `Tool${index}`, tool_input: { index } }, varied) === null, "varied no trigger");
    }

    const osc = selftestPaths(`${session}-osc`);
    const oscMsgs = [
      processInput({ tool_name: "Read", tool_input: { f: "a" } }, osc),
      processInput({ tool_name: "Edit", tool_input: { f: "b" } }, osc),
      processInput({ tool_name: "Read", tool_input: { f: "a" } }, osc),
      processInput({ tool_name: "Edit", tool_input: { f: "b" } }, osc),
    ];
    assertSelftest(Boolean(oscMsgs[3]) && oscMsgs.filter(Boolean).length === 1, "oscillation fires at a-b-a-b");

    // Inputs vary so only detectHammering can fire.
    const ham = selftestPaths(`${session}-ham`);
    const hamMsgs = [0, 1, 2, 3, 4].map((index) =>
      processInput({
        tool_name: "Bash",
        tool_input: { index },
        ...(index < 3 ? { hook_event_name: "PostToolUseFailure", error: "Exit code 1" } : {}),
      }, ham),
    );
    assertSelftest(hamMsgs.some((m) => m?.includes("3 failed")), "hammering fires on 5 calls / 3 failures");

    const clean = selftestPaths(`${session}-clean`);
    const cleanMsgs = [0, 1, 2, 3, 4].map((index) =>
      processInput({ tool_name: "Bash", tool_input: { index } }, clean),
    );
    assertSelftest(cleanMsgs.every((m) => m === null), "hammering silent when nothing failed");

    assertSelftest(parseInput("") === null, "empty input");
    assertSelftest(parseInput("{not json") === null, "malformed input");

    process.stdout.write("SELFTEST: PASS\n");
    process.exit(0);
  } catch (error) {
    process.stdout.write(`SELFTEST: FAIL ${error instanceof Error ? error.message : "unknown"}\n`);
    process.exit(1);
  } finally {
    if (existsSync(paths.dir)) rmSync(paths.dir, { recursive: true, force: true });
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
