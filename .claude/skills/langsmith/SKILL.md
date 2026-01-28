---
name: langsmith
description: Analyze LangSmith traces with guided walkthrough of agentic execution flow. USE WHEN user says 'analyze trace', 'debug trace', 'show me what happened', 'langsmith trace', or provides a trace ID. (user)
user-invocable: true
disable-model-invocation: true
argument-hint: <project_name> <trace_id>
---

# LangSmith Trace Guided Tour

## When to Activate This Skill
- User wants to analyze a LangSmith trace
- User provides a trace ID for debugging
- User asks "what happened in this trace?"
- User wants to understand agent execution flow
- Debugging slow or failed agent runs

## Arguments

- `$0` / `$ARGUMENTS[0]` (required): LangSmith project name (e.g., "agentic-os-prod")
- `$1` / `$ARGUMENTS[1]` (required): Trace ID (UUID format)

## Core Workflow

### Step 1: Fetch Trace Data
Use `mcp__langsmith__fetch_runs` with:
- `project_name`: $ARGUMENTS[0]
- `trace_id`: $ARGUMENTS[1]
- `limit`: 200 (capture full trace)

### Step 2: Provide Guided Tour

Walk through execution step-by-step:

**1. User Message**
- Show the input message that kicked off this trace
- What did the user originally ask?

**2. PI Agent Workflow**
- How did PI (Personal Intelligence) agent interpret the request?
- What planning/reasoning occurred?
- Any tool calls or sub-agents spawned?

**3. PDD Workflow (if present)**
- Was PDD (Placer Data Discovery) invoked?
- What data discovery steps occurred?
- SQL queries generated, data sources accessed?

**4. PI Agent Response**
- What was the final response to the user?
- How long did the full flow take?

**5. Key Metrics**
- Total duration
- Token usage (input/output tokens)
- Any errors or retries?
- Slowest operations (bottlenecks)

### Step 3: Show Execution Tree

Display visual tree structure:
```
PI Agent (root, 5.2s total)
├── interpret_request (llm, 0.8s)
├── PDD Agent (chain, 3.5s)
│   ├── discover_tables (tool, 1.2s)
│   ├── generate_sql (llm, 1.5s)
│   └── execute_query (tool, 0.8s)
└── format_response (llm, 0.9s)
```

### Step 4: Offer Deeper Dives

Ask if boss wants to:
- See full inputs/outputs for any specific step
- Analyze why a particular step was slow
- View actual SQL or tool calls made

## Example Usage

```
/langsmith agentic-os-prod 123e4567-e89b-12d3-a456-426614174000
```

## Key Principles

1. **Tell the story** - Focus on narrative of what happened, not raw data
2. **Highlight bottlenecks** - Identify slowest operations first
3. **Surface errors** - Make failures and retries visible immediately
4. **Progressive detail** - Start with overview, offer deeper dives on request

## Notes

- Trace IDs are UUIDs, often found in LangSmith URLs or logs
- The guided tour follows agentic-os flow: User → PI Agent → PDD → Response
