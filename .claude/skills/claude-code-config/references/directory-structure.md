# Complete .claude Directory Structure Guide

## Overview: Two-Level Configuration System

```
~/.claude/              → Global: Personal preferences across ALL projects
project/.claude/        → Project: Team-shared, version-controlled
```

**Key Principle**: Global for you, Project for your team.

---

## Global Configuration (~/.claude/)

### Complete Directory Tree

```
~/.claude/
├── CLAUDE.md                          # Personal preferences (2-3KB)
├── settings.json                      # User configuration (3-5KB)
├── commands/                          # Personal slash commands
│   ├── pr-review.md
│   ├── debug-production.md
│   ├── create-tests.md
│   └── deploy-checklist.md
├── hooks/                             # Automation hooks
│   ├── post-edit.sh                  # Auto-formatting
│   ├── pre-tool-use.sh               # Safety checks
│   └── user-prompt-submit.js         # Skill suggestions
└── skills/                            # Personal skills library
    ├── claude-code-config/
    ├── debugging/
    ├── api-design/
    ├── performance-optimization/
    └── testing-patterns/
```

### Size Guidelines

```
Component                        Target Size    Max Size
─────────────────────────────────────────────────────────
~/.claude/CLAUDE.md              2-3KB         5KB
~/.claude/settings.json          3-5KB         10KB
~/.claude/commands/*.md          1-2KB each    3KB each
~/.claude/hooks/*                <1KB each     2KB each
~/.claude/skills/*/SKILL.md      <2KB each     3KB each

Total context overhead: 10-15KB when active
```

---

## File-by-File Reference

### 1. ~/.claude/CLAUDE.md

**Purpose**: Universal personal preferences that apply to ALL projects

**Template**:
```markdown
# Global Development Preferences

## My Coding Style
- Prefer functional programming patterns
- TypeScript strict mode always
- Test-driven development
- IMPORTANT: Always explain complex logic with comments

## Common Tools
- Editor: VS Code with Vim bindings
- Shell: zsh with oh-my-zsh
- Git: Always sign commits

## My Workflow Preferences
- Break large tasks into small commits
- Write commit messages in imperative mood
- Review code before committing

## Communication Style
- Be direct and concise
- Show code examples
- Explain the "why" not just the "what"
```

**What to Include**:
- Personal coding philosophy
- Editor/tool preferences
- Communication style
- Universal workflow preferences

**What NOT to Include**:
- Project-specific patterns → project CLAUDE.md
- Team standards → project CLAUDE.md
- Company policies → project CLAUDE.md

**Size target**: 2-3KB

---

### 2. ~/.claude/settings.json

**Purpose**: User-level configuration for permissions, MCP, hooks

**Complete Template**:
```json
{
  "permissions": {
    "allow": [
      "Bash(echo:*)",
      "Bash(git status)",
      "Bash(git log:*)",
      "Bash(git diff:*)",
      "Bash(npm run test:*)",
      "Bash(pnpm test:*)"
    ],
    "ask": [
      "Edit",
      "Bash(git commit:*)",
      "Bash(git push:*)",
      "Bash(npm install:*)",
      "Bash(docker:*)"
    ],
    "deny": [
      "WebFetch",
      "Bash(curl:*)",
      "Bash(wget:*)",
      "Bash(rm -rf:*)",
      "Bash(sudo:*)",
      "Read(.env)",
      "Read(.env.*)",
      "Read(./secrets/**)",
      "Read(~/.ssh/**)",
      "Read(~/.aws/**)",
      "Edit(.env)"
    ]
  },

  "lazyLoadMcp": true,
  "mcpToolLoadThreshold": 0.1,
  
  "mcpServers": {
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {"GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"}
    },
    "filesystem": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "~/Documents"]
    }
  },

  "hooks": {
    "post-edit": {
      "matcher": "Edit",
      "command": "~/.claude/hooks/post-edit.sh"
    },
    "pre-tool-use": {
      "matcher": "Bash",
      "command": "~/.claude/hooks/pre-tool-use.sh"
    }
  },

  "autoCompactThreshold": 0.70,
  "disableAutoCompact": false,
  "maxTranscriptRetentionDays": 14,
  "enableAuditLog": true
}
```

**Size target**: 3-5KB

---

### 3. ~/.claude/commands/ (Custom Slash Commands)

**Purpose**: Personal slash commands available in ALL projects

#### Example: pr-review.md
```markdown
Perform comprehensive code review on current changes:

## Review Checklist
1. **Code Quality**
   - Follows style guidelines
   - No anti-patterns
   - Proper error handling

2. **Security**
   - No hardcoded secrets
   - Input validation
   - SQL injection prevention

3. **Performance**
   - No obvious bottlenecks
   - Efficient queries

4. **Testing**
   - Tests cover new functionality
   - Edge cases handled

5. **Documentation**
   - Complex logic commented
   - README updated

Provide specific feedback with line numbers.
```

