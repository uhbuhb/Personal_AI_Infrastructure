---
name: prompting
description: Prompt engineering, context engineering, and skill creation. Covers clarity, structure, Claude 4.x patterns, and creating new skills. INVOKE for prompt help, agent design, or creating skills.
user-invocable: true
---

# Prompting Skill

## When to Activate This Skill
- Prompt engineering questions
- Context engineering guidance
- AI agent design
- Prompt structure help
- Best practices for LLM prompts
- Agent configuration
- Creating new skills

## Core Philosophy
**Context engineering** = Curating optimal set of tokens during LLM inference

**Primary Goal:** Find smallest possible set of high-signal tokens that maximize desired outcomes

## Key Principles

### 1. Context is Finite Resource
- LLMs have limited "attention budget"
- Performance degrades as context grows
- Every token depletes capacity
- Treat context as precious

### 2. Optimize Signal-to-Noise
- Clear, direct language over verbose explanations
- Remove redundant information
- Focus on high-value tokens

### 3. Progressive Discovery
- Use lightweight identifiers vs full data dumps
- Load detailed info dynamically when needed
- Just-in-time information loading

## Markdown Structure Standards

Use clear semantic sections:
- **Background Information**: Minimal essential context
- **Instructions**: Imperative voice, specific, actionable
- **Examples**: Show don't tell, concise, representative
- **Constraints**: Boundaries, limitations, success criteria

## Writing Style

### Clarity Over Completeness
✅ Good: "Validate input before processing"
❌ Bad: "You should always make sure to validate..."

### Be Direct
✅ Good: "Use calculate_tax tool with amount and jurisdiction"
❌ Bad: "You might want to consider using..."

### Use Structured Lists
✅ Good: Bulleted constraints
❌ Bad: Paragraph of requirements

## Context Management

### Just-in-Time Loading
Don't load full data dumps - use references and load when needed

### Structured Note-Taking
Persist important info outside context window

### Sub-Agent Architecture
Delegate subtasks to specialized agents with minimal context

## Best Practices Checklist
- [ ] Uses Markdown headers for organization
- [ ] Clear, direct, minimal language
- [ ] No redundant information
- [ ] Actionable instructions
- [ ] Concrete examples
- [ ] Clear constraints
- [ ] Just-in-time loading when appropriate

## Anti-Patterns
❌ Verbose explanations
❌ Historical context dumping
❌ Overlapping tool definitions
❌ Premature information loading
❌ Vague instructions ("might", "could", "should")

## Claude 4.x Specific

### Be More Explicit
Claude 4.x follows instructions precisely. For "above and beyond" behavior, request it explicitly:
- ❌ "Create an analytics dashboard"
- ✅ "Create an analytics dashboard. Include as many relevant features as possible. Go beyond the basics."

### Explain WHY, Not Just What
Claude generalizes from motivation:
- ❌ "NEVER use ellipses"
- ✅ "Never use ellipses because text-to-speech engines can't pronounce them"

### Soften Aggressive Language
Claude 4.5 responds well to normal language - dial back intensity:
- ❌ "CRITICAL: You MUST use this tool when..."
- ✅ "Use this tool when..."

### Tool Action Patterns
Be explicit about action vs suggestion:
- "Can you suggest changes?" → Claude suggests only
- "Make these changes" → Claude implements

### Parallel Tool Calls
Claude 4.x excels at parallel execution. Encourage it:
```
If multiple tool calls have no dependencies, make them in parallel.
```

### Thinking Word Sensitivity
When extended thinking is disabled, replace "think" with alternatives:
- Use: "consider", "believe", "evaluate"
- Avoid: "think about", "think through"

## Creating Skills

### Structure
```
~/.claude/skills/[skill-name]/     # PAI (cross-project)
<project>/.claude/skills/[name]/   # Project-specific

├── SKILL.md      # Required - quick reference
└── CLAUDE.md     # Optional - detailed docs
```

### SKILL.md Format
```markdown
---
name: skill-name
description: What it does. INVOKE when [triggers].
user-invocable: true
---

# Skill Name

## When to Activate
- Trigger phrases

## [Main Content]
- Core workflow, commands, examples
```

### Naming
- Lowercase with hyphens: `web-scraping`, `code-review`
- Action or domain focused, not generic

## Supplementary Resources
For full standards: `read ${PAI_DIR}/skills/prompting/CLAUDE.md`

## Based On
- Anthropic's "Effective Context Engineering for AI Agents"
- Claude 4.x Best Practices (platform.claude.com)
