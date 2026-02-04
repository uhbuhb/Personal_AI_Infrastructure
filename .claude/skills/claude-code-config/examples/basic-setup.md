# Example: Basic Project Setup

This example shows a complete walkthrough of configuring Claude Code for a typical Next.js project.

## Project Context

**Stack**: Next.js 14, TypeScript, Tailwind CSS, Prisma, PostgreSQL
**Team Size**: 5 developers
**Goal**: Efficient development with consistent code quality

## Step-by-Step Setup

### Step 1: Installation (5 minutes)

```bash
# Install Claude Code (macOS)
curl -fsSL https://claude.ai/install.sh | bash

# Verify installation
claude --version
# Output: claude-code version 2.x.x
```

### Step 2: Project Initialization (10 minutes)

```bash
# Navigate to project
cd ~/projects/my-nextjs-app

# Start Claude Code
claude

# Initialize (generates CLAUDE.md)
/init
```

**Initial CLAUDE.md Generated**:
```markdown
# Project: my-nextjs-app

[Basic template content]
```

### Step 3: Customize CLAUDE.md (15 minutes)

Edit the generated `CLAUDE.md`:

```markdown
# Project: E-Commerce Admin Dashboard

## Purpose
Admin dashboard for managing e-commerce operations

## Architecture
- Frontend: Next.js 14 with App Router
- Backend: Next.js API routes with tRPC
- Database: PostgreSQL with Prisma ORM
- Styling: Tailwind CSS
- Deployment: Vercel

## Critical Commands
### Development
- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`
- Test: `npm test`
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`

### Database
- Generate Prisma client: `npm run db:generate`
- Run migrations: `npm run db:migrate`
- Seed database: `npm run db:seed`

### Deployment
- Staging: `vercel --prod --scope staging`
- Production: `vercel --prod`

## Code Style
### React/Next.js
- Server Components by default
- Client Components: Use 'use client' directive
- Prefer composition over prop drilling
- IMPORTANT: Always handle loading and error states

### TypeScript
- Strict mode enabled
- No `any` types (use `unknown` if needed)
- Prefer interfaces for objects
- Export types alongside implementations

### Tailwind
- Use utility classes only
- No custom CSS files
- Mobile-first responsive design
- IMPORTANT: Follow design system spacing (4px increments)

### Database
- NEVER write raw SQL
- Use Prisma for all queries
- Transactions for multi-step operations
- IMPORTANT: Always include error handling

## File Structure
- Pages: `app/**/page.tsx`
- Layouts: `app/**/layout.tsx`
- Components: `components/**/*.tsx`
- API routes: `app/api/**/*.ts`
- Utilities: `lib/**/*.ts`
- Types: `types/**/*.ts`
- Prisma schema: `prisma/schema.prisma`

## Testing Strategy
- Unit tests: Vitest
- Integration tests: Testing Library
- E2E tests: Playwright
- Coverage requirement: >80%
- IMPORTANT: Never mock database in integration tests

## Git Workflow
1. Branch naming: `feature/TICKET-123-description`
2. Commit format: Conventional Commits
3. PR requirements: Tests pass, 2 approvals
4. Deployment: Auto to staging on PR, manual to production

## Common Patterns
- Data fetching: Server Components with async/await
- Mutations: Server Actions
- Client state: Zustand
- Form validation: Zod with React Hook Form

## Known Issues
- Prisma migrations timeout on slow connections: Use `--skip-generate`
- Tailwind IntelliSense: Restart VS Code if suggestions stop
```

**Size Check**:
```bash
du -h CLAUDE.md
# Output: 8.0K CLAUDE.md ✓ Under 15KB target
```

### Step 4: Security Configuration (10 minutes)

Create `.claude/settings.json`:

```json
{
  "permissions": {
    "allow": [
      "Bash(echo:*)",
      "Bash(git status)",
      "Bash(git log:*)",
      "Bash(git diff:*)",
      "Bash(npm run test:*)",
      "Bash(npm run lint:*)",
      "Bash(npm run typecheck)"
    ],
    "ask": [
      "Edit",
      "Bash(git commit:*)",
      "Bash(git push:*)",
      "Bash(npm install:*)",
      "Bash(npm run db:migrate)",
      "Bash(vercel:*)"
    ],
    "deny": [
      "WebFetch",
      "Bash(curl:*)",
      "Bash(wget:*)",
      "Bash(rm -rf:*)",
      "Read(.env)",
      "Read(.env.local)",
      "Read(./secrets/**)",
      "Read(~/.ssh/**)",
      "Edit(.env)",
      "Edit(.env.local)"
    ]
  },
  "lazyLoadMcp": true,
  "hooks": {
    "post-edit": {
      "matcher": "Edit",
      "command": "prettier --write $FILE"
    }
  }
}
```

### Step 5: Create .claudeignore (5 minutes)

