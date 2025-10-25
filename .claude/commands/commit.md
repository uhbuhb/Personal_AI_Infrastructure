---
name: commit
description: Automated git commit with AI-generated message following conventional commit standards
---

# Git Commit Automation

You are helping boss (orihab) create a git commit with an AI-generated commit message.

## Instructions

1. **Analyze the current state:**
   - Run `git status` to see untracked and modified files
   - Run `git diff` to see staged and unstaged changes
   - Run `git log -3 --oneline` to see recent commit style

2. **Determine what to commit:**
   - Look at the changes and identify what has been modified
   - Check if there are any files that should NOT be committed (credentials, .env, etc.)
   - Warn boss if you see anything suspicious

3. **Generate commit message:**
   - Follow conventional commits format: `type(scope): description`
   - Types: feat, fix, refactor, docs, test, chore, style, perf
   - Keep description concise and meaningful
   - Add body with bullet points if multiple changes
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
   - Stage the relevant files with `git add`
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
feat(frontend): add client-side caching to project store

- Implement 5-minute TTL cache for project data
- Update components to use service layer pattern
- Add cache invalidation on project updates

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```
