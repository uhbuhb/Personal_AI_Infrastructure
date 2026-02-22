---
name: coding
description: Production-ready code implementation following clean architecture and universal engineering standards. INVOKE when implementing features, modifying code, or refactoring. (user)
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

3. **Follow standards below** — universal standards apply to ALL code, then language-specific standards for the relevant stack

4. **Verify and complete:**
   - Run tests if applicable
   - Show files modified/created
   - Provide testing instructions

---

## Universal Standards (All Languages)

These rules apply regardless of language, framework, or platform.

### Data Integrity

**Atomic mutations.** When multiple write operations must succeed or fail together, they MUST be wrapped in a single transaction. Sequential writes without a transaction boundary are a bug — partial failure leaves the database in an inconsistent state.

Red flags that indicate a missing transaction:
- Two or more write calls in sequence (save, update, delete) without a wrapping transaction
- A usecase/service that calls multiple repository write methods one after another
- Delete operations that must clean up related records
- Any "if step 1 succeeds but step 2 fails" scenario that would leave bad state

The fix pattern is the same everywhere — wrap in the framework's transaction primitive:
- SQL: `BEGIN; ... COMMIT;`
- Isar (Flutter): `isar.writeTxn(() async { ... })`
- SQLAlchemy: `async with conn.transaction(): ...`
- Prisma: `prisma.$transaction([...])`
- MongoDB: `session.withTransaction(...)`
- Core Data: `context.performAndWait { ... }`

If the framework doesn't support transactions, implement idempotent retry logic so the operation can resume from the last completed step.

**Bounded numeric updates.** When applying incremental or learned updates to stored values (moving averages, counters, rates), always clamp the result to a sane range. An unbounded update is a data corruption vector — one bad input permanently poisons the value.

**Consistent reads after writes.** After writing data, any subsequent read in the same operation should see the updated state. If your storage layer doesn't guarantee this (eventual consistency), account for it explicitly.

### Architecture & Layering

**Respect layer boundaries.** Never skip layers. UI/presentation code must not access data storage directly — it goes through business logic / usecases, which go through repository interfaces.

| Layer | Talks to | Never talks to |
|-------|----------|----------------|
| **UI / Presentation** | Business logic, state management | Database, network clients |
| **Business logic / Services** | Repository interfaces | UI, framework-specific APIs |
| **Repositories / Data** | Storage, network, external APIs | UI, other repositories |

**Depend on abstractions.** Business logic depends on repository interfaces, not implementations. This keeps the domain layer testable and framework-independent.

**Secrets belong in environment, not code.** API keys, tokens, and credentials come from environment variables or secure storage, never hardcoded. Sensitive tokens (OAuth, refresh tokens) must use platform-secure storage (Keychain, Keystore, encrypted storage), not plaintext databases.

### Error Handling

**Explicit over silent.** Functions that can fail should make failure explicit in their return type (Result types, Either, exceptions — whatever the project uses). Never swallow errors silently.

**Fail loud at boundaries, recover gracefully inside.** Validate inputs at system boundaries (user input, API responses, external data). Inside the system, trust internal types and contracts — don't over-validate.

**Clean up on failure.** If an operation fails partway through, clean up side effects (delete partial uploads, clear stale tokens, roll back state). Stale/orphaned state is a bug.

### Clean Code

**Functions:**
- Small — functions should be small, then smaller
- Do one thing — single responsibility per function
- Few arguments — ideally 0-2, avoid more than 3
- No side effects — don't modify state unexpectedly
- No flag arguments — split into separate functions

**Code smells to avoid:**
- **Rigidity** — hard to change because changes cascade
- **Fragility** — changes break things unexpectedly
- **Needless complexity** — over-engineering for hypothetical futures
- **Needless repetition** — DRY violation
- **Conditionals in function names** — indicates function doing two things; caller should handle the conditional

**Logging, not print.** Use structured logging with severity levels, never bare print/console.log in production code. Debug prints leak user data to device logs.

**Imports at top of file.** Never import mid-function.

### Code Quality Checklist

Before completing ANY implementation, verify:

- [ ] **Types** — type annotations/hints on all functions and signatures
- [ ] **Errors** — failure paths are explicit, not swallowed silently
- [ ] **Transactions** — multi-step DB writes are wrapped in a single transaction
- [ ] **Bounds** — numeric updates (averages, rates, counters) are clamped to sane ranges
- [ ] **Secrets** — no hardcoded keys/tokens; sensitive tokens in secure storage
- [ ] **Logging** — structured logging, no bare print/console.log in production paths
- [ ] **Cleanup** — failed operations clean up partial state (stale tokens, orphaned records)
- [ ] **Layers** — presentation doesn't touch data layer; business logic doesn't touch UI

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
| New DB table | `models.py` + migration |

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
- **ALWAYS use `uv run python`** — NEVER run `python` or `python3` directly
- **ALWAYS use `uv add/remove/sync`** — NEVER USE PIP, EVER

### Project Organization
- **ALWAYS create a Makefile** for repositories with common commands
- Include targets for: test, lint, format, run, build, install, clean

---

## Output Format

After completing implementation:

**Files Modified:**
- `path/to/file.ext` - [what changed]

**New Files:**
- `path/to/new_file.ext` - [purpose]

**Testing:**
- [how to verify the change works]

**Notes:**
- [any follow-up items or considerations]