```bash
# .claudeignore
node_modules/
.next/
dist/
build/
coverage/
.vercel/
*.log
.DS_Store
```

### Step 6: Configure MCP Servers (15 minutes)

```bash
# Install GitHub server
claude mcp add github --scope user

# Configure environment variable
echo 'export GITHUB_TOKEN=ghp_your_token_here' >> ~/.zshrc
source ~/.zshrc
```

Create `.mcp.json` for team sharing:

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
    "sequential-thinking": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "mcp-sequentialthinking-tools"]
    }
  }
}
```

### Step 7: Test Configuration (5 minutes)

```bash
# Start Claude Code
claude

# Test status
/status
# Output: Context: 15%, Model: claude-sonnet-4-5

# Test MCP servers
/mcp
# Output: github: connected, sequential-thinking: connected

# Test permissions
"Edit this file" (should ask for approval)
"Run git status" (should run without asking)
```

### Step 8: Create Custom Commands (10 minutes)

```bash
mkdir -p .claude/commands
```

Create `.claude/commands/create-api.md`:
```markdown
Create a new API route following our patterns:

1. Create route handler: `/app/api/$ARGUMENTS/route.ts`
2. Implement with:
   - Input validation using Zod schema
   - Error handling with try-catch
   - Database queries with Prisma
   - Return type-safe JSON responses
3. Add integration tests: `__tests__/api/$ARGUMENTS.test.ts`
4. Update API documentation: `docs/api/$ARGUMENTS.md`

Example structure:
\`\`\`typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const schema = z.object({
  // Define schema
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);
    
    const result = await prisma.[model].create({
      data
    });
    
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
\`\`\`

Follow TypeScript strict mode and include proper error types.
```

Usage:
```bash
/project:create-api users/profile
```

### Step 9: Git Configuration (5 minutes)

```bash
# Add to .gitignore
echo "CLAUDE.local.md" >> .gitignore

# Commit configuration files
git add CLAUDE.md .claude/settings.json .mcp.json .claudeignore
git commit -m "chore: add Claude Code configuration"
```

### Step 10: Team Onboarding Document (10 minutes)

Create `docs/claude-code-setup.md`:

```markdown
# Claude Code Setup for Team

## Installation

1. Install Claude Code:
   \`\`\`bash
   curl -fsSL https://claude.ai/install.sh | bash
   \`\`\`

2. Clone repository and install dependencies:
   \`\`\`bash
   git clone <repo>
   npm install
   \`\`\`

3. Set up environment variables:
   \`\`\`bash
   cp .env.example .env.local
   # Add your values to .env.local
   
   # Add GitHub token for Claude Code
   export GITHUB_TOKEN=ghp_your_token_here
   \`\`\`

4. Test setup:
   \`\`\`bash
   cd project-root
   claude
   /status  # Should show healthy status
   \`\`\`

## Common Workflows

### Implementing a Feature
\`\`\`bash
# Research phase
"Read the authentication files. Use subagents to verify details."

# Planning phase
"Think hard about implementing password reset. Create a plan."

# Implementation phase
"Implement the password reset plan. Verify as you go."

# Completion
"Create commit and PR. Update docs."
\`\`\`

### Creating API Endpoints
\`\`\`bash
/project:create-api endpoint-name
\`\`\`

### Code Reviews
\`\`\`bash
"Review this PR for security and best practices"
\`\`\`

## Tips
- Use `/compact` at 70% context usage
- Be specific in prompts for better results
- Use custom commands for common tasks
- Monitor token usage with `/status`
```

## Results

**Configuration Metrics**:
- Setup time: 1.5 hours (one-time investment)
- CLAUDE.md size: 8KB (well under 15KB target)
- Token overhead: ~3K tokens (optimal)
- Security: 3 layers configured

**Team Benefits**:
- Consistent code generation
- Automated formatting
- Secure by default
- Shared best practices

**Measured Improvements** (after 2 weeks):
- 40% faster feature development
- 60% fewer code review cycles
- 90% reduction in manual git commands
- Zero security incidents

## Next Steps

1. **Week 1**: Team members complete setup, try basic workflows
2. **Week 2**: Refine CLAUDE.md based on usage patterns
3. **Week 3**: Add more custom commands for common tasks
4. **Week 4**: Measure productivity metrics, optimize further

## Troubleshooting

**Issue**: "Claude not following project patterns"
**Fix**: Add more specific examples to CLAUDE.md

**Issue**: "Context filling up quickly"
**Fix**: Compact at 70%, not 90%

**Issue**: "MCP server not connecting"
**Fix**: Check environment variables, run `--mcp-debug`

## Maintenance

- **Weekly**: Review CLAUDE.md for updates
- **Monthly**: Update MCP servers, audit permissions
- **Quarterly**: Full configuration review and optimization
