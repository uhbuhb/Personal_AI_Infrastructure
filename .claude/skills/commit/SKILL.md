---
name: commit
description: Automated git commit with AI-generated message following conventional commit standards
disable-model-invocation: true
---

# Git Commit Automation

You are helping boss (orihab) create a git commit with an AI-generated commit message.

## Instructions

1. **Analyze the current state:**
   - Run `git status` to see if there are staged changes
   - **CRITICAL: If in the middle of a rebase (git status shows "interactive rebase in progress"):**
     - NEVER use `git commit --amend`
     - ALWAYS create a new commit with `git commit`
     - Do NOT run `git rebase --continue` - let boss finish the rebase himself
   - **If nothing is staged:**
     - Run `git status` and `git diff` to see all changes
     - Make an intelligent decision about what should be staged:
       - Include modified files that are clearly part of the current work
       - Exclude untracked files unless they're obviously related
       - Exclude unrelated changes (e.g., TODO.md, README.md unless they're the main change)
     - Stage the relevant files using `git add <files>`
     - Confirm with boss about any files being excluded, explaining why
     - Wait for boss approval before proceeding
   - Run `git diff --staged` to see the staged diff
   - Run `git log -3 --oneline` to see recent commit style
   - **DO NOT ask about:**
     - Detached HEAD state - boss manages branches himself

2. **Generate commit message:**
   - Follow the format: `main_topic: change description`
   - Determine the main topic and description from the staged changes. If you aren't sure, give a couple of options to boss and ask which he prefers.
   - Keep description concise and meaningful
   - Add body with:
     - Motivation/reasoning for the change (1-2 sentences)
     - Bullet points describing the specific changes
   - Include the AI attribution footer:
     ```

     🤖 Generated with [Claude Code](https://claude.com/claude-code)

     Co-Authored-By: Claude <noreply@anthropic.com>
     ```

4. **Present for approval:**
   - Show the generated commit message
   - List which files will be committed
   - Ask boss if he wants to proceed

5. **Execute commit:**
   - Create the commit using HEREDOC format for the message
   - Run `git status` after to confirm

6. **Ask about next steps:**
   - Ask boss if he wants to push the changes
   - If yes, ask which remote branch (usually current branch)
   - Remind him: Only he pushes to remote (but you can do it if he explicitly confirms)

## Important Reminders

- NEVER commit credentials, API keys, .env files
- NEVER commit from ~/.claude/ to public repos
- Check `git remote -v` to verify you're in the right repo
- Use HEREDOC format for multi-line commit messages
- Don't push unless boss explicitly confirms

## Example Commit Message Format

```
code-reviewer: add mandatory backup file for reviews

This ensures reviews are preserved even if voice server or agent
communication fails, preventing loss of work.

- Add Write permissions to agent
- Implement timestamped markdown file backup
- Update output format to include backup file path

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```
