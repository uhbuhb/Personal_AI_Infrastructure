#!/usr/bin/env bun
/**
 * CollectSignals — read-only signal collector for skill-gap discovery. Writes nothing.
 * Adapted from the LifeOS SuggestSkills tool, re-sourced onto the stores this install has.
 *
 * Emits a normalized corpus (JSON to stdout) so the LLM step only clusters and judges;
 * it never gathers. Run at a fixed point over unchanged stores it is deterministic
 * (ordering fully tie-broken).
 *
 * NO FRUSTRATION SIGNAL EXISTS HERE, and the corpus says so in `missing`. Upstream
 * reads a ratings store written by a satisfaction-capture hook this install doesn't
 * have. Deriving one from prompt phrasing was tried and measured against 2,215 real
 * prompts: 15 candidate correction patterns produced ~10 matches, effectively all
 * false positives. This principal's corrections read as ordinary redirection, so any
 * phrase-matched "frustration" would be noise wearing the label of the strongest
 * signal. The clustering step must weight recurrence alone and must NOT read a clean
 * result as evidence that nothing is wrong.
 *
 * Paths are DISCOVERED, never hardcoded: flag > env var > default under --root.
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, basename } from "node:path";

const MAX_HISTORY_BYTES = 50_000_000;
const MAX_TEXT_CHARS = 300;

type Prompt = { date: string; project: string; text: string };
type Session = { project: string; mtime: string; transcripts: number };
type RegistryEntry = { kind: "skill" | "command"; name: string; description: string };

type Corpus = {
  window: { days: number; since: string };
  prompts: Prompt[];
  sessions: Session[];
  registries: RegistryEntry[];
  warnings: string[];
  missing: string[];
  sources: Record<string, string>;
};

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  if (i < 0 || i + 1 >= process.argv.length) return undefined;
  const v = process.argv[i + 1]!;
  return v.startsWith("-") ? undefined : v;
}

function intArg(flag: string, dflt: number, min: number, max: number, warnings: string[]): number {
  const v = arg(flag);
  if (v === undefined) return dflt;
  if (!/^-?\d+$/.test(v)) { warnings.push(`${flag}: not an integer (${v}); using ${dflt}`); return dflt; }
  let n = Number.parseInt(v, 10);
  if (n < min) { warnings.push(`${flag}: ${n} below ${min}; clamped`); n = min; }
  else if (n > max) { warnings.push(`${flag}: ${n} above ${max}; clamped`); n = max; }
  return n;
}

/** flag > env > first existing default under root. An explicit path that does not
 * exist is reported, never silently replaced by a default. */
function resolveStore(
  explicit: string | undefined, envVar: string, defaults: string[],
  root: string, label: string, warnings: string[],
): string | null {
  if (explicit !== undefined) {
    if (existsSync(explicit)) return explicit;
    warnings.push(`${label}: path ${explicit} does not exist`);
    return null;
  }
  const env = process.env[envVar];
  if (env && existsSync(env)) return env;
  for (const rel of defaults) {
    const d = join(root, rel);
    if (existsSync(d)) return d;
  }
  return null;
}

function clean(s: string): string {
  return s.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, MAX_TEXT_CHARS);
}

function readHistory(file: string | null, since: Date, warnings: string[], missing: string[]): Prompt[] {
  if (!file) { missing.push("history"); return []; }
  try {
    const st = statSync(file);
    if (!st.isFile()) { warnings.push("history: not a regular file"); return []; }
    if (st.size > MAX_HISTORY_BYTES) { warnings.push(`history: too large (${st.size} bytes), skipped`); return []; }
  } catch (e) { warnings.push(`history unreadable: ${(e as Error).message}`); return []; }

  let raw: string;
  try { raw = readFileSync(file, "utf8"); } catch (e) {
    warnings.push(`history unreadable: ${(e as Error).message}`);
    return [];
  }

  const prompts: Prompt[] = [];
  let bad = 0;

  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t) continue;
    let j: Record<string, unknown>;
    try { j = JSON.parse(t) as Record<string, unknown>; } catch { bad++; continue; }

    const display = typeof j.display === "string" ? j.display : "";
    const ms = typeof j.timestamp === "number" ? j.timestamp : NaN;
    if (!display.trim() || !Number.isFinite(ms)) { bad++; continue; }
    if (ms < since.getTime()) continue;

    const date = new Date(ms).toISOString().slice(0, 10);
    const project = basename(String(j.project ?? "")) || "(unknown)";
    prompts.push({ date, project, text: clean(display) });
  }

  if (bad > 0) warnings.push(`history: skipped ${bad} malformed line(s)`);
  return prompts.sort((a, b) => a.date.localeCompare(b.date) || a.text.localeCompare(b.text));
}

function collectSessions(dir: string | null, since: Date, warnings: string[], missing: string[]): Session[] {
  if (!dir) { missing.push("transcripts"); return []; }
  let names: string[];
  try { names = readdirSync(dir); } catch (e) { warnings.push(`transcripts dir unreadable: ${(e as Error).message}`); return []; }

  const out: Session[] = [];
  for (const name of names) {
    if (name.startsWith(".") || name.startsWith("_")) continue;
    try {
      const p = join(dir, name);
      if (!statSync(p).isDirectory()) continue;
      let newest = 0, count = 0;
      for (const f of readdirSync(p)) {
        if (!f.endsWith(".jsonl")) continue;
        const ms = statSync(join(p, f)).mtime.getTime();
        if (ms < since.getTime()) continue;
        count++;
        newest = Math.max(newest, ms);
      }
      if (count > 0) out.push({ project: name, mtime: new Date(newest).toISOString().slice(0, 10), transcripts: count });
    } catch { /* transient race on an entry — skip, don't fail the run */ }
  }
  return out.sort((a, b) => b.mtime.localeCompare(a.mtime) || a.project.localeCompare(b.project));
}

