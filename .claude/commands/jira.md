---
name: jira
description: Fetch Jira ticket and implement solution with staged approval workflow
args: [ticket_id]
---

# Jira Ticket Implementation

You are helping boss (orihab) implement a Jira ticket with a staged approval workflow.

## Arguments

- `ticket_id` (required): The Jira ticket ID (e.g., `PROJ-123`)

## Instructions

### 1. Fetch Ticket

- Use Jira MCP to get ticket details
- Present only the ticket summary (one-liner)

### 2. Analyze Codebase

- Explore current directory for files relevant to the ticket
- Understand existing architecture and patterns
- Identify files that will need modification

### 3. Present Implementation Plan

Format:
```
**Ticket:** [summary one-liner]

**Current Implementation:**
[High-level overview of how relevant code works today - architecture, data flow, key components]

**Proposed Changes:**
[What exactly will change - specific modifications, new files, deleted code]

**Questions/Concerns:**
[Any ambiguities, risks, or clarifications needed]
```

### 4. Wait for Approval

**IMPORTANT**: Do NOT implement until boss explicitly confirms (e.g., "yes", "go ahead", "proceed", "looks good").

### 5. Implement (After Approval)

- Implement the changes as planned
- Commit strategy:
  - **Simple fix**: Single commit
  - **Complex changes**: Separate logical commits (e.g., one per component/concern)
  - **Preparatory work**: Separate commit(s) first for whitespace, refactoring, or cleanup
- **DO NOT create branches** - boss handles branch management
- **DO NOT push** - boss handles pushing

### 6. Prep PR

After implementation is complete, generate:

**PR Title:**
```
[Ticket ID] Brief description of change
```

**PR Description:**
```markdown
## Summary
<2-3 bullet points>

## Changes
- **Category**: What changed

## Testing
<How to verify the changes work>

Resolves [TICKET-ID]
```

Present PR title and description for boss to use when ready.

## Example Usage

```
/jira PROJ-123
```

## Example Flow

```
📋 **Ticket:** PROJ-123 - Add user preferences endpoint

**Current Implementation:**
The user service (`src/services/user.py`) handles user CRUD operations.
User data is stored in PostgreSQL via SQLAlchemy models in `src/models/user.py`.
API routes are defined in `src/routes/users.py` using FastAPI.

**Proposed Changes:**
1. Add `preferences` JSON column to User model
2. Add GET/PUT `/users/{id}/preferences` endpoints
3. Add preference validation schema in `src/schemas/user.py`

**Questions/Concerns:**
- Should preferences have a schema or be freeform JSON?

---
Ready to implement? (waiting for approval)
```
