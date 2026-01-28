---
name: loki-logs
description: Query logs via Grafana Loki MCP server. USE WHEN user mentions 'logs', 'check logs', 'backend errors', 'debug', 'what happened'. Generic skill - project-specific datasource UIDs and namespaces should be in project CLAUDE.md files.
---

# Loki Log Lookup

## When to Activate This Skill
- "Check the logs for errors"
- "What's in the logs?"
- "Look up backend logs"
- "Any errors in production?"
- "Check logs for [keyword]"
- "Debug [service/feature]"

## Prerequisites

Project CLAUDE.md should define:
- **Datasource UID** - Loki datasource identifier
- **Namespace mappings** - k8s_namespace_name for each environment

## MCP Tool Usage

Use `mcp__grafana-prod__query_loki_logs` with:

```
datasourceUid: <from project CLAUDE.md>
logql: {k8s_namespace_name="<namespace>"} [filters]
limit: 10-100 (default 10)
startRfc3339: (optional) e.g., 2025-01-28T00:00:00Z
endRfc3339: (optional) defaults to now
direction: backward (newest first) or forward (oldest first)
```

## LogQL Query Patterns

**All logs for a namespace:**
```logql
{k8s_namespace_name="my-service-namespace"}
```

**Errors only:**
```logql
{k8s_namespace_name="my-service-namespace"} |~ "(?i)(error|exception|traceback)"
```

**Search for keyword (case-insensitive):**
```logql
{k8s_namespace_name="my-service-namespace"} |~ "(?i)(keyword1|keyword2)"
```

**Filter by JSON log level:**
```logql
{k8s_namespace_name="my-service-namespace"} | json | level="ERROR"
```

**Chain filters (AND logic):**
```logql
{k8s_namespace_name="my-service-namespace"} |~ "error" |~ "database"
```

**Exclude patterns:**
```logql
{k8s_namespace_name="my-service-namespace"} !~ "health.?check"
```

## Common Workflows

### Check Recent Errors
1. Query with error filter
2. Review stack traces
3. Correlate with recent deploys

### Debug Specific Feature
1. Search for feature keyword
2. Filter by time range around issue
3. Check related service logs

### Compare Environments
1. Run same query across dev/staging/prod namespaces
2. Look for discrepancies
3. Check for env-specific config issues

## Tips

- Start with small `limit` (10-20) to avoid context overload
- Use time ranges to narrow down issues
- `|~ "(?i)keyword"` for case-insensitive search
- Chain filters with `|~` for AND, use `|` (pipe) for OR within regex
- Use `!~` to exclude noisy patterns (health checks, etc.)
