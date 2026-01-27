---
name: pr
description: Create GitHub PR with AI-generated title and description from recent commits
disable-model-invocation: true
---

# GitHub Pull Request Automation

You are helping boss (orihab) create a GitHub pull request with an AI-generated title and description.

## Arguments

- `count` (optional): Number of commits to include in the PR. If not provided, auto-detect all unpushed commits on current branch.
- `base_branch` (optional): Target base branch for the PR (e.g., `main`, `master`, `develop`). If not provided, auto-detect.
- `pr_branch` (optional): Source branch for the PR. If not provided, uses current branch.

## Instructions

1. **Determine branches:**
   - **PR branch**: Use `pr_branch` arg if provided, otherwise get current branch: `git rev-parse --abbrev-ref HEAD`
   - **Base branch**: Use `base_branch` arg if provided, otherwise auto-detect:
     - Check repo's default branch: `gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name'`
     - Common defaults: `main`, `master`, `develop`
     - If unclear, ask boss which base branch to use

2. **Determine commit range:**
   - If `count` argument provided: Use last N commits
   - If no argument: Run `git log @{u}..HEAD --oneline` to find unpushed commits
   - If no upstream branch: Ask boss how many commits to include

3. **Analyze the commits:**
   - Run `git log -[count] --stat --format="commit %H%nAuthor: %an%nDate: %ad%nSubject: %s%n" --date=short`
   - Run `git diff [base-branch]...HEAD --stat` to see overall changes from base branch
   - Read commit messages and file changes to understand the full scope
   - Look at ALL commits that will be included (not just the latest one)

4. **Check current branch state:**
   - Run `git status` to see if there are uncommitted changes
   - If uncommitted changes exist, warn boss

5. **Generate PR title and description:**
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

6. **Present for approval (MUST GET EXPLICIT CONFIRMATION):**
   - Show the PR title
   - Show the full PR description
   - Show which commits will be included (hashes + subjects)
   - **IMPORTANT**: Show the branch mapping clearly: `[base_branch] ← [pr_branch]`
   - Remind boss: "Make sure you've pushed the branch first"
   - Ask boss: **"Should I create this PR?"** (wait for explicit "yes", "proceed", "go ahead", etc.)

7. **After explicit confirmation, create the PR:**
   - **DO NOT PUSH THE BRANCH** - boss handles all branch pushing
   - Create PR using gh CLI with base branch specified:
     ```bash
     gh pr create --base [base_branch] --head [pr_branch] --title "PR title" --body "$(cat <<'EOF'
     PR description here
     EOF
     )"
     ```
   - Use HEREDOC format for the body to handle multi-line descriptions
   - If PR creation fails (e.g., branch not pushed), show error and remind boss to push
   - Capture and display the PR URL

8. **Confirm completion:**
   - Show the PR URL
   - Show PR number
   - Remind him the PR is ready for review

## Important Reminders

- **NEVER push branches** - boss handles all branch pushing
- Analyze ALL commits in the range, not just the most recent one
- Always verify base and PR branches with boss before creating PR
- Show branch mapping clearly: `base ← pr_branch`
- Use `git diff [base]...HEAD` (three dots) to see changes since branch diverged
- If base_branch or pr_branch args not provided, auto-detect and verify with boss
- Check for uncommitted changes and warn boss if present
- Wait for explicit confirmation ("yes", "proceed", etc.) before running `gh pr create`

## Example Usage

```
/pr              # Auto-detect everything
/pr 5            # Last 5 commits
/pr 10 main      # Last 10 commits, target main
/pr 3 develop feature/new-ui   # 3 commits from feature/new-ui → develop
```
