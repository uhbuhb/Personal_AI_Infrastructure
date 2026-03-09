# To Continue

<!-- INSTRUCTIONS FOR CLAUDE INSTANCES

When the user asks you to "park this", "save state", "write to to-continue",
or otherwise indicates they need to pause work for discussion or later resumption,
append a new entry below using the template.

## Rules

1. APPEND to this file — never overwrite existing entries
2. Each entry gets a unique ID: `YYYYMMDD-HHMMSS` (use current timestamp)
3. Be specific and concrete — another person (or Claude) reads this cold
4. Decision points are the most important section: frame as clear questions
   with enumerated options, tradeoffs, and your recommendation
5. Include file paths with line numbers for any code you touched or inspected
6. If resuming a parked task, update its Status to Done and note the outcome
7. Keep entries concise — enough to resume, not a full narrative
8. Include the **repo** name so tasks are identifiable across projects

## Template

```markdown
---

## [YYYYMMDD-HHMMSS] Short Task Title

**Status:** Parked — awaiting [decision/discussion/input]
**Repo:** `repo-name`
**Branch:** `branch-name` (or `uncommitted` if no branch yet)
**Jira:** TICKET-123 (if applicable)

### Context
What is this task and why does it matter? 2-3 sentences max.

### What's Done
- Concrete completed steps with `file:line` references
- e.g. Added migration `backend/alembic/versions/abc123_add_col.py`

### What's Not Done
- Remaining work items
- Ordered by dependency if possible

### Decision Points
> These are the questions that need answers before resuming.

1. **[Question framed as a clear choice]**
   - Option A: [description] — tradeoff: [pro/con]
   - Option B: [description] — tradeoff: [pro/con]
   - Recommendation: [your suggestion and why]

2. **[Next question if any]**
   - ...

### Files Touched
- `path/to/file.py:42` — [what was changed/inspected]
- `path/to/other.ts:18` — [what was changed/inspected]

### How to Resume
Step-by-step instructions to pick this back up:
1. Check out branch `xyz`
2. [Specific next action]
3. [Specific next action]
```

END OF INSTRUCTIONS — entries below this line -->

---

## [20260304-160000] AGENTIC-OS-API-1Y: Artifact FK violation on chat deletion

**Status:** Parked — awaiting decision on Option 3 (cancel in-flight tasks)
**Repo:** `agentic-os`
**Branch:** `hab/sources` (commit `bfd55019`)

### Context
Sentry issue AGENTIC-OS-API-1Y: when a user deletes a chat while a background artifact generation task is still running (~38s gap), the artifact save fails with `ForeignKeyViolationError`. Confirmed via Loki logs as a race condition (chat deleted on pod `pxrtj` at 17:07:18, artifact save attempted on pod `gjftc` at 17:07:56). 2 occurrences, 2 users impacted.

### What's Done
- Investigated Sentry issue, confirmed root cause via Loki log timeline
- **Option 1 implemented and committed** (`bfd55019`):
  - `conversation_helpers.py:303` — Catch `ForeignKeyViolationError` specifically, log warning, `return` early (no artifact emission = no UI flash)
  - `message_emitter.py:865` — Fix misleading "completed successfully" log; now inspects `gather` results for exceptions

### What's Not Done
- **Option 3: Cancel in-flight tasks on chat deletion** — not yet implemented, parked for discussion
  - Would require: new `artifact_task_registry.py` (~40 lines), wiring into `routes/chats.py` delete endpoint, registering tasks in `conversation_helpers.py`, cleanup in `finally` blocks
  - Saves wasted LLM compute (10K+ input, 13K+ output tokens per occurrence)
  - Existing `RequestLifecycle` in `request_lifecycle.py` could potentially be extended instead of a new registry

### Decision Points
> These are the questions that need answers before resuming.

1. **Should we implement Option 3 (cancel in-flight tasks on chat deletion)?**
   - Option A: Skip — 2 occurrences in 2 weeks, Option 1 already prevents errors and UI flash. Tradeoff: wastes ~$0.10-0.30 LLM cost per occurrence, but very rare.
   - Option B: Implement with new `artifact_task_registry.py` — clean, isolated, ~100 lines across 4 files. Tradeoff: new global state to maintain.
   - Option C: Extend existing `RequestLifecycle` infrastructure — DRY, reuses existing cancellation patterns. Tradeoff: couples artifact lifecycle to request lifecycle, may not fit cleanly.
   - Recommendation: Option A for now. Low occurrence rate doesn't justify the added complexity. Revisit if frequency increases.

