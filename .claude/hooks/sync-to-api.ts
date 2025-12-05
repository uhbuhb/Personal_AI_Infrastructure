#!/usr/bin/env bun
/**
 * Push local PAI context changes back to Railway API
 * Runs on session end to sync any local modifications
 */

import { createHash } from "crypto";
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const API_BASE = "https://web-production-3c90d.up.railway.app";
const API_TOKEN = process.env.PAI_API_TOKEN || "";
const PAI_DIR = process.env.PAI_DIR || "";
const CACHE_DIR = join(PAI_DIR, ".cache");

const FILES = [
  {
    name: "SKILL.md",
    endpoint: "/api/skill",
    path: `${PAI_DIR}/skills/PAI/SKILL.md`
  },
  {
    name: "PERSONAL.md",
    endpoint: "/api/personal",
    path: `${PAI_DIR}/skills/PAI/PERSONAL.md`
  },
  {
    name: "CONTACTS.md",
    endpoint: "/api/contacts",
    path: `${PAI_DIR}/skills/PAI/CONTACTS.md`
  },
  {
    name: "TODOS.md",
    endpoint: "/api/todos",
    path: `${PAI_DIR}/skills/PAI/TODOS.md`
  },
  {
    name: "FOLLOW_UPS.md",
    endpoint: "/api/followups",
    path: `${PAI_DIR}/skills/PAI/FOLLOW_UPS.md`
  },
];

function getFileHash(filePath: string): string {
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

async function pushFile(endpoint: string, filePath: string): Promise<boolean> {
  try {
    const content = readFileSync(filePath, "utf-8");

    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`Failed to push ${endpoint}: ${response.status} - ${error}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error pushing ${endpoint}:`, error);
    return false;
  }
}

async function main() {
  if (!API_TOKEN) {
    console.error("PAI_API_TOKEN environment variable not set. Skipping API sync.");
    return;
  }

  console.log("🔄 Checking for local changes to sync...");

  let changedFiles = 0;
  let syncedFiles = 0;

  for (const file of FILES) {
    const currentHash = getFileHash(file.path);
    const cachedHash = getCachedHash(file.name);

    if (currentHash && currentHash !== cachedHash) {
      console.log(`📤 Detected changes in ${file.name}, pushing to API...`);
      changedFiles++;

      const success = await pushFile(file.endpoint, file.path);
      if (success) {
        console.log(`✅ Successfully synced ${file.name} to Railway`);
        syncedFiles++;
      } else {
        console.log(`❌ Failed to sync ${file.name}`);
      }
    }
  }

  if (changedFiles === 0) {
    console.log("✨ No changes detected, API already up to date");
  } else if (syncedFiles === changedFiles) {
    console.log(`✅ Synced ${syncedFiles}/${changedFiles} changed files to Railway API`);
  } else {
    console.log(`⚠️  Synced ${syncedFiles}/${changedFiles} files (some failed)`);
  }
}

main();
