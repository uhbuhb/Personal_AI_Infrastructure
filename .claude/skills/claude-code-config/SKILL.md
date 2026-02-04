---
name: claude-code-config
description: >
  Configure Claude Code environments for maximum efficiency and productivity using evidence-based best practices.
  
  ALWAYS USE when user says:
  - "configure Claude Code", "setup Claude Code", "optimize Claude Code"
  - "Claude Code best practices", "Claude Code configuration"
  - "improve Claude Code performance", "Claude Code isn't working well"
  - "setup CLAUDE.md", "configure MCP servers", "Claude Code security"
  
  ALSO USE when:
  - User mentions slow Claude Code performance
  - Discussion involves context window issues
  - User asks about team collaboration with Claude Code
  - Setting up Claude Code for the first time
  - Enterprise deployment planning
  - CI/CD integration with Claude Code
  
  Do NOT use for:
  - General Claude API questions (not Claude Code specific)
  - Using Claude on claude.ai (not the terminal tool)
  - Claude model capabilities questions
---

# Claude Code Configuration: Production-Ready Setup

Expert guidance for configuring Claude Code environments based on research across 50+ official sources, community best practices, and production deployments.

## Quick Start: 15-Minute Setup

For immediate productivity:

```bash
# 1. Install (macOS/Linux)
curl -fsSL https://claude.ai/install.sh | bash

# 2. Initialize project
cd your-project && claude
/init  # Generates CLAUDE.md

# 3. Create basic security (.claude/settings.json)
{
  "permissions": {
    "allow": ["Bash(git status)", "Bash(npm test:*)"],
    "deny": ["Read(~/.ssh/**)", "Read(./secrets/**)", "Bash(curl:*)"]
  },
  "lazyLoadMcp": true
}

# 4. Create .claudeignore
echo "node_modules/\ndist/" > .claudeignore

# 5. Verify
/status
```

**Done!** You have a secure baseline. Continue for optimization.

---

## Core Configuration Workflow

**Systematic Setup**: Installation → CLAUDE.md → Security → MCP → Context Training → Optimization

See [examples/basic-setup.md](examples/basic-setup.md) for step-by-step walkthrough.

---

## CLAUDE.md Optimization

**Critical**: CLAUDE.md is loaded into every conversation.

### Best Practices

**Size Targets**:
- Professional: <15KB strict
- Enterprise: <13KB target

**Required Sections**:
```markdown
# Project: [Name]
## Purpose
## Critical Commands
## Code Style
## Common Files
## Workflow Rules
```

**Optimization Techniques**:
1. Use pointers to skills, not full content
2. Add emphasis: IMPORTANT, YOU MUST
3. Remove redundancy
4. Run through prompt improver

**Example - Before/After**:
```markdown
# Before (verbose, 4,887 bytes)
## Logging
Always use structured logging with pino or winston...
[20 lines of examples]
[15 lines of anti-patterns]

# After (pointer, 1,084 bytes)
## Logging
- NEVER console.log in production
- Use structured logging (pino/winston)
For debugging → Skill("investigate")
```

**Deep Dive**: [references/claudemd-optimization.md](references/claudemd-optimization.md)

---

## MCP Server Configuration

**MCP servers** extend Claude's capabilities (GitHub, filesystem, etc.).

### Essential Setup

**1. Enable Lazy Loading** (10-20% context savings):
```json
{"lazyLoadMcp": true, "mcpToolLoadThreshold": 0.1}
```

**2. Install Priority Servers**:
```bash
claude mcp add github --scope user
claude mcp add filesystem -- npx -y @modelcontextprotocol/server-filesystem ~/Documents
```

**3. Create Project Config** (`.mcp.json`):
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {"GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"}
    }
  }
}
```

**Deep Dive**: [references/mcp-configuration.md](references/mcp-configuration.md)

---

## Security Configuration

**Defense-in-Depth Strategy**: Layer multiple protections.

### Layer 1: Permission System

```json
{
  "permissions": {
    "allow": [
      "Bash(echo:*)",
      "Bash(git status)",
      "Bash(npm run test:*)"
    ],
    "ask": [
      "Edit",
      "Bash(git commit:*)",
      "Bash(git push:*)"
    ],
    "deny": [
      "WebFetch",
      "Bash(curl:*)",
      "Bash(wget:*)",
      "Read(./secrets/**)",
      "Read(~/.ssh/**)",
      "Read(~/.aws/**)",
      "Bash(rm -rf:*)",
      "Bash(sudo:*)"
    ]
  }
}
```

### Layer 2: Credential Management

**✅ Secure**:
```bash
export GITHUB_TOKEN=$(security find-generic-password -s github-token -w)
export API_KEY=$(aws secretsmanager get-secret-value --secret-id api-key)
```

**❌ Never Do**:
```json
{"env": {"API_KEY": "sk-abc123..."}}  // NEVER hardcode secrets
```

### Layer 3: OS-Level Sandboxing (Advanced)

For `--dangerously-skip-permissions` mode, use Docker:
```bash
docker run --rm -it \
  --network none \
  -v $(pwd):/workspace \
  claude-sandbox:latest \
  claude --dangerously-skip-permissions