2. **Should this fix be cherry-picked to a hotfix branch or ride the next release?**
   - Currently on `hab/sources` (feature branch). Needs to land on `main` to reach prod.

### Files Touched
- `agentic-os/backend/app/conversation_helpers.py:11` — Added `ForeignKeyViolationError` import
- `agentic-os/backend/app/conversation_helpers.py:303-307` — Added FK violation catch with early return
- `agentic-os/backend/app/message_emitter.py:861-871` — Fixed gather result inspection
- `agentic-os/backend/app/routes/chats.py:228-245` — Inspected delete endpoint (no changes)
- `agentic-os/backend/app/request_lifecycle.py` — Inspected existing cancellation infrastructure (no changes)
- `agentic-os/backend/app/artifact_generator_v3.py` — Inspected artifact generation flow (no changes)

### How to Resume
1. Check out branch `hab/sources` at commit `bfd55019`
2. If proceeding with Option 3: read `request_lifecycle.py` to decide whether to extend it or create new `artifact_task_registry.py`
3. Wire task registration into `conversation_helpers.py:632` (where `asyncio.create_task` is called)
4. Add `cancel_tasks_for_chat()` call in `routes/chats.py` delete endpoint before DB delete

---

## [20260305-120000] Cross-Pod SSE Buffer: Disable Reconnect, Rely on Polling

**Status:** Parked — awaiting decision on removing SSE reconnect mechanism
**Repo:** `agentic-os`
**Branch:** `hab/sources` (commits `9f5f488a`, `007ef4f7`)

### Context
Users (Asaf Moshe, Maagan Hayon) reported two symptoms from the same root cause: the SSE event buffer is in-memory per-pod (`_event_buffers: Dict[str, SSEEventBuffer]` in `message_emitter.py`). When SSE reconnects to a different pod, the buffer isn't found → `reconnection_expired` error. Symptom 1: scary red error banner. Symptom 2: artifact panel stuck loading forever (spinner never clears).

### What's Done
- **Investigated** full SSE reconnection flow across frontend and backend
- **Commit `9f5f488a`** — Polling fallback now clears artifact generating state (`stopGenerating()` + `selectArtifact()`) when artifacts detected in DB
- **Commit `007ef4f7`** — Suppressed `reconnection_expired` error display (returns `null` from `ErrorDisplay`), polling now matches and clears messages with `reconnection_expired` error
- Both symptoms are **no longer user-facing** — polling recovers everything silently within 3 seconds

### What's Not Done
- **Decision: Remove SSE reconnect entirely vs keep it** — see Decision Points below
- If removing: strip `Last-Event-ID` handling from frontend SSE client, remove buffer infrastructure from backend
- If keeping: consider Redis-backed buffer or sticky sessions (significant infra work)
- Push commits and create PR

### Decision Points
> These are the questions that need answers before resuming.

1. **Should we remove the SSE reconnect mechanism entirely and rely solely on polling?**
   - Option A: **Remove reconnect** — Delete `Last-Event-ID` handling from `sse-client.ts`, remove `SSEEventBuffer` class and `_event_buffers` dict from `message_emitter.py`, remove reconnection handling from `routes/chat.py:520-548`. Tradeoff: simplifies codebase significantly, eliminates the entire class of cross-pod bugs. Only cost is up to 3-second delay on SSE drop (imperceptible — user is already waiting for LLM).
   - Option B: **Keep reconnect + add Redis buffer** — Move `SSEEventBuffer` to Redis so any pod can replay. Tradeoff: works cross-pod, but adds Redis dependency for streaming, significant implementation effort, and the polling fallback already handles recovery.
   - Option C: **Keep reconnect + sticky sessions** — Configure load balancer affinity. Tradeoff: fixes same-pod reconnect, but adds infra complexity, can cause uneven load distribution.
   - Option D: **Keep current state** — UX fixes already suppress the symptoms. Tradeoff: zero additional work, buffer code stays as dead weight but causes no harm.
   - **Recommendation: Option A** — The reconnect adds complexity with near-zero benefit. Polling is the real recovery layer. Removing it simplifies the codebase and eliminates future cross-pod issues.

