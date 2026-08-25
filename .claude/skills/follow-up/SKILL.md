---
name: follow-up
description: Schedule a Slack reminder to yourself at a future time, carrying the relevant context from the current conversation plus a `claude --resume` command to jump back into this exact session. Use when the user says "follow up", "remind me", "ping me later", or "set a reminder".
argument-hint: [when] [what to follow up on]
disable-model-invocation: true
---

# Follow-up reminder

Schedule a Slack DM to the user at a future time that (a) carries the relevant context from **this** conversation and (b) ends with a one-command way to resume **this exact** Claude Code session.

Live context (injected when this skill loads — use these values, do not re-derive):
- **Working dir:** !`pwd`
- **Session ID:** !`echo "$CLAUDE_CODE_SESSION_ID"`
- **Now (UTC):** !`date -u +%Y-%m-%dT%H:%M:%SZ`

## Arguments

`$ARGUMENTS` = `[when] [what to follow up on]`
Example: `/follow-up monday 10am re-check PI-782 sentry recurrence`

- **[when]** — relative ("in 3 days", "tomorrow 9am", "monday 10am") or absolute. Always interpreted in the user's local timezone, **America/Los_Angeles**.
- **rest** — what to be reminded about. If omitted, infer the follow-up from the current conversation and confirm it with the user.

## Instructions

1. **Resolve the time.**
   - Anchor on the injected **Now (UTC)** above — never guess today's date.
   - Resolve any relative phrase ("monday 10am", "in 3 days") to a concrete local datetime first.
   - Convert that local time to a Unix timestamp with correct DST (handles PDT/PST automatically):
     ```
     python3 -c "from datetime import datetime; from zoneinfo import ZoneInfo; print(int(datetime(YYYY,M,D,HH,MM,tzinfo=ZoneInfo('America/Los_Angeles')).timestamp()))"
     ```
     (For a pure duration like "in 2 hours", `now_unix + seconds` is fine.)
   - Validate: must be **≥120s** in the future and **≤120 days** out (Slack limits). If it resolves to the past, ask the user to clarify rather than rolling forward.
   - Echo the resolved **local time AND UTC** back to the user for confirmation.

2. **Compose the reminder message** from the current conversation. The user reads it cold, possibly days later, so make it self-contained:
   - One-line title of what to follow up on.
   - Key context: current state, what's pending/blocked, and concrete check-steps.
   - Any relevant links surfaced in the conversation (Jira, GitHub PR, Sentry, `file:line`).
   - **Last line = resume command**, built from the injected values above:
     ```
     cd <Working dir> && claude --resume <Session ID>
     ```
     This lets the user reopen this exact session. (If the injected Session ID is empty, run `echo "$CLAUDE_CODE_SESSION_ID"` via Bash to fetch it.)
   - Slack markdown: `*bold*`, `` `code` ``, `:alarm_clock:` etc.

3. **Resolve the Slack target.** Send to the user's **own DM** — `channel_id` = the logged-in user's Slack `user_id`. Load the Slack tool first:
   `ToolSearch` → `select:mcp__plugin_slack_slack__slack_schedule_message`. The logged-in user's `user_id` is shown in the `slack_search_users` tool description (load it too if needed, or look the user up by email).

4. **Schedule it** (do NOT send now):
   `slack_schedule_message(channel_id=<self DM user_id>, message=<composed>, post_at=<unix ts>)`

5. **Confirm.** Report the resolved local + UTC time, the **scheduled message ID**, and note that scheduled Slack messages can't be edited via API — to change it, use **"Drafts & sent"** in Slack, or re-run after cancelling.

## Constraints

- Self-reminder only: schedule to the user's own DM, never a shared channel, unless the user explicitly names one.
- Always **schedule** (`slack_schedule_message`), never `slack_send_message`.
- Concise but complete — actionable without re-reading the whole thread.
- This skill has side effects (schedules an outbound message); it is user-invoked only.
