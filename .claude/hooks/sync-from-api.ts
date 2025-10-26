#!/usr/bin/env bun
/**
 * Sync PAI context files from Railway API to local cache
 * Runs on session start to ensure latest data
 */

import { createHash } from "crypto";
import { mkdirSync, existsSync } from "fs";
import { join } from "path";

const API_BASE = "https://web-production-3c90d.up.railway.app";
const API_TOKEN = process.env.PAI_API_TOKEN || "";
const PAI_DIR = process.env.PAI_DIR || "";
const CACHE_DIR = join(PAI_DIR, ".cache");

const FILES = [
  { name: "SKILL.md", endpoint: "/api/skill", path: `${PAI_DIR}/skills/PAI/SKILL.md` },
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

async function syncFile(name: string, endpoint: string, localPath: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch ${endpoint}: ${response.status}`);
      return false;
    }

    const content = await response.text();

    // Write to local file
    await Bun.write(localPath, content);

    // Save hash for change detection
    saveFileHash(name, content);

    return true;
  } catch (error) {
    console.error(`Error syncing ${endpoint}:`, error);
    return false;
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

  const successful = results.filter(Boolean).length;
  const total = FILES.length;

  if (successful === total) {
    console.log(`✅ Synced ${successful}/${total} files from Railway API`);
  } else if (successful > 0) {
    console.log(`⚠️  Synced ${successful}/${total} files (some failed)`);
  } else {
    console.log(`❌ Failed to sync files from API (using local cache)`);
  }
}

main();
