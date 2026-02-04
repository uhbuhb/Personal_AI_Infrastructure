# MCP Server Configuration Guide

## What are MCP Servers?

Model Context Protocol (MCP) servers extend Claude Code's capabilities by connecting to external APIs, services, and tools. They're Claude's way of accessing capabilities beyond its built-in tools.

## Configuration Architecture

```
Claude Code (Client)
    ↓
MCP Configuration Files
    ├── ~/.claude/settings.json (user-level)
    ├── .mcp.json (project-level, git-tracked)
    └── Enterprise managed settings
    ↓
MCP Servers (Processes)
    ├── GitHub Server (PR, Issues, CI/CD)
    ├── Filesystem Server (File access)
    ├── Search Server (Web search)
    └── Custom Servers (Your tools)
```

## Essential Configuration

### Step 1: Enable Lazy Loading

**Critical for performance** - prevents unused servers from consuming context:

```json
{
  "lazyLoadMcp": true,
  "mcpToolLoadThreshold": 0.1
}
```

**Impact**:
- Before: All MCP tools loaded (~15K tokens)
- After: Tools loaded on-demand (~2K tokens)
- Savings: 87% reduction in tool overhead

### Step 2: Install Priority Servers

**Tier 1 - Universal Value:**

1. **GitHub** (PR management, issues)
```bash
claude mcp add github --scope user
```

2. **Filesystem** (explicit directories only)
```bash
claude mcp add filesystem -- npx -y @modelcontextprotocol/server-filesystem ~/Documents ~/Projects
```

3. **Sequential Thinking** (break down complex tasks)
```bash
claude mcp add sequential-thinking -- npx -y mcp-sequentialthinking-tools
```

### Step 3: Create Project Config

Create `.mcp.json` in project root (check into git):

```json
{
  "mcpServers": {
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "puppeteer": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    }
  }
}
```

## Configuration Methods

### Method 1: CLI Wizard (Quick but Limited)
```bash
claude mcp add github --scope user
# Follow prompts
```

**Pros**: Fast for simple configs
**Cons**: Difficult for complex setups

### Method 2: Direct JSON Edit (Recommended)
```bash
# Edit configuration
code ~/.claude/settings.json

# Restart Claude Code
claude
```

**Pros**: Full control, easy to version
**Cons**: Need to know structure

### Method 3: CLI with JSON (Best for Automation)
```bash
claude mcp add-json github '{"command":"npx","args":["-y","@modelcontextprotocol/server-github"],"env":{"GITHUB_PERSONAL_ACCESS_TOKEN":"'$GITHUB_TOKEN'"}}'
```

**Pros**: Scriptable, reproducible
**Cons**: Verbose syntax

## MCP Server Catalog

### Development Tools

**GitHub Server**
```json
{
  "github": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-github"],
    "env": {"GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"}
  }
}
```
**Use for**: PR reviews, issue triage, CI/CD triggering

**GitLab Server**
```json
{
  "gitlab": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-gitlab"],
    "env": {"GITLAB_TOKEN": "${GITLAB_TOKEN}"}
  }
}
```
**Use for**: GitLab MR management, pipeline control

**Filesystem Server**
```json
{
  "filesystem": {
    "command": "npx",
    "args": [
      "-y",
      "@modelcontextprotocol/server-filesystem",
      "/allowed/path1",
      "/allowed/path2"
    ]
  }
}
```
**Use for**: Access to project files, documentation

### Research & Information

**Brave Search**
```json
{
  "brave-search": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-brave-search"],
    "env": {"BRAVE_API_KEY": "${BRAVE_API_KEY}"}
  }
}
```
**Use for**: Real-time web information, current documentation

**Context7**
```json
{
  "context7": {
    "command": "npx",
    "args": ["-y", "@upstash/context7-mcp@latest"]
  }
}
```
**Use for**: Up-to-date API documentation

**Perplexity**
```json
{
  "perplexity": {
    "command": "npx",
    "args": ["-y", "perplexity-mcp"],
    "env": {"PERPLEXITY_API_KEY": "${PERPLEXITY_API_KEY}"}
  }
}
```
**Use for**: Advanced research queries

### Automation & Testing

**Puppeteer**
```json
{
  "puppeteer": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
  }
}
```
**Use for**: Browser automation, visual verification, screenshots

**Sequential Thinking**
```json
{
  "sequential-thinking": {
    "command": "npx",
    "args": ["-y", "mcp-sequentialthinking-tools"]
  }
}
```
**Use for**: Breaking down complex multi-step tasks

### Enterprise Tools

**Jira/Linear**
```json
{
  "jira": {
    "command": "npx",
    "args": ["-y", "jira-mcp"],
    "env": {
      "JIRA_URL": "${JIRA_URL}",
      "JIRA_TOKEN": "${JIRA_TOKEN}"
    }
  }
}
```
**Use for**: Ticket management, sprint planning

**Slack**
```json
{
  "slack": {
    "command": "npx",
    "args": ["-y", "slack-mcp"],
    "env": {"SLACK_TOKEN": "${SLACK_TOKEN}"}
  }
}
```
**Use for**: Team communication, notifications

