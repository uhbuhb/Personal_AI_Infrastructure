import { existsSync, readFileSync } from "fs";
import { paiPath } from "./paths";

/**
 * Populate process.env from the gitignored .env, for keys not already set.
 *
 * Claude Code has no .env loading of its own — a settings.json `env` block is the
 * only thing it injects, and that file is tracked, so a credential there is one
 * `git add` away from being published. Secrets live in .env; this is how our own
 * scripts read them.
 *
 * A real environment value always wins, so an export can still override .env.
 * Silent no-op when the file is absent: a missing credential is the caller's to
 * report, not this loader's.
 */
export function loadDotEnv(file = paiPath(".env")): void {
  if (!existsSync(file)) return;
  let raw: string;
  try { raw = readFileSync(file, "utf-8"); } catch { return; }

  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim().replace(/^export\s+/, "");
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    if (process.env[key] !== undefined) continue;
    let value = t.slice(eq + 1).trim();
    if (value.length >= 2 && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}
