---
name: loki-logs-cli
description: Query Agentic OS logs via the `loki` CLI wrapper. Supports dev, staging, and prod environments.
---

# Agentic OS Loki Log Lookup (CLI)

Uses the `loki` CLI wrapper at `~/.local/bin/loki` to query Grafana Loki logs.

## Authentication

Requires a `GRAFANA_SESSION` cookie. If the session is expired, ask the user to:
1. Open https://grafana-prod.placer.team in browser (login via Okta)
2. DevTools (F12) → Application → Cookies → `grafana_session`
3. Provide the cookie value

Pass it as: `GRAFANA_SESSION="<cookie>" loki [options]`

## CLI Usage

```bash
loki [options] [search_text]
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `-t, --time TIME` | Time range (e.g. 5m, 3h, 1d) | 5m |
| `-l, --limit NUM` | Max results | 100 |
| `-n, --ns NAME` | Kubernetes namespace | gtm-agentic-os-back-end-dev |
| `-e, --errors` | Filter errors/exceptions only | off |
| `-r, --raw` | Output raw JSON | off |

### Namespaces

| Environment | Namespace |
|-------------|-----------|
| **Dev** | `gtm-agentic-os-back-end-dev` (default) |
| **Staging** | `gtm-agentic-os-back-end-staging` |
| **Prod** | `gtm-agentic-os-back-end-prod` |
| **PDD** | `pi-pdd-api` |

## Common Queries

**Recent errors in prod:**
```bash
loki -n gtm-agentic-os-back-end-prod -t 30m -e
```

**Search for keyword in prod:**
```bash
loki -n gtm-agentic-os-back-end-prod -t 1h "keyword"
```

**Search by chat/trace ID:**
```bash
loki -n gtm-agentic-os-back-end-prod -t 3h "79a74e46"
```

**Specific endpoint:**
```bash
loki -n gtm-agentic-os-back-end-prod -t 30m "POST /api/chats"
```

**PDD service errors:**
```bash
loki -n pi-pdd-api -t 1h -e
```

**Raw JSON for scripting:**
```bash
loki -n gtm-agentic-os-back-end-prod -r -t 30m "search" | jq ".data.result"
```

## Tips

- Always pass `GRAFANA_SESSION` env var if the default is expired
- Start with `-t 30m` and expand if needed
- Use `-r` (raw JSON) + jq for extracting specific fields or filtering
- Timestamps are UTC (PST = UTC - 8h)
- VPN must be connected for Loki access
- If you get "Unauthorized", the session cookie has expired — ask the user for a new one
