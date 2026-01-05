---
name: commit-push-pr
description: Commit staged changes, push to remote branch, and create GitHub PR in one workflow
args: [branch_name, base_branch]
---

# Commit → Push → PR Automation

You are helping boss (orihab) commit, push, and create a PR in one streamlined workflow.

## Arguments

- `branch_name` (required): Remote branch name to push to and use for PR (e.g., `feature/add-caching`)
- `base_branch` (optional): Target base branch for the PR (e.g., `main`, `master`, `develop`). If not provided, auto-detect.

## Instructions

### Phase 0: Validate Arguments

0. **Check required arguments:**
   - If `branch_name` is not provided, ask boss for the remote branch name
   - Do not proceed without a branch name

### Phase 1: Commit

1. **Analyze the current state:**
   - Run `git status` to see staged changes
   - Run `git remote -v` to verify you're in the right repo
   - **If in the middle of a rebase**: STOP and warn boss - this command doesn't work during rebase
   - **If nothing is staged:**
     - Run `git diff` to see all changes
     - Make an intelligent decision about what should be staged
     - Stage relevant files using `git add <files>`
     - Explain what you're staging and why
   - Run `git diff --staged` to see the staged diff
   - Run `git log -3 --oneline` to see recent commit style

2. **Generate commit message:**
   - Format: `main_topic: change description`
   - Keep description concise and meaningful
   - Add body with motivation and bullet points
   - Include AI attribution footer

3. **Present commit for approval:**
   - Show the commit message
   - List files being committed
   - Ask boss to confirm the commit

4. **Execute commit:**
   - Create commit using HEREDOC format
   - Run `git status` to confirm

### Phase 2: Push

5. **Push to remote branch:**
   - Push HEAD to the specified remote branch: `git push origin HEAD:refs/heads/[branch_name]`
   - This pushes current HEAD directly to the remote branch without needing a local branch
   - If push fails, show error and stop

### Phase 3: Pull Request

6. **Determine PR scope:**
   - **Base branch**: Use `base_branch` arg if provided, otherwise:
     - Check repo's default: `gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name'`
   - **PR branch**: Use `branch_name` (the remote branch we just pushed to)
   - Run `git diff [base]...HEAD --stat` to see overall changes

7. **Generate PR title and description:**
   - Title: Concise summary (50-70 chars)
   - Description:
     ```markdown
     ## Summary
     <2-4 bullet points>

     ## Changes
     - **Category**: Description

     ## Files Changed
     <Key files and changes>

     🤖 Generated with [Claude Code](https://claude.com/claude-code)
     ```

8. **Present PR for approval:**
   - Show title and description
   - Show commits included
   - Show branch mapping: `[base] ← [branch_name]`
   - Ask boss to confirm PR creation

9. **Create the PR:**
   ```bash
   gh pr create --base [base_branch] --head [branch_name] --title "title" --body "$(cat <<'EOF'
   description
   EOF
   )"
   ```

10. **Confirm completion:**
    - Show PR URL
    - Show PR number

## Important Reminders

- NEVER commit credentials, API keys, .env files
- NEVER commit from ~/.claude/ to public repos
- Check `git remote -v` first
- Get explicit approval before commit
- Get explicit approval before PR creation
- If anything fails (commit, push, or PR), stop and report

## Example Usage

- `/commit-push-pr feature/add-caching` - pushes to `feature/add-caching`, auto-detects base branch
- `/commit-push-pr feature/add-caching main` - pushes to `feature/add-caching`, PR targets `main`

## Example Flow

```
Boss: /commit-push-pr feature/profile-caching

Kaia:
📋 Analyzing changes...

Staged files:
- src/feature.ts (modified)
- tests/feature.test.ts (new file)

📝 Proposed commit:

feature: add user profile caching

Reduces API calls by caching profile data with 5-minute TTL.

- Implement cache layer in profile store
- Add cache invalidation on profile update
- Add tests for cache behavior

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>

Should I commit these changes? [y/n]

Boss: y

Kaia:
✅ Committed: abc1234
🚀 Pushing HEAD to origin/feature/profile-caching...
✅ Pushed successfully

📋 PR Ready:

Title: Add user profile caching

Branches: main ← feature/profile-caching

## Summary
- Implement profile data caching with 5-minute TTL
- Add cache invalidation on updates
- Reduce unnecessary API calls

...

Should I create this PR? [y/n]

Boss: y

Kaia:
✅ PR #42 created: https://github.com/user/repo/pull/42
```
