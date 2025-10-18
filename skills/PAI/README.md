# PAI Skill — Personal AI Infrastructure Context Routing

**Version:** 1.0.0
**Purpose:** Token-efficient, on-demand loading of PAI context

---

## Overview

The PAI skill implements a **tiered context loading system** that provides only the context needed for each interaction, dramatically reducing token usage while maintaining full functionality.

### The Problem This Solves

**Traditional approach (hook-based):**
- Loads ALL your personal context on EVERY interaction
- Simple tasks like "read this file" load your entire contact list, voice IDs, everything
- ~4,000 tokens per interaction × 50 interactions = 200,000 wasted tokens/day

**Skills-based approach (this system):**
- Loads minimal identity context on every interaction (~250-400 tokens)
- Additional context loaded automatically only when needed
- **Result: 60-70% token reduction**

---

## Quick Start

### 1. Customize Your Context

Edit these files with your personal information:

```
skills/PAI/
├── MINIMAL.md              ← Your AI's identity (always loaded)
├── contacts.md             ← Your contacts and social media
├── preferences.md          ← Your stack preferences
├── response-format.md      ← How you want responses formatted
├── voice-ids.md            ← ElevenLabs voice IDs (optional)
└── security-detailed.md    ← Your security rules and warnings
```

### 2. Update the Hook

Make sure `hooks/update-tab-titles.ts` loads `skills/PAI/MINIMAL.md` instead of root `PAI.md`:

```typescript
const globalContextPath = `${paiDir}/skills/PAI/MINIMAL.md`;
```

### 3. Optional: Create Symlink

For backward compatibility, create a symlink:

```bash
cd ~/.claude
ln -s skills/PAI/PAI.md PAI.md
```

### 4. Test It

Try these interactions to verify routing:
- Mention a contact name → contacts.md should auto-load
- Run a git command → security-detailed.md should auto-load
- Create a new project → preferences.md should auto-load

---

## Architecture

### Three-Tier Context Loading

```
┌─────────────────────────────────────────┐
│ TIER 1: Minimal Hook (Always On)       │
│ File: MINIMAL.md                        │
│ Size: ~250-400 tokens                   │
│ • Core identity                         │
│ • Critical security                     │
│ • Date awareness                        │
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│ TIER 2: Modular Contexts (On Demand)   │
│ Files: contacts.md, preferences.md, etc.│
│ Size: ~200-600 tokens each              │
│ • Auto-loaded based on triggers         │
│ • Only what's needed for the task       │
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│ TIER 3: Full Context (Comprehensive)   │
│ File: PAI.md                            │
│ Size: ~3000-5000 tokens                 │
│ • All contexts combined                 │
│ • Loaded on explicit request            │
└─────────────────────────────────────────┘
```

---

## Customization Guide

### MINIMAL.md - Your AI's Core Identity

**What to include:**
- AI's name (e.g., "Kai", "Nova", "Assistant")
- Personality traits
- Critical security warnings that must ALWAYS be present
- Brief personal message to your AI

**Keep it under 500 tokens!** This loads on EVERY interaction.

**Example:**
```markdown
**Name:** Kai
**Personality:** Friendly, direct, no-nonsense
**Critical Security:** Never commit from wrong directory, always check git remote
```

---

### contacts.md - Your Network

**What to include:**
- Key contacts with names, roles, and emails
- Social media accounts and handles
- Blog or website URLs

**Auto-loads when:**
- Mentioning contact names
- Using email or social media skills
- Keywords: "email", "send", "contact", "post", "tweet"

**Example:**
```markdown
## Key Contacts
- **Alice** [Manager] - alice@company.com
- **Bob** [Client] - bob@client.com

## Social Media
- **Twitter**: @yourhandle
- **LinkedIn**: linkedin.com/in/yourname
```

---

### preferences.md - Your Tech Stack

**What to include:**
- Preferred programming languages
- Package managers (npm vs bun vs yarn)
- Frameworks and tools
- Code style preferences
- Project structure conventions

**Auto-loads when:**
- Creating new projects
- Installing dependencies
- Technology stack decisions
- Keywords: "npm", "bun", "create app", "new project"

