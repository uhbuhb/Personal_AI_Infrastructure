# CLAUDE.md Optimization Guide

## Overview

CLAUDE.md is the most critical file for Claude Code performance. It's automatically loaded into every conversation, consuming context window space. Optimization is essential for maintaining performance.

## Token Economics

**Context Window Impact**:
- Every byte in CLAUDE.md = permanent context consumption
- Target: <15KB for professional projects
- Exceeding 25KB causes noticeable performance degradation

**Real-World Example**:
- Before optimization: 27K tokens (5K in CLAUDE.md)
- After optimization: 12K tokens (2K in CLAUDE.md)
- Result: 54% reduction in startup cost

## Hierarchical Loading

Claude reads CLAUDE.md files in this order:

```
1. ~/.claude/CLAUDE.md (Global - your personal preferences)
   ↓
2. /project/CLAUDE.md (Team shared - check into git)
   ↓
3. /project/CLAUDE.local.md (Personal overrides - gitignored)
   ↓
4. /project/subdir/CLAUDE.md (On-demand when working in subdir)
```

## Required Structure

### Minimal Template (2KB)

```markdown
# Project: [Name]

## Purpose
[Single sentence describing what this codebase does]

## Critical Commands
- Build: `npm run build`
- Test: `npm test`
- Lint: `npm run lint`

## Code Style
- TypeScript strict mode
- ESLint + Prettier
- IMPORTANT: No console.log in production

## Workflow
1. Create feature branches from `develop`
2. Run tests before committing
3. PR titles: `[TYPE]: Description`
```

### Professional Template (5-10KB)

```markdown
# Project: [Name]

## Purpose
[What this does and why]

## Architecture
- Frontend: [Stack]
- Backend: [Stack]
- Database: [Type]
- Deployment: [Strategy]

## Critical Commands
### Development
- Start: `npm run dev`
- Build: `npm run build`
- Test: `npm test`
- Lint: `npm run lint`

### Deployment
- Staging: `npm run deploy:staging`
- Production: `npm run deploy:prod`

## Code Style
### TypeScript
- Use strict mode
- Prefer functional components with hooks
- Destructure imports: `import { foo } from 'bar'`

### Testing
- Unit test coverage: >80%
- Integration tests for critical paths
- IMPORTANT: Never mock the database in integration tests

### Git
- Branch naming: `feature/TICKET-123-description`
- Commit format: Conventional Commits
- PR template required

## Common Files
- Components: `/components/**/*.tsx`
- API routes: `/pages/api/*.ts`
- Utilities: `/lib/utils.ts`
- Types: `/types/**/*.ts`

## Workflow Rules
1. ALWAYS typecheck before committing
2. NEVER commit directly to main
3. PR requires 2 approvals
4. Deployment only after CI passes

## Known Issues
- [Document quirks specific to your project]
```

## Optimization Techniques

### 1. Use Pointers, Not Full Content

**Before** (verbose, 4,887 bytes):
```markdown
## Logging Preferences

Always use structured logging with pino or winston. Never use console.log 
in production code. Log at boundaries: API entry points, external API calls, 
and error conditions. For debugging, use a debugger instead of logs.

Example logging setup:
[20 lines of example code]

Common pitfalls:
[15 lines of anti-patterns]

Best practices:
[25 lines of guidelines]
```

**After** (pointer, 1,084 bytes):
```markdown
## Logging Rules
1. NEVER console.log in production
2. Use structured logging (pino/winston)
3. Log at boundaries only

For debugging workflows → Skill("investigate")
```

### 2. Factor Content to Skills

Move detailed protocols to `/skills/` directory:

```
project/
├── CLAUDE.md (pointers only)
└── skills/
    ├── debugging/SKILL.md (full protocol)
    ├── testing/SKILL.md (full patterns)
    └── logging/SKILL.md (full guidelines)
```

**CLAUDE.md references**:
```markdown
For debugging → Skill("debugging")
For testing patterns → Skill("testing")
For logging setup → Skill("logging")
```

### 3. Add Emphasis to Critical Rules

Use formatting to improve adherence:

```markdown
## Critical Rules

IMPORTANT: These rules are non-negotiable:
1. YOU MUST run tests before committing
2. NEVER commit secrets or credentials
3. ALWAYS use TypeScript strict mode

Breaking these rules will cause PR rejection.
```

### 4. Remove Redundancy

**Bad** (redundant):
```markdown
## Testing
Tests go in __tests__ directory.

## File Structure
- Tests: __tests__ directory

## Workflow
1. Write tests in __tests__ directory
```

**Good** (stated once):
```markdown
## File Structure
- Tests: `__tests__/**/*.test.ts`

## Workflow
1. Write tests following structure above
```

### 5. Use Tables for Dense Information

**Instead of paragraphs**:
```markdown
Our API uses RESTful conventions. GET requests retrieve data. 
POST creates new resources. PUT updates existing ones. DELETE 
removes resources. PATCH partially updates resources.
```

**Use tables**:
```markdown
| Method | Purpose |
|--------|---------|
| GET | Retrieve |
| POST | Create |
| PUT | Update |
| DELETE | Remove |
| PATCH | Partial update |
```

## Advanced Optimization

### Dynamic Content Loading

For very large projects, use conditional loading:

```markdown
## Monorepo Structure

For frontend work → See: frontend/CLAUDE.md
For backend work → See: backend/CLAUDE.md
For infrastructure → See: infra/CLAUDE.md
```

### Project-Specific Skills

Create domain-specific skills referenced from CLAUDE.md:

```markdown
## Domain Knowledge

For authentication patterns → Skill("auth-patterns")
For database schema conventions → Skill("db-schema")
For API design standards → Skill("api-standards")
```