**Usage**: `/pr-review`

#### Example: debug-production.md
```markdown
Help debug production issue: $ARGUMENTS

## Systematic Debugging Protocol

1. **Gather Context**
   - What's the symptom?
   - When did it start?
   - What's the impact?

2. **Investigate**
   - Check logs
   - Check monitoring
   - Check recent changes

3. **Form Hypothesis**
   - Based on evidence
   - Use subagent to verify

4. **Resolution**
   - Immediate mitigation
   - Root cause fix

5. **Document**
   - Incident report
   - Update runbooks

Follow systematic approach.
```

**Usage**: `/debug-production "users can't login"`

#### Example: create-tests.md
```markdown
Create comprehensive tests for: $ARGUMENTS

## Test Strategy

### Unit Tests
- Mock external dependencies
- Test pure logic
- Cover edge cases

### Integration Tests
- Use real database (test instance)
- Test API contracts
- Test error scenarios

### E2E Tests (if UI)
- Test happy path
- Test error scenarios
- Critical user flows

## Implementation Steps
1. Generate test file structure
2. Write test cases
3. Show me for review
4. Implement after approval
5. Verify tests pass

Follow TDD: Tests first, code second.
```

**Usage**: `/create-tests api/users/profile`

**Size target**: 1-2KB each

---

### 4. ~/.claude/hooks/ (Automation Hooks)

**Purpose**: Automated actions at specific lifecycle events

#### Hook: post-edit.sh (Auto-formatting)
```bash
#!/bin/bash
# Auto-format files after editing

FILE="$1"

if [[ "$FILE" =~ \.(ts|tsx|js|jsx)$ ]]; then
    npx prettier --write "$FILE" 2>/dev/null
    npx eslint --fix "$FILE" 2>/dev/null
elif [[ "$FILE" =~ \.(py)$ ]]; then
    black "$FILE" 2>/dev/null
    isort "$FILE" 2>/dev/null
elif [[ "$FILE" =~ \.(go)$ ]]; then
    gofmt -w "$FILE" 2>/dev/null
fi

exit 0
```

#### Hook: pre-tool-use.sh (Safety checks)
```bash
#!/bin/bash
# Prevent dangerous operations

TOOL_NAME="$1"
BRANCH=$(git branch --show-current 2>/dev/null)

# Block edits on main/master
if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
    if [[ "$TOOL_NAME" == "Edit" ]]; then
        echo "ERROR: Cannot edit files on main branch"
        exit 1
    fi
fi

exit 0
```

#### Hook: user-prompt-submit.js (Skill suggestions)
```javascript
#!/usr/bin/env node

const prompt = process.env.PROMPT || '';
const suggestions = [];

if (/\b(debug|bug|error)\b/i.test(prompt)) {
    suggestions.push('debugging');
}
if (/\b(test|spec)\b/i.test(prompt)) {
    suggestions.push('testing-patterns');
}

if (suggestions.length > 0) {
    console.log(`💡 Suggested skills: ${suggestions.join(', ')}`);
}
```

**Make executable**:
```bash
chmod +x ~/.claude/hooks/*.sh
chmod +x ~/.claude/hooks/*.js
```

**Size target**: <1KB each

---

### 5. ~/.claude/skills/ (Skills Library)

**Purpose**: Personal library of reusable skills

**Recommended Structure**:
```
skills/
├── claude-code-config/         # This skill
├── debugging/                  # Systematic debugging
├── api-design/                 # API best practices
├── performance-optimization/   # Performance patterns
└── testing-patterns/           # Testing strategies
```

**Organization Pattern**:
```
skill-name/
├── SKILL.md                    # Main skill (<500 lines)
├── README.md                   # Documentation
├── references/                 # Deep dives (on-demand)
├── examples/                   # Complete scenarios
└── templates/                  # Copy-paste templates
```

**Size target**: <2KB per SKILL.md

---

## Project Configuration (project/.claude/)

### Complete Directory Tree

```
my-project/
├── CLAUDE.md                   # Team knowledge (git-tracked)
├── .claude/
│   ├── settings.json          # Project settings (git-tracked)
│   ├── commands/              # Project commands (git-tracked)
│   │   ├── deploy-staging.md
│   │   ├── run-migrations.md
│   │   └── create-component.md
│   └── hooks/                 # Project hooks (git-tracked)
│       └── post-edit.sh
├── .mcp.json                  # MCP servers (git-tracked)
└── .claudeignore              # Exclusions (git-tracked)
```

### Size Guidelines

