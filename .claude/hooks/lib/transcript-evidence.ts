/**
 * transcript-evidence.ts — ground-truth evidence extraction for VerificationGate.
 * Ported from danielmiessler/LifeOS (LifeOS/install/hooks/lib/transcript-evidence.ts).
 *
 * The message is a CLAIM; the transcript is the EVIDENCE. Parses the current turn's
 * tool_use/tool_result pairs from a Claude Code transcript JSONL into an ordered
 * event index, so a message that SAYS "tests pass" but whose transcript shows no
 * test run cannot pass, and a terse message whose transcript shows a real green run does.
 *
 * Fail-OPEN on every ambiguity — this module must never be why a Stop breaks.
 */

import { readFileSync, existsSync, statSync, openSync, readSync, closeSync } from "fs";

export type EventKind =
  | "edit"          // Edit/Write/NotebookEdit
  | "test-run"      // pytest / bun test / go test / vitest / npm test / make test
  | "probe"         // curl/httpie/WebFetch to a URL
  | "command"       // any other Bash command (fallback — carries its result/error)
  | "agent-result"; // Agent/Task result text

export interface TxEvent {
  seq: number;
  kind: EventKind;
  tool: string;
  /** File path, URL host, or command excerpt — kind-specific. */
  target: string;
  resultText: string;
  /** Tool result errored, OR its text carries a failure marker. */
  isError: boolean;
  /** The tool_result's RAW is_error flag, no text heuristic. Ground truth for
   * "the tool actually failed": a read-only command whose OUTPUT quotes failure
   * words (`rg -n "exit 1"`) sets isError but never this. */
  isToolError: boolean;
  /** Doc-only edits (.md/.txt) don't count as code mutations. */
  isCode: boolean;
}

const CAP_BYTES = 8 * 1024 * 1024;

/**
 * Reads at most CAP_BYTES, seeking to the tail rather than loading the file and
 * trimming afterwards — this runs on every Stop (twice, when T5 also needs the
 * session window), so a multi-hundred-MB transcript must not be pulled into memory
 * to throw most of it away. The first line of a tail read is usually a partial
 * JSON object; parseLines drops it as unparseable.
 */
function safeRead(path: string | undefined): string | null {
  if (!path || !existsSync(path)) return null;
  let fd: number | null = null;
  try {
    const size = statSync(path).size;
    if (size <= CAP_BYTES) return readFileSync(path, "utf-8");
    const buf = Buffer.allocUnsafe(CAP_BYTES);
    fd = openSync(path, "r");
    const read = readSync(fd, buf, 0, CAP_BYTES, size - CAP_BYTES);
    return buf.subarray(0, read).toString("utf-8");
  } catch {
    return null;
  } finally {
    if (fd !== null) { try { closeSync(fd); } catch {} }
  }
}

