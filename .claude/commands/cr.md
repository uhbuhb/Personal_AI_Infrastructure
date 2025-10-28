---
name: cr
description: Comprehensive code review using code-reviewer agent (project, gitignored)
args: [count]
---

# Code Review Automation

Perform comprehensive code review using the code-reviewer agent.

## Arguments

- `count` (optional): Number of commits to review. If omitted, reviews entire codebase.

## Instructions

1. **Determine scope:**
   - If `count` provided: Review last N commits
   - If no argument: Review entire codebase

2. **Gather context for commits:**
   - Run `git log -[count] --stat --format="commit %H%nAuthor: %an%nDate: %ad%nSubject: %s%n" --date=short`
   - Run `git diff HEAD~[count]..HEAD --stat` for changed files
   - Identify key files and change categories

3. **Gather context for full codebase:**
   - Run `git ls-files` to get all tracked files
   - Identify project structure and key directories
   - Note configuration files, test directories, main source paths

4. **Invoke code-reviewer agent:**
   - Use Task tool with `subagent_type="code-reviewer"`
   - Provide clear scope: "Review last N commits" or "Review entire codebase"
   - Include context gathered above
   - Request agent to focus on:
     - Security vulnerabilities
     - Data integrity issues
     - Architecture problems
     - Performance concerns
     - Production readiness

5. **Present results:**
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
- Commit reviews show evolution of changes
- Full codebase reviews show overall architecture

## Examples

**Review last 5 commits:**
```
/cr 5
```

**Review entire codebase:**
```
/cr
```
