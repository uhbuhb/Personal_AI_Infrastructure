#!/usr/bin/env bun
/**
 * Pre-commit Documentation Updater
 *
 * Analyzes staged git changes and automatically updates relevant documentation
 * files including README.md and documentation/*.md
 *
 * This runs as part of the pre-commit hook to ensure documentation stays
 * in sync with code changes.
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

interface ChangeAnalysis {
  changedFiles: string[];
  affectedAreas: Set<string>;
  needsReadmeUpdate: boolean;
  needsDocUpdate: Map<string, boolean>;
}

/**
 * Get list of staged files in the git repository
 */
function getStagedFiles(): string[] {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=d', {
      encoding: 'utf-8',
    });
    return output.trim().split('\n').filter(f => f.length > 0);
  } catch (error) {
    console.error('Error getting staged files:', error);
    return [];
  }
}

/**
 * Analyze changed files to determine what documentation needs updating
 */
function analyzeChanges(files: string[]): ChangeAnalysis {
  const affectedAreas = new Set<string>();
  const needsDocUpdate = new Map<string, boolean>();

  // Map file paths to documentation areas
  for (const file of files) {
    // Skip if this IS a documentation file being changed
    if (file.startsWith('documentation/') || file === 'README.md') {
      continue;
    }

    // Map files to affected areas
    if (file.startsWith('skills/')) {
      affectedAreas.add('skills');
      needsDocUpdate.set('documentation/skills-system.md', true);
    } else if (file.startsWith('commands/')) {
      affectedAreas.add('commands');
      needsDocUpdate.set('documentation/command-system.md', true);
    } else if (file.startsWith('hooks/')) {
      affectedAreas.add('hooks');
      needsDocUpdate.set('documentation/hook-system.md', true);
    } else if (file.startsWith('agents/')) {
      affectedAreas.add('agents');
      needsDocUpdate.set('documentation/agent-system.md', true);
    } else if (file.startsWith('voice-server/')) {
      affectedAreas.add('voice');
      needsDocUpdate.set('documentation/voice-system.md', true);
    } else if (file === 'package.json' || file === 'bun.lockb') {
      affectedAreas.add('dependencies');
    } else if (file === '.mcp.json') {
      affectedAreas.add('mcp-servers');
    } else if (file === 'settings.json') {
      affectedAreas.add('settings');
    }
  }

  // Always update README if there are changes (to update last commit info)
  const needsReadmeUpdate = files.length > 0;

  return {
    changedFiles: files,
    affectedAreas,
    needsReadmeUpdate,
    needsDocUpdate,
  };
}

/**
 * Update README.md with information about latest changes
 */
function updateReadme(analysis: ChangeAnalysis): boolean {
  const readmePath = join(process.cwd(), 'README.md');

  if (!existsSync(readmePath)) {
    console.log(`${colors.yellow}⚠️  README.md not found, skipping update${colors.reset}`);
    return false;
  }

  try {
    let content = readFileSync(readmePath, 'utf-8');

    // Get current date
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    // Build a summary of changes
    const areas = Array.from(analysis.affectedAreas);
    const changesSummary = areas.length > 0
      ? `Updated: ${areas.join(', ')}`
      : 'Documentation and maintenance updates';

    // Update the "Recent Updates" section if it exists
    // Look for the version number pattern and update the date
    const versionPattern = /(\*\*📅 v\d+\.\d+\.\d+ - )(.*?)(\(.*?\)\*\*)/;
    if (versionPattern.test(content)) {
      // Update existing version with new date
      content = content.replace(
        versionPattern,
        `$1${changesSummary} (${dateStr})**`
      );
    }

    writeFileSync(readmePath, content, 'utf-8');
    console.log(`${colors.green}✅ Updated README.md${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.yellow}⚠️  Error updating README:${colors.reset}`, error);
    return false;
  }
}

/**
 * Update documentation files based on what changed
 */