function eTLD1(host: string): string {
  const parts = host.replace(/^https?:\/\//, "").split("/")[0]!.split(":")[0]!.split(".");
  return parts.length <= 2 ? parts.join(".") : parts.slice(-2).join(".");
}

function extractHost(cmd: string): string {
  const m = cmd.match(/https?:\/\/([^\s"'/]+)/i);
  return m ? eTLD1(m[1]!) : "";
}

const TEST_RE = /\b((uv\s+run\s+)?pytest|bun\s+test|go\s+test|cargo\s+test|vitest|npm\s+(run\s+)?test|jest|deno\s+test|make\s+test|tox)\b/i;
const PROBE_RE = /\bcurl\b|\bhttpie\b/i;
// An HTTP 4xx/5xx STATUS LINE or explicit failure words — NOT a bare "500"
// (which matches "500.42 KiB" in ordinary build output).
const ERROR_MARKERS = /\bHTTP[/ ]?\d(\.\d)?\s+[45]\d\d\b|\b(internal server error|traceback|connection refused|timed out|command not found|permission denied)\b|"?is_error"?\s*[:=]\s*true|\bexit\s+(code\s+)?[1-9]\d*\b/i;

/** True when result text signals a test actually passed (n>0 pass, 0 fail / exit 0). */
export function testResultPassed(text: string): boolean {
  if (/\b(\d+)\s+fail(ed|ing|ures?)?\b/i.test(text)) {
    const f = text.match(/\b(\d+)\s+fail/i);
    if (f && Number(f[1]) > 0) return false;
  }
  if (/\b0\s+pass\b/i.test(text)) return false;
  return /\b([1-9]\d*)\s+pass(ed|ing)?\b/i.test(text)
    || /\bexit(\s+code)?\s+0\b/i.test(text)
    || /\ball\s+(tests?\s+)?(pass|green)/i.test(text);
}

interface RawEntry { type?: string; role?: string; message?: any; content?: any; }

function parseLines(raw: string): { i: number; entry: RawEntry }[] {
  const out: { i: number; entry: RawEntry }[] = [];
  const lines = raw.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!.trim();
    if (!line) continue;
    try { out.push({ i, entry: JSON.parse(line) as RawEntry }); } catch { continue; }
  }
  return out;
}

/** Text of the most recent assistant message, or "". Fail-open to "". */
export function lastAssistantMessage(transcriptPath: string | undefined): string {
  const raw = safeRead(transcriptPath);
  if (!raw) return "";
  const parsed = parseLines(raw);
  for (let k = parsed.length - 1; k >= 0; k--) {
    const e = parsed[k]!.entry;
    const role = e.message?.role ?? e.role ?? e.type;
    if (role !== "assistant") continue;
    const content = e.message?.content ?? e.content;
    const text = typeof content === "string"
      ? content
      : Array.isArray(content)
        ? content.filter((b: any) => b?.type === "text").map((b: any) => String(b.text ?? "")).join("\n")
        : "";
    if (text.trim()) return text;
  }
  return "";
}

/**
 * Parse the CURRENT TURN (everything after the last real user message) into an
 * ordered event list. `sessionWindow` keeps the start at 0 so the whole transcript
 * counts — needed for publicity claims, where a probe three turns ago is still
 * real evidence. Returns [] on any read/parse failure (caller fails open).
 */
export function parseTurnEvents(
  transcriptPath: string | undefined,
  opts?: { sessionWindow?: boolean },
): TxEvent[] {
  const raw = safeRead(transcriptPath);
  if (!raw) return [];

  const parsed = parseLines(raw);
  const results = new Map<string, { text: string; isError: boolean }>();

  for (const { entry } of parsed) {
    const content = entry.message?.content ?? entry.content;
    if (!Array.isArray(content)) continue;
    for (const b of content) {
      if (b?.type === "tool_result" && b.tool_use_id) {
        const text = typeof b.content === "string" ? b.content
          : Array.isArray(b.content) ? b.content.map((c: any) => c?.text ?? "").join(" ") : "";
        results.set(b.tool_use_id, { text: String(text).slice(0, 4000), isError: b.is_error === true });
      }
    }
  }

  let turnStart = 0;
  if (!opts?.sessionWindow) {
    for (let k = parsed.length - 1; k >= 0; k--) {
      const e = parsed[k]!.entry;
      const role = e.message?.role ?? e.role ?? e.type;
      if (role !== "user" && role !== "human") continue;
      const content = e.message?.content ?? e.content;
      const isToolResultOnly = Array.isArray(content) && content.every((b: any) => b?.type === "tool_result");
      const hasText = typeof content === "string"
        ? content.trim().length > 0
        : Array.isArray(content) && content.some((b: any) => b?.type === "text" && b.text?.trim());
      if (!isToolResultOnly && hasText) { turnStart = k; break; }
    }
  }

  const events: TxEvent[] = [];
  let seq = 0;
  for (let k = turnStart; k < parsed.length; k++) {
    const content = parsed[k]!.entry.message?.content ?? parsed[k]!.entry.content;
    if (!Array.isArray(content)) continue;
    for (const b of content) {
      if (b?.type !== "tool_use") continue;
      const name = String(b.name ?? "");
      const input = b.input ?? {};
      const res = b.id ? results.get(b.id) : undefined;
      const resultText = res?.text ?? "";
      const isErrorFlag = res?.isError === true || (resultText ? ERROR_MARKERS.test(resultText) : false);
      const push = (kind: EventKind, target: string, isCode = false) =>
        events.push({ seq: seq++, kind, tool: name, target, resultText, isError: isErrorFlag, isToolError: res?.isError === true, isCode });

      if (name === "Edit" || name === "Write" || name === "NotebookEdit") {
        const p = String(input.file_path ?? input.notebook_path ?? "");
        push("edit", p, !!p && !/\.(md|markdown|txt)$/i.test(p));
      } else if (name === "Bash") {
        const cmd = String(input.command ?? "");
        if (TEST_RE.test(cmd) && !/--dry-run|--collect-only/.test(cmd)) push("test-run", cmd.slice(0, 120));
        else if (PROBE_RE.test(cmd)) push("probe", extractHost(cmd));
        // Fallback kept long: T5's public-surface probe matches against this text.
        else push("command", cmd.slice(0, 2000));
      } else if (name === "WebFetch") {
        push("probe", eTLD1(String(input.url ?? "")));
      } else if (name === "Agent" || name === "Task") {
        push("agent-result", String(input.description ?? name));
      }
    }
  }
  return events;
}

export function lastCodeMutationSeq(ev: TxEvent[]): number {
  let s = -1;
  for (const e of ev) if (e.kind === "edit" && e.isCode) s = Math.max(s, e.seq);
  return s;
}

export function hadCodeEdit(ev: TxEvent[]): boolean {
  return ev.some((e) => e.kind === "edit" && e.isCode);
}

export function spawnedAgent(ev: TxEvent[]): boolean {
  return ev.some((e) => e.kind === "agent-result");
}

/** A test ran after the last code edit and its result shows a pass. */
export function testPassedAfterEdit(ev: TxEvent[]): boolean {
  const after = lastCodeMutationSeq(ev);
  return ev.some((e) => e.seq > after && e.kind === "test-run" && !e.isError && testResultPassed(e.resultText));
}