**Example:**
```markdown
## Languages
- Primary: TypeScript
- Avoid: Python (unless necessary)

## Package Managers
- JS/TS: bun (NOT npm)
- Python: uv (NOT pip)
```

---

### response-format.md - Response Structure

**What to include:**
- Your preferred response format
- When to use structured vs simple responses
- Emoji preferences
- Verbosity level

**Auto-loads when:**
- Completing substantive tasks
- Project implementations
- NOT for simple reads or searches

**Example:**
```markdown
Use structured format with:
- Summary
- Actions taken
- Results
- Next steps

Skip emojis unless I specifically request them.
```

---

### voice-ids.md - Voice System (Optional)

**What to include:**
- ElevenLabs voice IDs for each agent
- Voice personality notes

**Auto-loads when:**
- Using voice system
- Keywords: "voice", "elevenlabs", "audio"

**If not using voice system:**
- Delete this file
- Remove voice-ids.md references from SKILL.md

---

### security-detailed.md - Security Rules

**What to include:**
- Repository-specific warnings
- Infrastructure safety rules
- Sensitive file patterns to avoid
- Production deployment cautions
- Your custom security procedures

**Auto-loads when:**
- Git operations (commit, push, merge)
- Infrastructure work (AWS, Cloudflare)
- Keywords: "deploy", "production", "commit"

**Example:**
```markdown
## Custom Rules
- Never commit to main/master directly
- Always test in staging first
- Rotate API keys monthly
- Never use production credentials in dev
```

---

### PAI.md - Full Context (Rarely Loaded)

**What it contains:**
- ALL the above contexts combined in one file
- System documentation
- Comprehensive reference

**When it loads:**
- User explicitly requests "load full PAI context"
- Complex multi-faceted tasks
- System documentation needs
- Meta-tasks about PAI

**Most interactions won't need this!** That's the point.

---

## Token Efficiency Breakdown

### Real-World Comparison

| Your Action | Old System | New System | Savings |
|-------------|-----------|-----------|---------|
| "Read main.ts" | 4000 tokens | 300 tokens | 92.5% |
| "Email Alice about project" | 4000 tokens | 800 tokens | 80% |
| "Commit changes" | 4000 tokens | 700 tokens | 82.5% |
| "Create new Next.js app" | 4000 tokens | 700 tokens | 82.5% |
| "Write blog post" | 4000 tokens | 1000 tokens | 75% |

**Average daily savings (50 interactions):**
- Old: ~200,000 tokens
- New: ~60,000 tokens
- **Savings: ~140,000 tokens/day (70%)**

---

## How Auto-Loading Works

The PAI skill uses intelligent routing based on:

### 1. Keyword Detection
```
User: "Email Bob about the project"
         ↓
Detects: "email" + "Bob"
         ↓
Loads: contacts.md
         ↓
Total: MINIMAL.md (300) + contacts.md (400) = 700 tokens
```

### 2. Tool Invocation Patterns
```
User invokes: Email skill
         ↓
Loads: contacts.md
```

### 3. Bash Command Analysis
```
User: "Commit these changes"
         ↓
Detects: git command pattern
         ↓
Loads: security-detailed.md (BEFORE git runs)
```

### 4. Task Context
```
User completes: Feature implementation
         ↓
Detects: Substantive task completion
         ↓
Loads: response-format.md
```

---

## Troubleshooting

### Problem: AI doesn't recognize my contacts

**Check:**
- Are contact names in contacts.md?
- Are you using the exact names?
- Is contacts.md properly formatted?

**Fix:** Update contacts.md with the names you use in conversation.

---

### Problem: Security warnings not showing before git commits

**Check:**
- Is security-detailed.md present and formatted correctly?
- Does MINIMAL.md have critical security basics?
- Is SKILL.md configured to trigger on git commands?

**Fix:** Ensure git-related keywords trigger security-detailed.md loading.

---

### Problem: Token usage still seems high

**Check:**
- Is MINIMAL.md actually minimal (~250-400 tokens)?
- Are you loading PAI.md (full context) too often?
- Are modular contexts unnecessarily large?

