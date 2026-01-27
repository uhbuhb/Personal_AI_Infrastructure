---
name: langsmith
description: Get a guided tour of a LangSmith trace. Takes project_name and trace_id args. USE WHEN user wants to analyze, debug, or understand a specific LangSmith trace.
disable-model-invocation: true
---

# LangSmith Trace Guided Tour

You are helping boss analyze a LangSmith trace with a guided walkthrough of the agentic-os execution flow.

## Arguments

- `project_name` (first arg, required): The LangSmith project name (e.g., "agentic-os-prod")
- `trace_id` (second arg, required): The trace ID to analyze (UUID format)

## Instructions

1. **Fetch the trace data:**
   - Use `mcp__langsmith__fetch_runs` with:
     - `project_name`: the provided project name
     - `trace_id`: the provided trace ID
   - Set a high `limit` (e.g., 200) to capture the full trace

2. **Provide a Guided Tour of the trace:**

   Walk boss through the execution step-by-step:

   ### 1. User Message
   - What did the user originally ask?
   - Show the input message that kicked off this trace

   ### 2. PI Agent Workflow
   - How did the PI (Personal Intelligence) agent interpret the request?
   - What planning/reasoning did it do?
   - Any tool calls or sub-agents spawned?

   ### 3. PDD Workflow (if present)
   - Was PDD (Placer Data Discovery) invoked?
   - What data discovery steps occurred?
   - SQL queries generated, data sources accessed?

   ### 4. PI Agent Response
   - What was the final response to the user?
   - How long did the full flow take?

   ### 5. Key Metrics
   - Total duration
   - Token usage (input/output tokens)
   - Any errors or retries?
   - Slowest operations (bottlenecks)

3. **Show the execution tree:**
   ```
   PI Agent (root, 5.2s total)
   ├── interpret_request (llm, 0.8s)
   ├── PDD Agent (chain, 3.5s)
   │   ├── discover_tables (tool, 1.2s)
   │   ├── generate_sql (llm, 1.5s)
   │   └── execute_query (tool, 0.8s)
   └── format_response (llm, 0.9s)
   ```

4. **Offer deeper dives:**
   Ask if boss wants to:
   - See full inputs/outputs for any specific step
   - Analyze why a particular step was slow
   - View the actual SQL or tool calls made

## Example Usage

```
/langsmith agentic-os-prod 123e4567-e89b-12d3-a456-426614174000
```

## Notes

- Trace IDs are UUIDs, often found in LangSmith URLs or logs
- The guided tour follows the agentic-os flow: User → PI Agent → PDD → Response
- Focus on telling the "story" of what happened, not just raw data