2. **Scope of removal — how aggressive?**
   - Option A: **Full removal** — Delete `SSEEventBuffer` class, `_event_buffers` dict, `get_event_buffer()`, `Last-Event-ID` handling in chat route, event ID generation in emitter. Clean cut.
   - Option B: **Frontend-only** — Just stop sending `Last-Event-ID` header in `sse-client.ts`. Backend buffer code becomes dead code but harmless. Minimal change, lower risk.
   - Recommendation: Option B first (1 line change), Option A as cleanup in a follow-up PR.

### Files Touched
- `agentic-os/frontend/src/hooks/use-poll-incomplete-messages.ts:123-149` — Added artifact state cleanup and reconnection_expired matching
- `agentic-os/frontend/src/components/chat/message-item.tsx` — Suppressed reconnection_expired in ErrorDisplay
- `agentic-os/frontend/src/types/api.ts:128` — Added RECONNECTION_EXPIRED to ErrorCategory enum
- `agentic-os/backend/app/message_emitter.py:116` — Inspected `_event_buffers` dict (root cause)
- `agentic-os/backend/app/routes/chat.py:520-548` — Inspected reconnection handling
- `agentic-os/frontend/src/services/sse-client.ts` — Inspected `@microsoft/fetch-event-source` reconnect behavior
- `agentic-os/frontend/src/services/sse-stream.ts:252-278` — Inspected artifact SSE event handling
- `agentic-os/frontend/src/stores/artifact-store.ts` — Inspected isGenerating state
- `agentic-os/frontend/src/hooks/use-streaming.ts:168` — Inspected error storage flow

### How to Resume
1. Check out branch `hab/sources` (commits `9f5f488a` and `007ef4f7` are on this branch)
2. Decide on reconnect removal scope (Decision Points above)
3. If Option A+B: Remove `Last-Event-ID` header from `sse-client.ts`, then clean up backend buffer code
4. Push commits and create PR for the existing UX fixes + any reconnect removal



## [20260303-131800] Productionize Hatchet Deployment — Address PE Review

**Status:** 🟡 Parked — awaiting discussion with PE (Ilia) and team decisions
**Repo:** `hatchet-orchestrator`
**Branch:** `hab/fix` (hatchet-orchestrator), `hab/hatchet` (infrastructure, infra-k8s-deployments, be-k8s-deployments)

### Context
We implemented the full ArgoCD GitOps deployment for Hatchet on `gtm-staging-k8s` across 3 repos (infrastructure, infra-k8s-deployments, be-k8s-deployments) with 3 open PRs. Ilia from PE reviewed the Confluence page and left a detailed review with 5 must-fix items for staging and 13 should-fix items for production. The Confluence page is live and the PE message has been drafted.

