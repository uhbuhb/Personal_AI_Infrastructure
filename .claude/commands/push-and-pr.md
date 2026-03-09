---
name: push-and-pr
description: Push current HEAD to hab/dev (or hab/<name>) and open PR to dev-agentic-os. INVOKE when user says push-and-pr, push and pr to agentic, or ship to agentic. (user)
user-invocable: true
arguments: $ARGUMENTS
---

# Push & PR to dev-agentic-os

Push current HEAD to a remote branch and create a PR targeting `dev-agentic-os`.

## Branch Resolution

- **No argument:** push to `hab/dev`
- **With argument** (e.g. `push-and-pr name1`): push to `hab/<argument>` (e.g. `hab/name1`)

## Instructions

### Phase 1: Pre-flight

1. **Check state:**
   - Run `git status` — warn if uncommitted changes exist
   - Run `git log -3 --oneline` to see what's being pushed
   - Run `git diff dev-agentic-os...HEAD --stat` to see scope of changes

### Phase 1.5: Resolve branch name

2. **Determine target branch:**
   - If `$ARGUMENTS` is empty/blank → use `hab/dev`
   - Otherwise → use `hab/$ARGUMENTS` (e.g. `$ARGUMENTS=fix` → `hab/fix`)
   - Store as `$BRANCH` for the remaining steps

### Phase 2: Push

3. **Push to remote:**
   ```bash
   git push origin HEAD:refs/heads/$BRANCH
   ```
   - If push fails, show error and stop

### Phase 3: Pull Request

4. **Check for existing PR:**
   - Run `gh pr list --head $BRANCH --base dev-agentic-os --state open` to check if a PR already exists
   - If a PR already exists, show its URL and stop — no need to create a duplicate

5. **Generate PR title and description:**
   - Run `git log dev-agentic-os...HEAD --oneline` to see all commits
   - Title: Concise summary (50-70 chars)
   - Description:
     ```markdown
     **Why:** <One sentence explaining the motivation/problem being solved>
     **Benefit:** <One sentence explaining the value/improvement this brings>

     ## Changes
     - <Bullet points describing the changes>

     ## Test plan
     - [ ] <Verification steps>
     ```

6. **Present for approval:**
   - Show title, description, and branch mapping: `dev-agentic-os <- $BRANCH`
   - Ask boss to confirm PR creation

7. **Create the PR:**
   ```bash
   gh pr create --base dev-agentic-os --head $BRANCH --title "title" --body "$(cat <<'EOF'
   description
   EOF
   )"
   ```

8. **Confirm completion:**
   - Show PR URL and number

## Important Reminders

- NEVER commit credentials, API keys, .env files
- Get explicit approval before PR creation
- If anything fails, stop and report
