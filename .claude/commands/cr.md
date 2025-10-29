---
name: cr
description: Comprehensive code review using code-reviewer agent (project, gitignored)
args: [scope]
---

# Code Review Automation

Perform comprehensive code review using the code-reviewer agent.

## Arguments

- `scope` (optional):
  - Number (e.g., `5`): Review last N commits
  - PR format (e.g., `PR786`): Review specific GitHub pull request
  - Omitted: Review entire codebase

## Instructions

1. **Determine scope:**
   - If argument matches `PR\d+` format: Review GitHub pull request
   - If argument is a number: Review last N commits
   - If no argument: Review entire codebase

2. **Gather context for PR review:**
   - Extract PR number from format `PR786` (remove "PR" prefix)
   - Run `gh pr view [number] --json title,body,author,headRefName,baseRefName,commits,files`
   - Run `gh pr diff [number]` to get full diff
   - Identify changed files and change categories
   - Note PR title, description, and branch context

3. **Gather context for commits:**
   - Run `git log -[count] --stat --format="commit %H%nAuthor: %an%nDate: %ad%nSubject: %s%n" --date=short`
   - Run `git diff HEAD~[count]..HEAD --stat` for changed files
   - Identify key files and change categories

4. **Gather context for full codebase:**
   - Run `git ls-files` to get all tracked files
   - Identify project structure and key directories
   - Note configuration files, test directories, main source paths

5. **Invoke code-reviewer agent:**
   - Use Task tool with `subagent_type="code-reviewer"`
   - Provide clear scope: "Review PR #N", "Review last N commits", or "Review entire codebase"
   - Include context gathered above
   - Request agent to focus on:
     - Security vulnerabilities
     - Data integrity issues
     - Architecture problems
     - Performance concerns
     - Production readiness

6. **Present results:**
   - Show agent's review findings
   - Highlight critical issues first
   - Include remediation suggestions
   - Ask boss if he wants detailed fixes for any items

## Output Format

Agent will provide:
- Critical issues (security, data integrity)
- Architecture concerns
- Performance optimization opportunities
- Actionable remediation plan with time estimates

## Important Notes

- Code-reviewer prioritizes critical issues over cosmetic ones
- Reviews focus on production readiness
- PR reviews evaluate changes in context of feature/fix intent
- Commit reviews show evolution of changes
- Full codebase reviews show overall architecture

## Examples

**Review PR #786:**
```
/cr PR786
```

**Review last 5 commits:**
```
/cr 5
```

**Review entire codebase:**
```
/cr
```