function updateDocumentation(analysis: ChangeAnalysis): string[] {
  const updatedFiles: string[] = [];

  for (const [docFile, shouldUpdate] of analysis.needsDocUpdate) {
    if (!shouldUpdate) continue;

    const docPath = join(process.cwd(), docFile);

    if (!existsSync(docPath)) {
      console.log(`${colors.yellow}⚠️  ${docFile} not found, skipping${colors.reset}`);
      continue;
    }

    try {
      let content = readFileSync(docPath, 'utf-8');

      // Get current date
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];

      // Add or update "Last Updated" footer in the doc
      const lastUpdatedPattern = /<!-- Last Updated: .*? -->/;
      const lastUpdatedLine = `<!-- Last Updated: ${dateStr} -->`;

      if (lastUpdatedPattern.test(content)) {
        content = content.replace(lastUpdatedPattern, lastUpdatedLine);
      } else {
        // Add at the end of the file
        content = content.trimEnd() + `\n\n---\n${lastUpdatedLine}\n`;
      }

      writeFileSync(docPath, content, 'utf-8');
      updatedFiles.push(docFile);
      console.log(`${colors.green}✅ Updated ${docFile}${colors.reset}`);
    } catch (error) {
      console.error(`${colors.yellow}⚠️  Error updating ${docFile}:${colors.reset}`, error);
    }
  }

  return updatedFiles;
}

/**
 * Stage updated documentation files
 */
function stageFiles(files: string[]): void {
  if (files.length === 0) return;

  try {
    const filesToStage = files.join(' ');
    execSync(`git add ${filesToStage}`, { stdio: 'inherit' });
    console.log(`${colors.cyan}📝 Staged updated documentation files${colors.reset}`);
  } catch (error) {
    console.error(`${colors.yellow}⚠️  Error staging files:${colors.reset}`, error);
  }
}

/**
 * Main execution
 */
function main(): number {
  console.log(`\n${colors.blue}📚 Checking for documentation updates...${colors.reset}`);

  // Get staged files
  const stagedFiles = getStagedFiles();

  if (stagedFiles.length === 0) {
    console.log(`${colors.green}✅ No staged files to process${colors.reset}`);
    return 0;
  }

  // Filter out documentation files to avoid circular updates
  const nonDocFiles = stagedFiles.filter(f =>
    !f.startsWith('documentation/') &&
    f !== 'README.md' &&
    !f.startsWith('hooks/update-documentation.ts')
  );

  if (nonDocFiles.length === 0) {
    console.log(`${colors.green}✅ Only documentation files changed, no updates needed${colors.reset}`);
    return 0;
  }

  console.log(`${colors.cyan}📋 Analyzing ${nonDocFiles.length} changed files...${colors.reset}`);

  // Analyze what changed
  const analysis = analyzeChanges(nonDocFiles);

  if (analysis.affectedAreas.size === 0) {
    console.log(`${colors.green}✅ No documentation areas affected${colors.reset}`);
    return 0;
  }

  console.log(`${colors.cyan}🔍 Affected areas: ${Array.from(analysis.affectedAreas).join(', ')}${colors.reset}`);

  const updatedFiles: string[] = [];

  // Update README if needed
  if (analysis.needsReadmeUpdate) {
    if (updateReadme(analysis)) {
      updatedFiles.push('README.md');
    }
  }

  // Update documentation files
  const docFiles = updateDocumentation(analysis);
  updatedFiles.push(...docFiles);

  // Stage all updated files
  if (updatedFiles.length > 0) {
    stageFiles(updatedFiles);
    console.log(`${colors.green}✅ Documentation updated successfully${colors.reset}`);
    console.log(`${colors.cyan}   Updated files: ${updatedFiles.join(', ')}${colors.reset}\n`);
  } else {
    console.log(`${colors.green}✅ No documentation updates required${colors.reset}\n`);
  }

  return 0;
}

// Run the script
process.exit(main());