**Sentry**
```json
{
  "sentry": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-sentry"],
    "env": {
      "SENTRY_ORG": "your-org",
      "SENTRY_PROJECT": "your-project",
      "SENTRY_TOKEN": "${SENTRY_TOKEN}"
    }
  }
}
```
**Use for**: Error tracking, debugging

## Security Best Practices

### 1. Explicit Directory Access Only

**Bad**:
```json
{
  "filesystem": {
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "/"]
  }
}
```

**Good**:
```json
{
  "filesystem": {
    "args": [
      "-y",
      "@modelcontextprotocol/server-filesystem",
      "/Users/yourname/Documents",
      "/Users/yourname/Projects"
    ]
  }
}
```

### 2. Use Environment Variables

**Bad**:
```json
{
  "env": {
    "GITHUB_TOKEN": "ghp_abc123..."  // NEVER hardcode
  }
}
```

**Good**:
```json
{
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
  }
}
```

### 3. Vet Servers Before Enabling

```bash
# Check server source code
npm view @modelcontextprotocol/server-github

# Review what permissions it needs
# Only enable trusted servers
```

### 4. Disable Unused Servers

```bash
# In Claude Code
@server-name disable

# Or via /mcp command
/mcp
# Toggle servers off
```

## Performance Optimization

### Monitor Context Impact

```bash
# Check token consumption
/context

# Look for "MCP Tool Schemas" row
# Should be <10K tokens total
```

### Lazy Loading Settings

```json
{
  "lazyLoadMcp": true,
  "mcpToolLoadThreshold": 0.1  // Load when exceeds 10% of context
}
```

**Auto-enabled in v2.1.7+** when MCP tools exceed 10%

### Multiple Instances of Same Server

```json
{
  "mcpServers": {
    "github-work": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {"GITHUB_PERSONAL_ACCESS_TOKEN": "${WORK_GITHUB_TOKEN}"}
    },
    "github-personal": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {"GITHUB_PERSONAL_ACCESS_TOKEN": "${PERSONAL_GITHUB_TOKEN}"}
    }
  }
}
```

## Troubleshooting

### Server Not Working?

**Step 1: Verify Installation**
```bash
claude mcp list
# Should show your server
```

**Step 2: Debug Mode**
```bash
claude --mcp-debug
# Launches with detailed MCP logs
```

**Step 3: Test Connectivity**
```bash
# For npm-based servers
echo '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05"},"id":1}' | \
npx @modelcontextprotocol/server-github
```

### Common Issues

**Issue**: "MCP server connection closed"
**Solution**: Check env variables are set, server package is installed

**Issue**: "Tool not available"
**Solution**: Ensure server is enabled, not just configured

**Issue**: "High context usage"
**Solution**: Enable lazy loading, disable unused servers

## Team Collaboration

### Project-Scoped Configuration

Create `.mcp.json` in repo root:

```json
{
  "mcpServers": {
    "puppeteer": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    },
    "sentry": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sentry"],
      "env": {
        "SENTRY_ORG": "company-org",
        "SENTRY_PROJECT": "main-project",
        "SENTRY_TOKEN": "${SENTRY_TOKEN}"
      }
    }
  }
}
```

**Benefits**:
- Every team member gets same servers
- No individual setup required
- Version controlled alongside code

### Team Standards

Document in CLAUDE.md:

```markdown
## MCP Servers

Required servers:
- GitHub: For PR and issue management
- Puppeteer: For UI testing

Setup:
1. Clone repo
2. Run: `cp .env.example .env`
3. Add your tokens to .env
4. Servers auto-configure from .mcp.json
```

## Advanced Patterns

### Conditional Server Loading

```markdown
# In CLAUDE.md or skill
For UI work: Use Puppeteer server
For backend: Disable Puppeteer to save context
```

### Server-Specific Skills

Create skills that leverage specific MCP servers:

```markdown
---
name: pr-review
allowed-tools:
  - "mcp__github__*"
---

# PR Review Workflow

1. Use GitHub MCP to fetch PR details
2. Read changed files
3. Provide structured review
```

### Custom MCP Servers

For company-specific tools:

```javascript
// custom-server.js
import { McpServer } from '@modelcontextprotocol/sdk';

const server = new McpServer({
  tools: {
    'deploy-to-staging': {
      description: 'Deploy to staging environment',
      handler: async (params) => {
        // Your deployment logic
      }
    }
  }
});
```

```json
{
  "custom-deploy": {
    "command": "node",
    "args": ["/path/to/custom-server.js"]
  }
}
```

## Summary

**Key Principles**:
1. Enable lazy loading (saves 87% context)
2. Use environment variables for secrets
3. Vet servers before enabling
4. Disable unused servers
5. Create project .mcp.json for teams

**Priority Setup**:
1. GitHub (essential for git workflows)
2. Filesystem (controlled access)
3. Sequential Thinking (task breakdown)
4. Puppeteer (if UI work)
5. Search (if research needed)

**Impact**:
- Well-configured MCP = 10x more capabilities
- Poorly configured = context bloat, security risks
- Lazy loading = best of both worlds
