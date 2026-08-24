import { homedir } from "os";
import { join } from "path";

export function expandPath(path: string): string {
  const home = homedir();
  return path
    .replace(/^\$HOME(?=\/|$)/, home)
    .replace(/^\$\{HOME\}(?=\/|$)/, home)
    .replace(/^~(?=\/|$)/, home);
}

export function paiDir(): string {
  const fromEnv = process.env.PAI_DIR;
  return fromEnv ? expandPath(fromEnv) : join(homedir(), ".claude");
}

export function paiPath(...segments: string[]): string {
  return join(paiDir(), ...segments);
}

/** Per-session scratch state for hooks. Gitignored; safe to delete at any time. */
export function statePath(hook: string, sessionId: unknown): { dir: string; file: string } {
  const raw = String(sessionId ?? "").trim();
  const safe = raw.replace(/[^A-Za-z0-9._-]/g, "_") || "unknown";
  const dir = paiPath("state", hook);
  return { dir, file: join(dir, `${safe}.json`) };
}
