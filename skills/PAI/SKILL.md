# PAI — Personal AI Infrastructure Context Routing

**Purpose:** Smart, on-demand loading of PAI context to minimize token usage while maintaining full functionality.

**Architecture:** Tiered context loading system that provides only what's needed, when it's needed.

---

## Skill Activation

This skill provides **selective context loading** based on task requirements.

**Always loaded (via hook):**
- Core identity (your AI's personality and name)
- Critical git security warnings
- Date awareness

**Loaded on-demand (via this skill):**
- Contacts and communication
- Stack preferences
- Response format guidelines
- Voice IDs (if using voice system)
- Detailed security procedures
- Social media accounts

---

## Auto-Activation Triggers

### 📧 Load `contacts.md` when:

**Keywords detected:**
- email, send, contact, reach out, message
- Your contact names (customize in contacts.md)
- social, twitter, x, linkedin, youtube, instagram
- post, tweet, share

**Tool invocations:**
- Email skill
- Social media skills (create-x-post, create-linkedin-post)
- Any communication-related skills

**Use cases:**
- "Send an email to [contact name]"
- "Reach out to [contact] about..."
- "Post this to Twitter"
- "What's [contact]'s email?"

---

### 🔧 Load `preferences.md` when:

**Keywords detected:**
- new project, create app, initialize, setup, scaffold
- npm, yarn, pnpm, bun, pip, uv
- python, typescript, javascript
- install, dependencies, package

**Bash commands detected:**
- npm, yarn, pnpm, bun, pip, uv
- Project initialization commands

**Use cases:**
- "Create a new TypeScript project"
- "What package manager should I use?"
- "Initialize a Python app"
- "Install dependencies"

---

### 🛡️ Load `security-detailed.md` when:

**Keywords detected:**
- git commit, git push, git add
- aws, cloudflare, infrastructure
- deploy, production, publish

**Bash commands detected:**
- git (add, commit, push, merge, rebase)
- aws cli commands
- cloudflare commands
- gh (GitHub CLI)

**File patterns detected:**
- Working in git repositories
- Infrastructure configuration files

**Use cases:**
- "Commit these changes"
- "Push to GitHub"
- "Deploy to AWS"
- "Update Cloudflare settings"

**CRITICAL:** This context loads BEFORE git operations to ensure warnings are present.

---

### 📝 Load `response-format.md` when:

**Task completion signals:**
- Marking todos as completed
- Substantive work sessions (not simple reads/searches)
- Project implementations
- Multi-step workflows

**Skip for:**
- Simple file reads
- Code searches
- Quick questions
- Information retrieval

**Use cases:**
- Completing a feature implementation
- Finishing a bug fix
- Wrapping up a project task
- NOT for "show me this file" or "search for X"

---

### 🎤 Load `voice-ids.md` when:

**Note:** Only needed if you're using the PAI voice system

**Keywords detected:**
- voice, audio, elevenlabs, tts, text-to-speech
- agent routing, voice system
- agent names (perplexity-researcher, engineer, architect, etc.)

**Use cases:**
- "Route this to the engineer agent with voice"
- "What voice ID should I use?"
- "Set up voice for the researcher"

---

### 📚 Load Full `PAI.md` when:

**Comprehensive context needed:**
- User explicitly requests "load full PAI context"
- Complex multi-faceted tasks requiring multiple context types
- Onboarding or explaining the PAI system
- System documentation or meta-tasks

**Use cases:**
- "Tell me about the PAI system"
- "Load everything"
- Major system configuration changes

---

## Context Loading Strategy

### Minimal Hook (Always On)
```
~/.claude/skills/PAI/MINIMAL.md (~250-400 tokens)
├── Core identity: AI name and personality
├── Critical security: Git safety warnings
└── Date awareness
```

### Smart Routing (On Demand)
```
User message analysis
├── Keyword matching
├── Tool invocation detection
├── Bash command pattern recognition
└── Task context evaluation
     ↓
Load only required contexts
├── contacts.md (~300-500 tokens)
├── preferences.md (~300-500 tokens)
├── response-format.md (~200-300 tokens)
├── voice-ids.md (~200-300 tokens)
├── security-detailed.md (~400-600 tokens)
└── PAI.md (full ~3000-5000 tokens)
```

---

## Token Efficiency Metrics

### Hook-Based System (Old)
- Every interaction: ~4000 tokens
- 50 interactions/day: ~200,000 tokens/day

### Skills-Based System (New)
- Every interaction: ~250-400 tokens (minimal)
- 30% need additional context: ~1000-1500 avg tokens
- **Estimated savings: ~60-70% token reduction**

### Breakdown by Task Type

| Task Type | Old Tokens | New Tokens | Savings |
|-----------|-----------|-----------|---------|
| Simple search | 4000 | 300 | 92.5% |
| Email task | 4000 | 800 | 80% |
| Git commit | 4000 | 700 | 82.5% |
| New project | 4000 | 700 | 82.5% |
| Blog post | 4000 | 1000 | 75% |
| Complex task | 4000 | 4000 | 0% |

---

## Usage Instructions

### For Main AI Instance

**Automatic activation:**
The AI should automatically detect when specific contexts are needed and reference them internally. The routing logic above guides when to apply different context knowledge.

**Manual invocation:**
If user explicitly requests full PAI context or comprehensive information is needed, load `PAI.md` directly.

**Modular loading:**
Reference specific context files when relevant triggers are detected:
- Communication task → Think of contacts.md content
- Git operation → Think of security-detailed.md warnings
- Stack decision → Think of preferences.md guidelines

### For Sub-agents

Sub-agents inherit the AI's identity from MINIMAL.md and can request additional context through the PAI skill as needed.

---

## Customization Guide

### Adding New Context Files

1. Create new `.md` file in `skills/PAI/` directory
2. Update auto-activation triggers in this SKILL.md
3. Add to PAI.md if it should be part of full context
4. Test routing logic

### Modifying Minimal Hook

MINIMAL.md should remain under 500 tokens and only contain:
- **Core identity** (absolutely essential - AI name, personality)
- **Critical pre-emptive security** (must be present BEFORE operations)
- **System awareness** (date, environment)

Everything else goes in modular context files.

---

## Architecture Benefits

✅ **Token Efficiency:** 60-70% reduction in PAI-related tokens
✅ **Scalability:** Adding context doesn't multiply across all interactions
✅ **Relevance:** Tasks only get context they need
✅ **Consistency:** Follows skills-based architecture philosophy
✅ **Maintainability:** Modular contexts easier to update
✅ **Identity Continuity:** Minimal hook ensures identity always present
✅ **Security:** Critical warnings loaded pre-emptively via minimal hook

---

## File Structure

```
~/.claude/skills/PAI/
├── SKILL.md                    # This file - routing logic and triggers
├── MINIMAL.md                  # Always-on hook content (~250-400 tokens)
├── PAI.md                      # Full consolidated context (~3000-5000 tokens)
├── README.md                   # Customization guide
├── contacts.md                 # Communication & contacts (~300-500 tokens)
├── preferences.md              # Stack & instructions (~300-500 tokens)
├── response-format.md          # Output formatting (~200-300 tokens)
├── voice-ids.md                # Agent voice routing (~200-300 tokens)
└── security-detailed.md        # Security procedures (~400-600 tokens)

~/.claude/PAI.md                # Symlink → skills/PAI/PAI.md (recommended)
```

---

## Testing Checklist

After customizing your PAI skill:

- [ ] Identity continuity across simple interactions
- [ ] Contacts auto-load when mentioned
- [ ] Preferences auto-load on package manager usage
- [ ] Security warnings present BEFORE git operations
- [ ] Response format applies to substantive tasks
- [ ] Voice IDs available when needed (if using voice system)
- [ ] Full context loads on explicit request
- [ ] Token usage reduced vs hook-based system

---

## Troubleshooting

**Problem:** AI doesn't seem to know about my contacts
- Check that contacts.md is properly formatted
- Verify contact names are mentioned in user message
- Ensure routing triggers in SKILL.md include your keywords

**Problem:** Security warnings not appearing
- Verify security-detailed.md exists and has content
- Check that MINIMAL.md has critical security basics
- Ensure git commands trigger security context loading

**Problem:** Token usage still high
- Review what's in MINIMAL.md - keep it minimal!
- Check if you're requesting full PAI.md too often
- Verify modular contexts are being used instead of full context

---
