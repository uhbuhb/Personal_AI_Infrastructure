#!/usr/bin/env bun
/**
 * Global Context Loading Hook
 * 1. Loads MINIMAL.md (core identity + critical security)
 * 2. Updates tab title for current task
 *
 * Note: Full PAI context loaded on-demand via PAI skill system
 */

import { execSync } from 'child_process';

interface HookInput {
  session_id: string;
  prompt: string;
  transcript_path: string;
  hook_event_name: string;
}

/**
 * Read stdin with timeout
 */
async function readStdinWithTimeout(timeout: number = 5000): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    const timer = setTimeout(() => {
      reject(new Error('Timeout reading from stdin'));
    }, timeout);

    process.stdin.on('data', (chunk) => {
      data += chunk.toString();
    });

    process.stdin.on('end', () => {
      clearTimeout(timer);
      resolve(data);
    });

    process.stdin.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

async function main() {
  try {
    // Read the hook input from stdin
    const input = await readStdinWithTimeout();
    const data: HookInput = JSON.parse(input);

    const prompt = data.prompt || '';

    // 1. LOAD MINIMAL GLOBAL CONTEXT (always-needed, non-routing)
    const paiDir = process.env.PAI_DIR || `${process.env.HOME}/.claude`;
    const globalContextPath = `${paiDir}/skills/PAI/MINIMAL.md`;

    try {
      const file = Bun.file(globalContextPath);

      if (await file.exists()) {
        const globalContext = await file.text();

        if (globalContext && globalContext.trim().length > 0) {
          // Output the global context with markers
          console.log(`<user-prompt-submit-hook>\n${globalContext}\n</user-prompt-submit-hook>`);

          // Success indicator (sent to stderr)
          console.error(`✅ Global context loaded: ${globalContext.length} chars from ${globalContextPath}`);
        }
      } else {
        console.error(`⚠️  Global context file not found: ${globalContextPath}`);
      }
    } catch (error) {
      console.error(`⚠️  Failed to load global context: ${error}`);
      // Don't exit - continue with tab title update
    }

    // 2. UPDATE TAB TITLE
    // Generate quick fallback tab title
    let tabTitle = 'Processing request...';
    if (prompt) {
      const words = prompt.replace(/[^\w\s]/g, ' ').trim().split(/\s+/)
        .filter(w => w.length > 2 && !['the', 'and', 'but', 'for', 'are', 'with', 'you', 'can'].includes(w.toLowerCase()))
        .slice(0, 3);

      if (words.length > 0) {
        tabTitle = words[0].charAt(0).toUpperCase() + words[0].slice(1).toLowerCase();
        if (words.length > 1) {
          tabTitle += ' ' + words.slice(1).map(w => w.toLowerCase()).join(' ');
        }
        tabTitle += '...';
      }
    }

    // Set initial tab title with recycle emoji
    try {
      const titleWithEmoji = '♻️ ' + tabTitle;
      const escapedTitle = titleWithEmoji.replace(/'/g, "'\\''");
      execSync(`printf '\\033]0;${escapedTitle}\\007' >&2`);
      execSync(`printf '\\033]2;${escapedTitle}\\007' >&2`);
      execSync(`printf '\\033]30;${escapedTitle}\\007' >&2`);
    } catch (e) {
      // Silently fail
    }

    // Launch background process for better Haiku summary
    try {
      const cleanMessage = prompt.split('<user-prompt-submit-hook>')[0].trim();
      if (cleanMessage && cleanMessage.length > 3) {
        const paiDir = process.env.PAI_DIR || `${process.env.HOME}/.claude`;
        Bun.spawn(['bun', `${paiDir}/hooks/update-tab-title.ts`, cleanMessage], {
          stdout: 'ignore',
          stderr: 'ignore',
          stdin: 'ignore'
        });
      }
    } catch (e) {
      // Silently fail
    }

    process.exit(0);
  } catch (error) {
    // Silently fail to not interrupt Claude's flow
    console.error('Context loader error:', error);
    process.exit(0);
  }
}

main();