### What's Done
- Terraform for Cloud SQL + WIF in `infrastructure` repo — PR [#6560](https://github.com/placer-engineering/infrastructure/pull/6560)
- Hatchet server wrapper chart + cluster config in `infra-k8s-deployments` — PR [#4091](https://github.com/placer-engineering/infra-k8s-deployments/pull/4091)
- Scheduler API + Worker in `be-k8s-deployments` — PR [#3152](https://github.com/placer-engineering/be-k8s-deployments/pull/3152)
- Vault Injector `.env` path support in `shared/config.py` — committed on `hab/fix`, not pushed
- Confluence page published: [Hatchet Scheduler Service](https://placer.atlassian.net/wiki/spaces/GE/pages/3070951427/Hatchet+Scheduler+Service)
- PE message drafted and shared

### What's Not Done

**Must-fix before merge (staging) — from Ilia's review:**
1. Fix `global.environment` in `clusters/staging/gtm-staging-k8s/hatchet/values.yaml` — says `dev`, should be `staging` or removed
2. Fix hardcoded secret names in ExternalSecret templates — use `.Release.Name` instead of hardcoded `hatchet-config` / `hatchet-db-credentials`
3. Add `_helpers.tpl` to wrapper chart + upstream values reference comment
4. Enable Prometheus metrics (`SERVER_PROMETHEUS_ENABLED`) + add ServiceMonitor template
5. Switch to CloudSQL proxy sidecar (upstream chart has native `cloudSQLSidecar` support)

**Should-fix before production (key items):**
- SSO: Enable Google OAuth as fallback, restrict email domains, disable basic auth
- Security contexts (`runAsNonRoot`, drop capabilities)
- Disable `SERVER_SECURITY_CHECK_ENABLED` (phones home)
- Add HPA + PDB templates in wrapper chart
- Enable OTel tracing
- Mirror chart to GCP Artifact Registry + fix Renovate annotation
- Set `dnsConfig.ndots: 3`, `revisionHistoryLimit: 3`
- Grafana dashboard, alerts, Sentry project, service runbook

**Manual operational steps (after PRs merge):**
- Terraform apply for Cloud SQL instances
- Generate Hatchet encryption keys, store in Vault at `kv/staging/apps/hatchet/config`
- Run Hatchet DB migrations
- Seed admin user + generate client token, store in Vault at `kv/staging/apps/hatchet/client-token`
- End-to-end verification

### Decision Points
> These are the questions that need answers before resuming.

1. **Should we address all 5 must-fix items before merging, or merge staging as-is and follow up?**
   - Option A: Fix all 5 now — tradeoff: cleaner merge, but delays deployment by a day
   - Option B: Fix items 1-3 now (quick), defer Prometheus + CloudSQL proxy — tradeoff: faster to staging, but needs follow-up PR
   - Recommendation: Option B — items 1-3 are quick fixes; Prometheus and CloudSQL proxy are additive and can be follow-up PRs

2. **CloudSQL proxy vs direct private IP — is this a hard blocker for staging?**
   - Option A: Switch to CloudSQL proxy sidecar now — tradeoff: aligns with repo standard, but more config changes
   - Option B: Keep direct private IP for staging, switch for production — tradeoff: faster, but deviates from standard
   - Recommendation: Ask Ilia if direct IP is acceptable for staging

3. **SSO strategy — Google OAuth vs contributing OIDC upstream?**
   - Option A: Enable Google OAuth now — tradeoff: quick, works with Placer Google Workspace
   - Option B: Contribute OIDC PR to Hatchet upstream — tradeoff: right long-term solution, but significant effort
   - Recommendation: Google OAuth now, track upstream OIDC separately

4. **Performance questions from Ilia — how much detail is needed?**
   - The review asks 12 detailed questions about load testing, throughput, retry handling, etc.
   - Need to decide: answer from existing knowledge, or run actual load tests first?

### Files Touched
- `shared/config.py:17` — changed `env_file` to tuple for Vault Injector support (hatchet-orchestrator)
- `us/staging/app-infra/gtm/hatchet/main.tf` — Cloud SQL + WIF Terraform (infrastructure)
- `us/staging/app-infra/gtm/hatchet/providers.tf` — Google + Vault providers (infrastructure)
- `charts/hatchet/Chart.yaml` — wrapper chart for hatchet-ha v0.10.3 (infra-k8s-deployments)
- `charts/hatchet/values.yaml` — chart defaults (infra-k8s-deployments)
- `charts/hatchet/templates/db-external-secret.yaml` — DB credentials from Vault (infra-k8s-deployments)
- `charts/hatchet/templates/config-external-secret.yaml` — encryption keys from Vault (infra-k8s-deployments)
- `clusters/staging/gtm-staging-k8s/hatchet/values.yaml` — cluster config (infra-k8s-deployments)
- `gtm-hatchet-scheduler-api/` — full service directory (be-k8s-deployments)
- `gtm-hatchet-scheduler-worker/` — full service directory (be-k8s-deployments)
- `be-app-of-apps/templates/gtm-hatchet-scheduler-api-dev.yaml` — ArgoCD app (be-k8s-deployments)
- `be-app-of-apps/templates/gtm-hatchet-scheduler-worker-dev.yaml` — ArgoCD app (be-k8s-deployments)
- Confluence page: [3070951427](https://placer.atlassian.net/wiki/spaces/GE/pages/3070951427/Hatchet+Scheduler+Service)

### How to Resume
1. Check out `hab/hatchet` branches in `infrastructure`, `infra-k8s-deployments`, and `be-k8s-deployments`
2. Review Ilia's PE review comment on the Confluence page for full context
3. Address must-fix items (start with `global.environment` fix in infra-k8s-deployments)
4. Respond to Ilia's comment on Confluence with answers to performance questions
5. Push updated PRs for re-review
