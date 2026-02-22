---
name: create-skill
description: Scaffold a new Claude Code skill with proper structure, frontmatter, and best practices. Use when the user wants to create a new skill, slash command, or extend Claude's capabilities.
argument-hint: [skill-name]
---

# Create a New Skill

You are creating a new Claude Code skill named **$ARGUMENTS**.

## Process

### 1. Gather Requirements

Ask the user (use AskUserQuestion) to clarify the skill's purpose. Ask up to 4 questions covering:

- **What it does**: What should this skill accomplish? (free text — always ask this)
- **Scope**: Personal (`~/.claude/skills/`) or project (`.claude/skills/`)? Default to personal.
- **Invocation**: User-only (`/name`), Claude-auto, or both? Default to both.
- **Execution**: Inline (reference/guidelines) or forked subagent (isolated task)? Default to inline.

Adapt questions based on context — skip what's obvious from the skill name or arguments.

### 2. Design the Skill

Based on the answers, design the SKILL.md with proper YAML frontmatter and markdown content.

#### Frontmatter Fields (include only what's needed)

```yaml
---
name: skill-name                    # lowercase, hyphens only, max 64 chars
description: What it does and when  # REQUIRED — Claude uses this for auto-invocation
argument-hint: [args]               # if skill accepts arguments
disable-model-invocation: true      # if user-only invocation
user-invocable: false               # if Claude-only (background knowledge)
context: fork                       # if running in isolated subagent
agent: Explore                      # subagent type when context: fork
allowed-tools: Read, Grep, Glob     # restrict available tools
---
```

#### Content Best Practices

- Keep SKILL.md under 500 lines — move detailed reference to supporting files
- Use `$ARGUMENTS` for dynamic input, `$ARGUMENTS[N]` or `$N` for positional args
- Use `!`command`` for dynamic context injection (shell commands that run before prompt is sent)
- For task-oriented skills: write clear step-by-step instructions
- For reference skills: write conventions and patterns Claude should follow
- Include concrete examples of expected behavior or output format when helpful

#### Skill Directory Structure

```
skill-name/
├── SKILL.md           # Main instructions (required)
├── template.md        # Templates for Claude to fill in (optional)
├── examples/          # Example outputs (optional)
└── scripts/           # Utility scripts (optional)
```

Only create supporting files if the skill genuinely needs them. Most skills only need SKILL.md.

### 3. Create the Skill

1. Create the skill directory at the chosen scope
2. Write SKILL.md with frontmatter and content
3. Create any supporting files if needed
4. Show the user the final SKILL.md content
5. Tell the user how to test it:
   - Direct invocation: `/skill-name [args]`
   - Auto-invocation: describe a prompt that would trigger it
   - Verify it appears: ask "What skills are available?"
