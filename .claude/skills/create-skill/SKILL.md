---
name: create-skill
description: Guide for creating new skills. Supports TWO types - PAI skills (user-level, cross-project) and Project skills (project-specific). Use when user wants to create, update, or structure a skill. Ask "PAI skill or project skill?" if unclear from context. (user)
user-invocable: true
---

# Create Skill - Skill Creation Framework

## When to Activate This Skill
- "Create a new skill for X"
- "Build a skill that does Y"
- "Add a skill for Z"
- "Create a project skill"
- "Update/improve existing skill"
- User wants to extend capabilities

## Step 1: PAI Skill vs Project Skill

**CRITICAL: Determine skill scope FIRST**

| Aspect | PAI Skill | Project Skill |
|--------|-----------|---------------|
| **Location** | `~/.claude/skills/` (symlinked to `~/PAI/.claude/skills/`) | `<project>/.claude/skills/` |
| **Scope** | Cross-project, personal | Single project only |
| **Use When** | Personal workflows, tools used everywhere | Project-specific config, patterns, integrations |
| **Examples** | `commit`, `research`, `prompting` | `sentry`, `database-access`, `sse-streaming` |
| **Visibility** | All sessions | Only when in that project |

### Decision Guide

**Create PAI Skill when:**
- Skill applies across multiple projects
- Personal workflow/preference (commit style, research method)
- General-purpose tool integration
- User says "I always want this"

**Create Project Skill when:**
- User says "project skill" or "for this project"
- Project-specific configuration (API keys, endpoints, org IDs)
- Codebase-specific patterns (architecture, conventions)
- Team/repo-specific integrations (Sentry, Grafana configs)
- Context only relevant to one codebase

**If unclear, ASK:** "Should this be a PAI skill (available everywhere) or a project skill (only for this repo)?"

## Step 2: Choose Complexity

**Simple Skill** (SKILL.md only):
- Single focused capability
- Quick reference suffices
- Examples: sentry config, commit patterns

**Complex Skill** (SKILL.md + CLAUDE.md + supporting files):
- Multi-step workflows
- Extensive context needed
- Examples: development guides, architecture docs

## Step 3: Create Directory Structure

```bash
# PAI Skill (user-level) - ~/.claude symlinks to ~/PAI/.claude
~/.claude/skills/[skill-name]/
├── SKILL.md           # Required
└── CLAUDE.md          # Optional (if complex)

# Project Skill (project-level)
<project-root>/.claude/skills/[skill-name]/
├── SKILL.md           # Required
└── CLAUDE.md          # Optional (if complex)
```

### Step 4: Write SKILL.md (Required)

Use this structure:
```markdown
---
name: skill-name
description: Clear description of what skill does and when to use it. Should match activation triggers.
---

# Skill Name

## When to Activate This Skill
- Trigger condition 1
- Trigger condition 2
- User phrase examples

## [Main Content Sections]
- Core workflow
- Key commands
- Examples
- Best practices

## Supplementary Resources
For detailed context: `read ${PAI_DIR}/skills/[skill-name]/CLAUDE.md`
```

### Step 5: Write CLAUDE.md (If Complex)

Include:
- Comprehensive methodology
- Detailed workflows
- Component documentation
- Advanced usage patterns
- Integration instructions
- Troubleshooting guides

### Step 6: Verify Discovery

**No registration needed** - Claude Code auto-discovers skills from:
- `~/.claude/skills/` (PAI/personal skills)
- `<project>/.claude/skills/` (project skills)

Verify with: "What skills are available?"

### Step 7: Test the Skill

1. Trigger it with natural language
2. Verify it loads correctly
3. Check all references work
4. Validate against examples

## Skill Naming Conventions

- **Lowercase with hyphens**: `create-skill`, `web-scraping`
- **Descriptive, not generic**: `fabric-patterns` not `text-processing`
- **Action or domain focused**: `ai-image-generation`, `chrome-devtools`

## Description Best Practices

Your description should:
- Clearly state what the skill does
- Include trigger phrases (e.g., "USE WHEN user says...")
- Mention key tools/methods used
- Be concise but complete (1-3 sentences)

**Good examples:**
- "Multi-source comprehensive research using perplexity-researcher, claude-researcher, and gemini-researcher agents. Launches up to 10 parallel research agents for fast results. USE WHEN user says 'do research', 'research X', 'find information about'..."
- "Chrome DevTools MCP for web application debugging, visual testing, and browser automation. The ONLY acceptable way to debug web apps - NEVER use curl, fetch, or wget."

## Templates Available

- `simple-skill-template.md` - For straightforward capabilities
- `complex-skill-template.md` - For multi-component skills
- `skill-with-agents-template.md` - For skills using sub-agents

## Supplementary Resources

For complete guide with examples: `read ${PAI_DIR}/skills/create-skill/CLAUDE.md`
For templates: `ls ${PAI_DIR}/skills/create-skill/templates/`

## Key Principles

1. **Progressive disclosure**: SKILL.md = quick reference, CLAUDE.md = deep dive
2. **Clear activation triggers**: User should know when skill applies
3. **Executable instructions**: Imperative/infinitive form (verb-first)
4. **Context inheritance**: Skills inherit global context automatically
5. **No duplication**: Reference global context, don't duplicate it
6. **Self-contained**: Skill should work independently
7. **Discoverable**: Description enables Kai to match user intent
