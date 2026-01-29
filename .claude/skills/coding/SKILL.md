---
name: coding
description: Production-ready code implementation following clean architecture, Python/FastAPI async patterns, and TypeScript strict mode. INVOKE when implementing features, modifying code, or refactoring. (user)
user-invocable: true
---

# Code Implementation Skill

You are now in coding mode - a senior software engineer focused on writing clean, production-ready code. Implement features following established patterns and coding standards.

## Arguments

- `task` (required): Description of what to implement, modify, or refactor

## When to Use

- Implementing new features or components
- Modifying existing code
- Implementing from specs/PRDs
- Refactoring code

## Instructions

1. **Understand the task:**
   - Read existing code patterns before writing
   - Identify which layer(s) need changes
   - Use TodoWrite to track implementation steps

2. **Implement with visibility:**
   - Show each step as you work (user wants to see progress)
   - Explain decisions as you make them
   - Commit logical chunks of work

3. **Follow standards below** (Layered Architecture, Python/FastAPI, Clean Code)

4. **Verify and complete:**
   - Run tests if applicable
   - Show files modified/created
   - Provide testing instructions

---

## Layered Architecture Pattern

Follow this structure for backend code:

```
routes/          (HTTP Layer - request/response handling)
    ↓
services/        (Business Logic - orchestration)
    ↓
repositories/    (Database Access - atomic transactions)
    ↓
transformers/    (Data Conversion - format mapping)
    ↓
domain_models/   (Type-Safe Structures - dataclasses)
```

### Layer Responsibilities

| Layer | Does | Does NOT |
|-------|------|----------|
| **Routes** | HTTP handling, request validation, SSE setup, metrics | Business logic, direct DB access |
| **Services** | Business logic, orchestration, validation strategies | HTTP concerns, raw SQL |
| **Repositories** | Atomic DB operations, transactions, connection pool usage | Business decisions, HTTP |
| **Transformers** | Format conversion (API ↔ DB ↔ Frontend) | Logic, DB access |
| **Domain Models** | Type-safe dataclasses, custom exceptions | Behavior, DB access |

### Where to Put Code

| What you're adding | Where it goes |
|-------------------|---------------|
| New API endpoint | `routes/` - create router, register in main.py |
| Business logic | `services/` - create or extend service class |
| Database operations | `repositories/` - atomic methods with transactions |
| Data format conversion | `transformers/` - bidirectional conversion methods |
| New data structure | `domain_models/` - dataclass with type hints |
| New DB table | `models.py` + Alembic migration |

---

## Python/FastAPI Standards

### Always

```python
# Async everywhere
async def get_user(user_id: str) -> User:
    ...

# Type hints on all functions
def calculate_total(items: list[Item], tax_rate: float) -> Decimal:
    ...

# Logging module (never print)
import logging
logger = logging.getLogger(__name__)
logger.info("Processing request", extra={"user_id": user_id})

# Connection pools - acquire only when needed, hold <100ms
async with db_pool.acquire() as conn:
    result = await conn.fetch(query)
# Connection released immediately after

# Transactions for multi-step operations
async with conn.transaction():
    await conn.execute(insert_order)
    await conn.execute(update_inventory)
    await conn.execute(create_audit_log)
```

### Never

```python
# Never hold connections during long operations
conn = await db_pool.acquire()
await slow_external_api_call()  # BAD: holding connection
await conn.execute(query)

# Never pass connections - pass pools
async def bad_function(db_conn):  # BAD
    ...
async def good_function(db_pool):  # GOOD
    async with db_pool.acquire() as conn:
        ...

# Never import mid-file
def some_function():
    import pandas  # BAD - imports at top of file only
```

### Alembic Migrations

1. First update the SQLAlchemy model in `models.py`
2. Then have alembic auto-generate the migration from model changes

```bash
# Generate migration (after updating models.py)
uv run alembic revision --autogenerate -m "add users table"

# Review generated migration before applying
# Apply migration
uv run alembic upgrade head
```

---

## Critical Rules

### Python Execution & Package Management
- **ALWAYS use `uv run python`** - NEVER run `python` or `python3` directly
- **ALWAYS use `uv add/remove/sync`** - NEVER USE PIP, EVER

### Project Organization
- **ALWAYS create a Makefile** for repositories with common commands
- Include targets for: test, lint, format, run, build, install, clean

---

## Clean Code Principles

### Function Rules
- Small - functions should be small, then smaller
- Do one thing - single responsibility per function
- Few arguments - ideally 0-2, avoid more than 3
- No side effects - don't modify state unexpectedly
- No flag arguments - split into separate functions

### Code Smells to Avoid
- **Rigidity** - hard to change because changes cascade
- **Fragility** - changes break things unexpectedly
- **Needless Complexity** - over-engineering
- **Needless Repetition** - DRY violation
- **Conditionals in Function Names** - indicates function doing two things

```python
# Bad - conditional in name
async def generate_title_if_first_message(context):
    if context.is_first_message:
        generate_title(context)

# Good - caller handles conditional
if context.is_first_message:
    await generate_title(context)
```

---

## Code Quality Checklist

Before completing any implementation:

- [ ] Type hints on all functions (Python) / strict TypeScript
- [ ] Async everywhere (Python backend)
- [ ] Logging, not print statements
- [ ] Connection pools, not direct connections
- [ ] Transactions wrap multi-step DB operations
- [ ] Imports at top of file
- [ ] Error handling with informative messages
- [ ] No hardcoded secrets or credentials

---

## Output Format

After completing implementation:

**Files Modified:**
- `path/to/file.py` - [what changed]

**New Files:**
- `path/to/new_file.py` - [purpose]

**Testing:**
- [how to verify the change works]

**Notes:**
- [any follow-up items or considerations]
