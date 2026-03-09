---
name: create-skill
description: Create new Claude Code skills with proper structure, frontmatter, and best practices. Use when creating a skill or setting up a slash command.
argument-hint: [skill-name]
---

# Create Skill

Create a new Claude Code skill following the official skill specification and prompting best practices.

If `$ARGUMENTS` is provided, use it as the skill name. Otherwise, ask for the skill name first.

## Workflow

### Step 1: Gather Requirements

Ask the user these questions (skip any already answered via arguments or conversation context):

1. **Skill name** — lowercase with hyphens (e.g., `deploy-app`, `review-pr`)
2. **What does it do?** — one sentence describing the skill's purpose
3. **Scope** — personal (`~/.claude/skills/`) or project (`.claude/skills/`)?
4. **Invocation model** — who triggers it?
   - Both user and Claude (default)
   - User only (`disable-model-invocation: true`) — for side-effect workflows like deploy, commit, send
   - Claude only (`user-invocable: false`) — for background knowledge/conventions
5. **Does it need arguments?** — if yes, what are they? (e.g., `[issue-number]`, `[filename] [format]`)
6. **Should it run in a subagent?** — use `context: fork` for isolated tasks that don't need conversation history
7. **Does it need supporting files?** — templates, scripts, examples, reference docs

### Step 2: Generate SKILL.md

Build the skill file using the structure and field reference below.

#### Frontmatter Fields

`description` is **required** — it is the most important field. Claude uses it to decide when to auto-invoke the skill, and it appears in the skill listing. All other fields are optional.

| Field | Required | Include When | Example |
|-------|----------|-------------|---------|
| `description` | **Yes** | Always — Claude uses this to decide when to invoke | `Deploy app to production. Use when deploying, shipping, or releasing.` |
| `name` | No | Always (or defaults to directory name) | `deploy-app` |
| `argument-hint` | Skill accepts arguments | `[issue-number]` |
| `disable-model-invocation` | User-only trigger (side effects, timing-sensitive) | `true` |
| `user-invocable` | Hide from `/` menu (background knowledge only) | `false` |
| `context` | Run in isolated subagent | `fork` |
| `agent` | Specify subagent type (requires `context: fork`) | `Explore`, `Plan`, `general-purpose` |
| `allowed-tools` | Restrict tool access | `Read, Grep, Glob` |
| `model` | Override model selection | model ID |
| `hooks` | Lifecycle hooks scoped to this skill | see hooks docs |

#### Description Writing

The description is the most important field — it determines when Claude auto-invokes the skill.

- Start with what it does in plain language
- Add trigger phrases: "Use when [scenario 1], [scenario 2], or [scenario 3]"
- Include keywords users would naturally say
- Keep under 2 sentences

**Good:** `Fix GitHub issues by number. Use when fixing bugs, resolving issues, or working on tickets.`
**Bad:** `A comprehensive tool for managing GitHub issue resolution workflows.`

#### Content Structure

Follow this template for the skill body:

```markdown
# Skill Name

[Brief role/context sentence if needed]

## When to Use
- [Trigger scenario 1]
- [Trigger scenario 2]

## Instructions
1. [Step 1 — imperative voice]
2. [Step 2]
3. [Step 3]

## [Domain-specific sections as needed]

## Constraints
- [Boundary or limitation]

## Output Format
[Expected output structure, if applicable]
```

#### Content Best Practices

- **Imperative voice**: "Run tests" not "You should run tests"
- **Direct language**: "Use X" not "You might want to consider using X"
- **Show don't tell**: Examples over explanations
- **Structured lists**: Bullets over paragraphs
- **Signal over noise**: Every token should earn its place
- **Under 500 lines**: Move detailed references to supporting files

#### Using Arguments

Reference arguments in skill content with these substitutions:

| Syntax | Meaning | Example |
|--------|---------|---------|
| `$ARGUMENTS` | All arguments as one string | `Fix issue $ARGUMENTS` |
| `$ARGUMENTS[N]` | Specific argument (0-based) | `Migrate $ARGUMENTS[0] from $ARGUMENTS[1]` |
| `$N` | Shorthand for `$ARGUMENTS[N]` | `Migrate $0 from $1 to $2` |
| `${CLAUDE_SESSION_ID}` | Current session ID | `Log to ${CLAUDE_SESSION_ID}.log` |

If `$ARGUMENTS` is not present in content, arguments are appended automatically as `ARGUMENTS: <value>`.

#### Dynamic Context Injection

Skills support preprocessing shell commands using the BANG-BACKTICK syntax: an exclamation mark (!) immediately followed by a shell command wrapped in backticks. The command executes before the skill content reaches Claude, and the output replaces the placeholder inline.

Example: writing BANG then BACKTICK-git branch --show-current-BACKTICK in your SKILL.md causes the current branch name to appear in that position when the skill loads.

Claude only sees the resolved output, not the original command. Use this for injecting live data like git status, environment info, or API responses.

#### Subagent Execution (`context: fork`)

Add `context: fork` when the skill:
- Performs an isolated task (research, analysis, generation)
- Doesn't need conversation history
- Should run without polluting the main context

Pair with `agent` to specify execution environment:
- `Explore` — read-only codebase exploration (Glob, Grep, Read)
- `Plan` — architectural planning
- `general-purpose` — full tool access

**Example:**
```yaml
---
name: deep-research
context: fork
agent: Explore
---
Research $ARGUMENTS thoroughly and summarize findings.
```

### Step 3: Create Supporting Files (if needed)

```
skill-name/
├── SKILL.md           # Main instructions (required, <500 lines)
├── CLAUDE.md          # Detailed reference docs (optional)
├── template.md        # Template for Claude to fill in (optional)
├── examples/
│   └── sample.md      # Example outputs (optional)
└── scripts/
    └── helper.sh      # Scripts Claude can execute (optional)
```

Reference supporting files from SKILL.md:
```markdown
## Additional resources
- For complete API details, see [reference.md](reference.md)
- For usage examples, see [examples.md](examples.md)
```

### Step 4: Write Files

1. Create the skill directory
2. Write `SKILL.md` with frontmatter and content
3. Write any supporting files
4. Confirm creation and show how to test

### Step 5: Test

Tell the user to test with:
- **Direct invocation**: `/skill-name [args]`
- **Auto-invocation**: Ask something matching the description
- **Verify listing**: Ask "What skills are available?"

## Constraints

- Skill names: lowercase letters, numbers, hyphens only (max 64 chars)
- Frontmatter between `---` markers, valid YAML
- If skill shares a name across levels, priority: enterprise > personal > project
- Plugin skills use `plugin-name:skill-name` namespace
- Existing `.claude/commands/` files keep working but skills take precedence on name conflict
