#!/usr/bin/env bun
/**
 * Sync PAI context files from Railway API to local
 * Runs on session start to pull latest data from other machines.
 *
 * SAFEGUARD: If local file has unpushed changes (hash differs from
 * last sync), the pull is skipped to preserve local edits.
 */

import { createHash } from "crypto";
import { mkdirSync, existsSync, readFileSync } from "fs";
import { join } from "path";

const API_BASE = "https://web-production-3c90d.up.railway.app";
const API_TOKEN = process.env.PAI_API_TOKEN || "";
const PAI_DIR = process.env.PAI_DIR || "";
const CACHE_DIR = join(PAI_DIR, ".cache");

const FILES = [
  { name: "SKILL.md", endpoint: "/api/skill", path: `${PAI_DIR}/skills/PAI/SKILL.md` },
  { name: "PERSONAL.md", endpoint: "/api/personal", path: `${PAI_DIR}/skills/PAI/PERSONAL.md` },
  { name: "CONTACTS.md", endpoint: "/api/contacts", path: `${PAI_DIR}/skills/PAI/CONTACTS.md` },
  { name: "TODOS.md", endpoint: "/api/todos", path: `${PAI_DIR}/skills/PAI/TODOS.md` },
  { name: "FOLLOW_UPS.md", endpoint: "/api/followups", path: `${PAI_DIR}/skills/PAI/FOLLOW_UPS.md` },
];

function saveFileHash(fileName: string, content: string): void {
  try {
    // Ensure cache directory exists
    if (!existsSync(CACHE_DIR)) {
      mkdirSync(CACHE_DIR, { recursive: true });
    }

    const hash = createHash("sha256").update(content).digest("hex");
    const hashFile = join(CACHE_DIR, `${fileName}.hash`);
    Bun.write(hashFile, hash);
  } catch (error) {
    console.error(`Error saving hash for ${fileName}:`, error);
  }
}

function getLocalFileHash(filePath: string): string {
  try {
    if (!existsSync(filePath)) return "";
    const content = readFileSync(filePath, "utf-8");
    return createHash("sha256").update(content).digest("hex");
  } catch (error) {
    return "";
  }
}

function getCachedHash(fileName: string): string {
  try {
    const hashFile = join(CACHE_DIR, `${fileName}.hash`);
    if (!existsSync(hashFile)) return "";
    return readFileSync(hashFile, "utf-8").trim();
  } catch (error) {
    return "";
  }
}

async function syncFile(name: string, endpoint: string, localPath: string): Promise<"synced" | "skipped_local_changes" | "skipped_no_changes" | "error"> {
  try {
    // Check if local file has unpushed changes
    const localHash = getLocalFileHash(localPath);
    const cachedHash = getCachedHash(name);

    if (localHash && cachedHash && localHash !== cachedHash) {
      console.warn(`⚠️  ${name} has local changes - skipping pull to preserve edits`);
      console.warn(`   (Close your session to push changes, then start a new one)`);
      return "skipped_local_changes";
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch ${endpoint}: ${response.status}`);
      return "error";
    }

    const content = await response.text();

    // Safety check: Don't overwrite with empty content
    if (!content || content.trim().length === 0) {
      console.warn(`⚠️  API returned empty content for ${name}, skipping sync to preserve local file`);
      return "error";
    }

    // Check if API content is same as local (no need to sync)
    const apiHash = createHash("sha256").update(content).digest("hex");
    if (apiHash === localHash) {
      return "skipped_no_changes";
    }

    // Write to local file
    await Bun.write(localPath, content);

    // Save hash for change detection
    saveFileHash(name, content);

    return "synced";
  } catch (error) {
    console.error(`Error syncing ${endpoint}:`, error);
    return "error";
  }
}

async function main() {
  if (!API_TOKEN) {
    console.error("PAI_API_TOKEN environment variable not set. Skipping API sync.");
    return;
  }

  console.log("🔄 Syncing PAI context from API...");

  const results = await Promise.all(
    FILES.map(({ name, endpoint, path }) => syncFile(name, endpoint, path))
  );

  const synced = results.filter(r => r === "synced").length;
  const skippedLocal = results.filter(r => r === "skipped_local_changes").length;
  const skippedNoChanges = results.filter(r => r === "skipped_no_changes").length;
  const errors = results.filter(r => r === "error").length;

  if (skippedLocal > 0) {
    console.log(`⚠️  ${skippedLocal} file(s) have local changes - not overwritten`);
  }
  if (synced > 0) {
    console.log(`✅ Pulled ${synced} file(s) from Railway API`);
  }
  if (skippedNoChanges > 0) {
    console.log(`✨ ${skippedNoChanges} file(s) already up to date`);
  }
  if (errors > 0) {
    console.log(`❌ ${errors} file(s) failed to sync`);
  }
}

main();