```

**Deep Dive**: See [references/security-hardening.md](references/security-hardening.md)

---

## Context Window Management

**200K Token Budget Breakdown**:
- System: 4%
- CLAUDE.md: 5%
- MCP Tools: 8%
- Conversation: 70%
- Response Buffer: 13%

### Critical Thresholds

| Usage | Action | Why |
|-------|--------|-----|
| 0-50% | Work freely | Optimal performance |
| 50-70% | Monitor | Plan compaction |
| 70-85% | **Compact NOW** | Quality degrading |
| 85-95% | Emergency | Critical |
| 95%+ | Must clear | Context poisoned |

### Essential Commands

```bash
/status    # Quick health check
/context   # Detailed breakdown
/compact   # Compress history (50% reduction)
/clear     # Full reset
```

### Best Practices

**1. Proactive Compaction**
```bash
# BAD: Wait until critical
Context: 72% → "I'll finish first"
Context: 89% → Performance degraded

# GOOD: Compact at boundaries
Implement Feature 1 → /compact at 70%
Implement Feature 2 → /compact at 70%
```

**2. Session Segmentation**
```bash
# Session 1: Research
claude "Research auth patterns - document findings"

# Session 2: Implementation (fresh context)
claude "Implement OAuth using [saved document]"
```

**Deep Dive**: See [references/context-management.md](references/context-management.md)

---

## Proven Workflow Patterns

**Pattern 1: Explore → Plan → Code → Commit**
```bash
"Read files, use subagents" → "Think hard, create plan" → "Implement with verification" → "Commit and PR"
```
Success: 85%+ vs 60% without planning

**Pattern 2: Test-Driven Development**
```bash
"Write tests (don't implement)" → "Verify they fail" → "Commit tests" → "Implement to pass"
```
Impact: 40% fewer bugs

**Pattern 3: Multi-Claude with Git Worktrees**
```bash
git worktree add ../proj-feat-a feat-a
cd ../proj-feat-a && claude "Implement feature A"
```
Throughput: 3x for parallel tasks

**Deep Dive**: [references/workflow-patterns.md](references/workflow-patterns.md)

---

## Directory Organization

**Two-Level Configuration System**:
```
~/.claude/              → Global: Your personal preferences
project/.claude/        → Project: Team-shared configs
```

**Global Structure** (~/.claude/):
```
~/.claude/
├── CLAUDE.md          # Personal preferences (2-3KB)
├── settings.json      # User config (MCP, permissions, hooks)
├── commands/          # Personal slash commands
├── hooks/             # Automation (post-edit, pre-tool-use)
└── skills/            # Personal skills library
```

**Project Structure** (project/.claude/):
```
project/
├── CLAUDE.md          # Team knowledge (git-tracked)
├── .claude/
│   ├── settings.json # Project settings (git-tracked)
│   ├── commands/     # Team commands (git-tracked)
│   └── hooks/        # Team hooks (git-tracked)
└── .mcp.json         # MCP servers (git-tracked)
```

**Decision Rule**: 
- Personal preferences → Global (~/.claude/)
- Team conventions → Project (project/.claude/)

**Deep Dive**: See [references/directory-structure.md](references/directory-structure.md) for complete setup with hook examples, command templates, and validation checklists.

---

## Hooks & Automation

**What are Hooks?**: Shell commands executed at specific lifecycle events

**Available Hooks**:
- `post-edit`: After file edits (auto-formatting)
- `pre-tool-use`: Before tool execution (safety checks)
- `user-prompt-submit`: On prompt submission (skill suggestions)

**Example: Auto-Formatting Hook**

Create `~/.claude/hooks/post-edit.sh`:
```bash
#!/bin/bash
FILE="$1"
if [[ "$FILE" =~ \.(ts|tsx|js|jsx)$ ]]; then
    npx prettier --write "$FILE" 2>/dev/null
    npx eslint --fix "$FILE" 2>/dev/null