/** name + description from a SKILL.md's YAML frontmatter, handling block scalars. */
function readMeta(path: string): { name: string; description: string } | null {
  let txt: string;
  try { txt = readFileSync(path, "utf8"); } catch { return null; }
  const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(txt);
  const block = fm ? fm[1]! : txt;
  const name = /^name:\s*(.+)$/m.exec(block)?.[1]?.trim();
  if (!name) return null;

  let desc = /^description:\s*(.+)$/m.exec(block)?.[1]?.trim().replace(/^["']|["']$/g, "") ?? "";
  if (/^[>|][+-]?\d*$/.test(desc)) {
    const lines = block.split("\n");
    const di = lines.findIndex((l) => /^description:\s*[>|]/.test(l));
    const cont: string[] = [];
    for (let k = di + 1; k < lines.length; k++) {
      if (/^\s+\S/.test(lines[k]!)) cont.push(lines[k]!.trim());
      else break;
    }
    desc = cont.join(" ");
  }
  return { name, description: desc };
}

function collectRegistries(
  skillDirs: string[], commandDirs: string[], warnings: string[], missing: string[],
): RegistryEntry[] {
  const out: RegistryEntry[] = [];
  const seen = new Set<string>();

  if (skillDirs.length === 0) missing.push("skills");
  for (const dir of skillDirs) {
    let entries: string[] = [];
    try { entries = readdirSync(dir); } catch (e) { warnings.push(`skills dir unreadable: ${(e as Error).message}`); continue; }
    for (const d of entries) {
      const md = join(dir, d, "SKILL.md");
      if (!existsSync(md)) continue;
      const meta = readMeta(md);
      if (!meta) { warnings.push(`skills: ${d}/SKILL.md unreadable or missing name:`); continue; }
      if (seen.has(`skill:${meta.name}`)) continue;
      seen.add(`skill:${meta.name}`);
      out.push({ kind: "skill", name: meta.name, description: meta.description });
    }
  }

  for (const dir of commandDirs) {
    let entries: string[] = [];
    try { entries = readdirSync(dir); } catch { continue; }
    for (const f of entries) {
      if (!f.endsWith(".md")) continue;
      const meta = readMeta(join(dir, f));
      const name = meta?.name ?? basename(f, ".md");
      if (seen.has(`command:${name}`)) continue;
      seen.add(`command:${name}`);
      out.push({ kind: "command", name, description: meta?.description ?? "" });
    }
  }

  return out.sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name));
}

const HELP = `CollectSignals — read-only signal collector for skill-gap discovery (writes nothing).

Usage:
  bun CollectSignals.ts [--root <dir>] [--days <n>]
                        [--history <file>] [--transcripts <dir>] [--skills <dir>]

  --root <dir>         base for store defaults (default: $PAI_DIR, else $HOME/.claude)
  --days <n>           lookback window, 1-3650 (default: 45)
  --history <file>     prompt history JSONL
  --transcripts <dir>  per-project transcript dirs
  --skills <dir>       skills tree (the user-level tree is always included too)

Each store resolves flag > env > first existing default under --root.
Env: SKILLSCAN_ROOT, SKILLSCAN_HISTORY_FILE, SKILLSCAN_TRANSCRIPTS_DIR, SKILLSCAN_SKILLS_DIR

Emits on stdout: { window, prompts, sessions, registries, warnings, missing, sources }.
`;

function main(): void {
  if (process.argv.includes("--help") || process.argv.includes("-h")) { process.stdout.write(HELP); return; }

  const warnings: string[] = [];
  const missing: string[] = [];

  const root = arg("--root") ?? process.env.SKILLSCAN_ROOT ?? process.env.PAI_DIR
    ?? join(process.env.HOME ?? ".", ".claude");
  const days = intArg("--days", 45, 1, 3650, warnings);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const historyFile = resolveStore(arg("--history"), "SKILLSCAN_HISTORY_FILE", ["history.jsonl"], root, "history", warnings);
  const transcriptsDir = resolveStore(arg("--transcripts"), "SKILLSCAN_TRANSCRIPTS_DIR", ["projects"], root, "transcripts", warnings);
  const skillsDir = resolveStore(arg("--skills"), "SKILLSCAN_SKILLS_DIR", ["skills"], root, "skills", warnings);

  const userSkills = join(process.env.HOME ?? ".", ".claude", "skills");
  const skillDirs = [...new Set([skillsDir, existsSync(userSkills) ? userSkills : null].filter(Boolean) as string[])];
  const commandDirs = [join(root, "commands"), join(process.env.HOME ?? ".", ".claude", "commands")]
    .filter((d) => existsSync(d));

  const prompts = readHistory(historyFile, since, warnings, missing);
  missing.push("frustration-signal");

  const corpus: Corpus = {
    window: { days, since: since.toISOString().slice(0, 10) },
    prompts,
    sessions: collectSessions(transcriptsDir, since, warnings, missing),
    registries: collectRegistries(skillDirs, commandDirs, warnings, missing),
    warnings,
    missing,
    sources: {
      root,
      history: historyFile ?? "(none)",
      transcripts: transcriptsDir ?? "(none)",
      skills: skillDirs.join(", ") || "(none)",
      commands: commandDirs.join(", ") || "(none)",
    },
  };

  process.stdout.write(JSON.stringify(corpus, null, 2) + "\n");
}

main();