### Progressive Disclosure Pattern

Keep CLAUDE.md at high-level, link to details:

```markdown
## Architecture

High-level: Microservices with event-driven communication

Details:
- Service boundaries: See docs/architecture/services.md
- Event schemas: See docs/architecture/events.md
- Deployment: See docs/architecture/deployment.md

Claude will read these files when needed.
```

## Testing Your CLAUDE.md

### Size Check

```bash
# Check size
du -h CLAUDE.md

# Target: <15KB for professional projects
# Warning: >20KB
# Critical: >25KB
```

### Effectiveness Test

Ask Claude these questions without additional context:

1. "What's the build command?"
2. "What's our code style for TypeScript?"
3. "What's the git workflow?"
4. "Where do tests go?"
5. "What can't I do in production code?"

If Claude answers all correctly → CLAUDE.md is effective.

### Token Count

```bash
# Use tiktoken or similar
echo "Your CLAUDE.md content" | tiktoken

# Target: <2,000 tokens
# Warning: >3,000 tokens
# Critical: >5,000 tokens
```

## Maintenance Schedule

### Weekly
- Review for outdated information
- Check size hasn't grown

### Monthly
- Run through Anthropic's prompt improver
- Optimize based on team feedback
- Add emphasis to frequently violated rules

### Quarterly
- Complete audit and rewrite if needed
- Gather team input on pain points
- Update with new patterns learned

## Anti-Patterns

| Anti-Pattern | Problem | Fix |
|--------------|---------|-----|
| **Copy-paste documentation** | Bloats size | Link to docs, don't embed |
| **Example code** | Consumes tokens | Move to skills or docs |
| **Verbose explanations** | Token waste | Be concise, use emphasis |
| **Repeated information** | Redundancy | State once, reference elsewhere |
| **Stale content** | Confuses Claude | Regular maintenance |
| **No emphasis** | Rules ignored | Add IMPORTANT, YOU MUST |

## Team Governance

### Review Process

```markdown
# .github/CODEOWNERS
CLAUDE.md @team-leads
```

### Change Guidelines

1. Propose changes via PR
2. Explain impact on context
3. Test with sample prompts
4. Get team approval
5. Monitor effectiveness for 1 week

### Version Control

```bash
# Track changes
git log --follow CLAUDE.md

# Compare versions
git diff HEAD~1 CLAUDE.md
```

## Examples

### Example 1: Frontend React Project (8KB)

```markdown
# Project: E-Commerce Dashboard

## Purpose
Admin dashboard for managing e-commerce operations

## Architecture
- Next.js 14 with App Router
- TypeScript strict mode
- Tailwind CSS
- tRPC for API
- Prisma + PostgreSQL
- Deployed on Vercel

## Critical Commands
- Dev: `npm run dev`
- Build: `npm run build`
- Test: `npm test`
- Typecheck: `npm run typecheck`

## Code Style
### React
- Server Components by default
- Client Components only when needed (use 'use client')
- Prefer composition over props drilling
- IMPORTANT: Always handle loading and error states

### TypeScript
- Enable strict mode
- No `any` types (use `unknown` if truly needed)
- Prefer interfaces over types for objects

### Styling
- Tailwind utility classes only
- No inline styles or CSS files
- Responsive mobile-first

## File Structure
- Pages: `app/**/page.tsx`
- Layouts: `app/**/layout.tsx`
- Components: `components/**/*.tsx`
- API: `app/api/**/*.ts`
- Utils: `lib/**/*.ts`

## Testing
- Unit tests: Vitest
- E2E tests: Playwright
- Coverage: >80%
- NEVER mock tRPC calls in integration tests

## Git Workflow
1. Branch: `feature/JIRA-123-description`
2. Commit: Conventional Commits format
3. PR: Use template, link JIRA ticket
4. Deploy: Auto-deploy to staging on PR, production on merge

## Known Issues
- tRPC type inference breaks with dynamic imports
- Prisma migrations sometimes timeout locally
```

### Example 2: Python Data Pipeline (6KB)

```markdown
# Project: Analytics Pipeline

## Purpose
ETL pipeline processing customer data for ML models

## Architecture
- Python 3.11
- Apache Airflow for orchestration
- dbt for transformations
- PostgreSQL + Snowflake
- Docker + Kubernetes

## Critical Commands
### Development
- Setup: `make setup`
- Tests: `pytest`
- Lint: `make lint`
- Type check: `mypy .`

### Airflow
- Local: `make airflow-local`
- Deploy: `make airflow-deploy`

## Code Style
### Python
- PEP 8 compliant
- Type hints required
- Docstrings: Google style
- IMPORTANT: No pandas warnings allowed

### Testing
- pytest with fixtures
- Coverage: >90%
- Integration tests use test database

## File Structure
- DAGs: `dags/**/*.py`
- dbt models: `models/**/*.sql`
- Utils: `utils/**/*.py`
- Tests: `tests/**/*.py`

## Workflow
1. Branch: `feature/TICKET-description`
2. Pre-commit hooks run automatically
3. PR requires: tests passing, lint clean
4. Deployment: staging → validation → production

## dbt Conventions
- Staging models: `stg_*`
- Intermediate: `int_*`
- Marts: `fct_*` or `dim_*`
- IMPORTANT: Never select * in production models
```

## Summary

**Key Principles**:
1. Keep CLAUDE.md < 15KB
2. Use pointers to skills/docs
3. Add emphasis to critical rules
4. Remove redundancy
5. Maintain regularly

**Impact**:
- Optimized CLAUDE.md = 54% token reduction
- Better performance throughout session
- More consistent instruction following
- Lower costs at scale
