---
name: pr
description: Create GitHub PR with AI-generated title and description from recent commits
args: [count]
---

# GitHub Pull Request Automation

You are helping boss (orihab) create a GitHub pull request with an AI-generated title and description.

## Arguments

- `count` (optional): Number of commits to include in the PR. If not provided, auto-detect all unpushed commits on current branch.

## Instructions

1. **Determine commit range:**
   - If `count` argument provided: Use last N commits
   - If no argument: Run `git log @{u}..HEAD --oneline` to find unpushed commits
   - If no upstream branch: Ask boss how many commits to include

2. **Analyze the commits:**
   - Run `git log -[count] --stat --format="commit %H%nAuthor: %an%nDate: %ad%nSubject: %s%n" --date=short`
   - Run `git diff [base-branch]...HEAD --stat` to see overall changes
   - Read commit messages and file changes to understand the full scope
   - Look at ALL commits that will be included (not just the latest one)

3. **Check current branch state:**
   - Run `git status` to see if there are uncommitted changes
   - Run `git rev-parse --abbrev-ref HEAD` to get current branch name
   - Check if branch is pushed: `git rev-parse --abbrev-ref --symbolic-full-name @{u}`
   - Identify the base branch (usually `main` or `master`)

4. **Generate PR title and description:**
   - Title: Concise summary of the overall change (50-70 chars)
   - Description format:
     ```markdown
     ## Summary
     <2-4 bullet points describing the changes>

     ## Changes
     - **Category 1**: Description
     - **Category 2**: Description

     ## Files Changed
     <Key files and what changed>

     ## Impact
     <What this affects, performance considerations, breaking changes, etc.>

     🤖 Generated with [Claude Code](https://claude.com/claude-code)
     ```

5. **Present for approval:**
   - Show the PR title
   - Show the full PR description
   - Show which commits will be included
   - Ask boss if he wants to proceed

6. **Create the PR:**
   - Push branch if not already pushed: `git push -u origin [branch-name]`
   - Create PR using gh CLI:
     ```bash
     gh pr create --title "PR title" --body "$(cat <<'EOF'
     PR description here
     EOF
     )"
     ```
   - Use HEREDOC format for the body to handle multi-line descriptions
   - Capture and display the PR URL

7. **Confirm completion:**
   - Show the PR URL to boss
   - Remind him the PR is ready for review

## Important Reminders

- Analyze ALL commits in the range, not just the most recent one
- Base branch is usually `main` - but check the repo to be sure
- Use `git diff [base]...HEAD` (three dots) to see changes since branch diverged
- Don't force push unless explicitly requested
- Check for uncommitted changes before creating PR

## Example PR Format

**Title:**
```
Add client-side caching and fix service layer issues
```

**Description:**
```markdown
## Summary
- Implemented client-side caching in project store with 5-minute TTL
- Fixed type inconsistencies in project service
- Improved pre-push git hook reliability

## Changes
- **Caching**: Added TTL-based cache to reduce API calls
- **Type Safety**: Fixed artifact ID types (string vs number)
- **DevOps**: Updated git hooks for better branch detection

## Files Changed
- `stores/project-store.ts` - Caching implementation
- `services/project-service.ts` - Type fixes
- `.githooks/pre-push` - Branch detection fix

## Impact
- Reduces backend API load through intelligent caching
- Improves type safety across project service layer
- More reliable git hooks for new branches

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```