**Fix:**
- Trim MINIMAL.md to essentials only
- Move non-critical content to modular files
- Verify auto-loading triggers are working

---

### Problem: AI personality seems inconsistent

**Check:**
- Is your identity clearly defined in MINIMAL.md?
- Is the hook actually loading MINIMAL.md?

**Fix:** Ensure hooks/update-tab-titles.ts points to skills/PAI/MINIMAL.md

---

## Advanced Customization

### Adding New Context Files

1. **Create the file:** `skills/PAI/my-custom-context.md`

2. **Update SKILL.md:** Add routing triggers
```markdown
### 🎨 Load `my-custom-context.md` when:
**Keywords detected:**
- custom, special, whatever

**Use cases:**
- "Do something custom"
```

3. **Add to PAI.md:** Include content in full context file (optional)

4. **Test:** Verify it auto-loads when triggers are hit

---

### Modifying Auto-Load Triggers

Edit `SKILL.md` and adjust the trigger patterns:

```markdown
### Load `contacts.md` when:
**Keywords detected:**
- email, send, contact  ← Add more keywords here
- alice, bob             ← Add your contact names
```

---

### Creating Multiple Profiles

You can maintain different PAI configurations:

```bash
skills/PAI-work/      # Work context
skills/PAI-personal/  # Personal context
skills/PAI-client-a/  # Client-specific context
```

Switch by updating hook to load different MINIMAL.md.

---

## Best Practices

### 1. Keep MINIMAL.md Minimal
- Only absolute essentials
- Critical pre-emptive security only
- Under 500 tokens

### 2. Be Specific in Modular Contexts
- contacts.md: Real names you use
- preferences.md: Actual stack you use
- security-detailed.md: Your specific rules

### 3. Test Auto-Loading
- Verify triggers work with YOUR keywords
- Check token usage before/after
- Ensure identity continuity

### 4. Update Regularly
- Add new contacts as your network grows
- Update preferences when stack changes
- Refine security rules based on experience

### 5. Review Token Usage
- Monitor actual savings
- Adjust trigger sensitivity if needed
- Move rarely-used content out of MINIMAL.md

---

## Migration from Hook-Based System

If you're upgrading from the old hook-based system:

### 1. Backup Current PAI.md
```bash
cp ~/.claude/PAI.md ~/.claude/PAI.md.backup
```

### 2. Create Skill Structure
```bash
mkdir -p ~/.claude/skills/PAI
```

### 3. Split Content
- Extract identity → MINIMAL.md
- Extract contacts → contacts.md
- Extract preferences → preferences.md
- etc.

### 4. Update Hook
Change `hooks/update-tab-titles.ts`:
```typescript
// Old
const globalContextPath = `${paiDir}/PAI.md`;

// New
const globalContextPath = `${paiDir}/skills/PAI/MINIMAL.md`;
```

### 5. Create Symlink (optional)
```bash
ln -s ~/.claude/skills/PAI/PAI.md ~/.claude/PAI.md
```

### 6. Test
- Verify identity continuity
- Check auto-loading works
- Monitor token reduction

---

## File Structure Reference

```
~/.claude/skills/PAI/
├── README.md                  # This file - customization guide
├── SKILL.md                   # Routing logic and auto-load triggers
├── MINIMAL.md                 # Always-on hook content (~250-400 tokens)
├── PAI.md                     # Full consolidated context (~3000-5000 tokens)
├── contacts.md                # Communication & contacts (~300-500 tokens)
├── preferences.md             # Stack & instructions (~300-500 tokens)
├── response-format.md         # Output formatting (~200-300 tokens)
├── voice-ids.md               # Agent voice routing (~200-300 tokens) [optional]
└── security-detailed.md       # Security procedures (~400-600 tokens)
```

---

## Questions?

For more information:
- See main PAI documentation: `/documentation/`
- Check PAI README: `/README.md`
- Review architecture docs: `/documentation/architecture.md`
- Skills system guide: `/documentation/skills-system.md`

---

## Version History

**v1.0.0** - Initial release
- Tiered context loading system
- Modular context files with flat structure
- Auto-routing based on triggers
- 60-70% token reduction vs hook-based system

---