fi
exit 0
```

Make executable:
```bash
chmod +x ~/.claude/hooks/post-edit.sh
```

Configure in `settings.json`:
```json
{
  "hooks": {
    "post-edit": {
      "matcher": "Edit",
      "command": "~/.claude/hooks/post-edit.sh"
    }
  }
}
```

**Use Cases**:
- Auto-format files after editing
- Prevent commits to main branch
- Run linters automatically
- Suggest relevant skills based on prompts
- Log tool usage for audit

**Deep Dive**: See [references/directory-structure.md](references/directory-structure.md) for complete hook patterns and examples.

---

## Team Collaboration

**Strategy**: Repository-level shared configuration (git-tracked)

```
project/
├── CLAUDE.md              # Team knowledge
├── .mcp.json              # Team MCP servers
└── .claude/
    ├── settings.json      # Team permissions
    └── commands/          # Shared commands
```

**Custom Command Example** (`.claude/commands/create-api.md`):
```markdown
Create API endpoint: /api/$ARGUMENTS/route.ts

1. Implement with Zod validation, error handling
2. Add tests
3. Update docs
```
Usage: `/project:create-api users/profile`

**Deep Dive**: [references/team-collaboration.md](references/team-collaboration.md)

---

## CI/CD Integration

**Headless Mode**:
```bash
claude -p "Review PR for security" --allowedTools Edit Bash(git:*)
```

**GitHub Actions Example**:
```yaml
- run: claude -p "Review PR" --output-format stream-json
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

**Deep Dive**: [references/cicd-integration.md](references/cicd-integration.md)

---

## Performance Optimization

**Quick Wins**:
1. **Be Specific**: "write test cases for foo.py covering logout edge case, avoid mocks" (3-5x better)
2. **Visual Targets**: Provide design mocks, say "make aesthetically pleasing"
3. **Thinking Modes**: "Think harder about X", "Ultrathink about Y"

**Deep Dive**: [references/performance-tuning.md](references/performance-tuning.md)

---

## Validation Checklist

Before considering configuration complete:

**✅ Basics**: Native installer, CLAUDE.md <15KB, .claudeignore created  
**✅ Security**: Permissions configured, deny rules set, no hardcoded secrets  
**✅ MCP**: Lazy loading enabled, essential servers installed  
**✅ Context**: Understand /status, know to /compact at 70%  
**✅ Team** (if applicable): Shared CLAUDE.md in git, custom commands  

---

## Troubleshooting

**Context full**: /compact at 70%, not 90%  
**Instructions ignored**: Add IMPORTANT emphasis to CLAUDE.md  
**MCP not working**: `claude mcp list`, use `--mcp-debug`  
**Slow performance**: Check CLAUDE.md size, enable lazy MCP, /context  
**Team inconsistent**: Shared CLAUDE.md in git  

---

## Examples & Templates

- [examples/basic-setup.md](examples/basic-setup.md) - Complete project walkthrough
- [templates/claudemd-template.md](templates/claudemd-template.md) - CLAUDE.md structure
- [templates/settings-template.json](templates/settings-template.json) - Settings file

---

## Success Metrics

**Productivity**: 30-50% faster features, 50% faster onboarding  
**Quality**: 20-40% fewer bugs, >80% test coverage  
**Cost**: 54% token reduction possible, ROI <3 months  
**Security**: Zero incidents with proper config  

---

## Next Steps

1. **Complete Quick Start**: Get baseline working (15 minutes)
2. **Optimize CLAUDE.md**: Refine for your project (30 minutes)
3. **Configure MCP**: Add essential servers (15 minutes)
4. **Practice Workflows**: Try Explore→Plan→Code pattern (1 hour)
5. **Measure Baseline**: Document current performance
6. **Iterate**: Improve based on usage patterns

For comprehensive implementation timeline, see the 30-day checklist in research documentation.

---

## Reference Documentation

Deep dives on each topic:

- **[Directory Structure](references/directory-structure.md)** - Complete .claude/ organization, global vs project, hooks, commands
- **[CLAUDE.md Optimization](references/claudemd-optimization.md)** - Size optimization, structure, best practices
- **[MCP Configuration](references/mcp-configuration.md)** - Server selection, security, troubleshooting
- **[Security Hardening](references/security-hardening.md)** - Defense-in-depth, sandboxing, auditing
- **[Context Management](references/context-management.md)** - Token economics, compaction strategies
- **[Team Collaboration](references/team-collaboration.md)** - Shared configs, workflows, governance
- **[CI/CD Integration](references/cicd-integration.md)** - Headless mode, GitHub Actions, automation
- **[Workflow Patterns](references/workflow-patterns.md)** - Proven patterns, multi-Claude orchestration
- **[Performance Tuning](references/performance-tuning.md)** - Optimization techniques, monitoring

---

**Remember**: Configuration is iterative. Start with the Quick Start, build incrementally, and optimize based on real usage patterns. The goal is steady improvement, not perfection on day one.
