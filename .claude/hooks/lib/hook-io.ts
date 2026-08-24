export interface HookInput {
  session_id?: string;
  transcript_path?: string;
  tool_name?: string;
  tool_input?: unknown;
  tool_response?: unknown;
  error?: unknown;
  hook_event_name?: string;
  stop_hook_active?: boolean;
}

/** 10MB cap — an unbounded read can balloon on a fast stream (upstream issue #1533). */
export async function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = "";
    const timer = setTimeout(() => resolve(data), 2000);
    process.stdin.on("data", (chunk) => {
      data += chunk.toString();
      if (data.length > 10_000_000) {
        clearTimeout(timer);
        try { process.stdin.pause(); } catch {}
        resolve(data);
      }
    });
    process.stdin.on("end", () => { clearTimeout(timer); resolve(data); });
    process.stdin.on("error", () => { clearTimeout(timer); resolve(data); });
  });
}

export function parseInput(raw: string): HookInput | null {
  if (!raw.trim()) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as HookInput) : null;
  } catch {
    return null;
  }
}

export function emitAdditionalContext(message: string, eventName?: string): void {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: eventName || "PostToolUse",
      additionalContext: message,
    },
  }) + "\n");
}