```
Component                        Target Size    Max Size
─────────────────────────────────────────────────────────
project/CLAUDE.md                8-13KB        15KB
project/.claude/settings.json    2-5KB         8KB
project/.claude/commands/*.md    1-2KB each    3KB each
project/.mcp.json                1-3KB         5KB
```

---

## Global vs Project Decision Matrix

| Content | Global | Project |
|---------|--------|---------|
| Personal preferences | ✅ | ❌ |
| Team conventions | ❌ | ✅ |
| Your workflow | ✅ | ❌ |
| Team workflow | ❌ | ✅ |
| Personal MCP servers | ✅ | ❌ |
| Team MCP servers | ❌ | ✅ |
| Personal commands | ✅ | ❌ |
| Team commands | ❌ | ✅ |
| Security deny rules | ✅ Both | ✅ |

**Rule**: Shareable → Project, Personal → Global

---

## Environment Setup

### Shell Configuration

**~/.zshrc or ~/.bashrc**:
```bash
# Claude Code Environment
export GITHUB_TOKEN=$(security find-generic-password -s github-token -w)
export ANTHROPIC_API_KEY=$(security find-generic-password -s anthropic-api -w)

# Optional: Performance
export MCP_TOOL_TIMEOUT=60000
export BASH_MAX_TIMEOUT_MS=120000
```

### Secure Credential Storage

**macOS (Keychain)**:
```bash
# Store
security add-generic-password -s github-token -a $USER -w

# Retrieve (automatic in .zshrc)
security find-generic-password -s github-token -w
```

**Linux (pass)**:
```bash
# Install
sudo apt-get install pass

# Store
pass insert github-token

# Retrieve in .bashrc
export GITHUB_TOKEN=$(pass github-token)
```

---

## Installation Steps

### Step 1: Create Structure
```bash
mkdir -p ~/.claude/{commands,hooks,skills}
touch ~/.claude/CLAUDE.md
touch ~/.claude/settings.json
```

### Step 2: Set Up Templates
```bash
# Use skill templates
cp claude-code-config/templates/claudemd-template.md ~/.claude/CLAUDE.md
cp claude-code-config/templates/settings-template.json ~/.claude/settings.json

# Edit for your preferences
code ~/.claude/CLAUDE.md
code ~/.claude/settings.json
```

### Step 3: Add Hooks
```bash
# Create post-edit hook
cat > ~/.claude/hooks/post-edit.sh << 'EOF'
#!/bin/bash
FILE="$1"
if [[ "$FILE" =~ \.(ts|tsx|js|jsx)$ ]]; then
    npx prettier --write "$FILE" 2>/dev/null
fi
exit 0
EOF

chmod +x ~/.claude/hooks/post-edit.sh
```

### Step 4: Install Skills
```bash
cp -r claude-code-config ~/.claude/skills/
```

### Step 5: Configure Environment
```bash
cat >> ~/.zshrc << 'EOF'

# Claude Code
export GITHUB_TOKEN=$(security find-generic-password -s github-token -w)
EOF

source ~/.zshrc
```

---

## Validation Checklist

### ✅ Structure Check
```bash
tree ~/.claude -L 2
# Should show organized structure

du -h ~/.claude/CLAUDE.md
# Should be: <5KB

ls -la ~/.claude/hooks/
# Should show: -rwxr-xr-x (executable)
```

### ✅ Claude Code Test
```bash
claude
/permissions  # Shows your config
/mcp         # Shows your servers
/            # Shows custom commands
```

### ✅ Environment Check
```bash
echo $GITHUB_TOKEN
# Should output value
```

---

## Maintenance Schedule

### Weekly (5 min)
- Review commands for obsolete ones
- Check CLAUDE.md for outdated info

### Monthly (30 min)
- Update MCP servers
- Audit permissions
- Optimize CLAUDE.md size

### Quarterly (1-2 hrs)
- Complete directory audit
- Review all hooks
- Reorganize skills
- Update documentation

---

## Troubleshooting

### Issue: Settings not applying

**Check precedence**:
```
Enterprise > CLI > Project > User
```

### Issue: Custom commands not showing

**Fix**:
- Verify `.md` extension
- Check file location
- Restart Claude Code

### Issue: Hooks not running

**Fix**:
```bash
chmod +x ~/.claude/hooks/*
```

---

## Summary

**Optimal Structure**:
- **Global** (~/.claude): Personal, 10-15KB overhead
- **Project** (.claude): Team, 15-25KB overhead

**Key Principles**:
1. Global for you, Project for team
2. Keep files small and focused
3. Use hooks for automation
4. Organize skills as library
5. Maintain regularly

**Total Setup**: 2 hours comprehensive
**Maintenance**: 30 min/month
**ROI**: Massive productivity gains
