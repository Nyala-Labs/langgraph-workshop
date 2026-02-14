# Debugging Checklist

Use this checklist when your agent isn't working as expected.

## 1. Graph Not Executing

### Symptoms
- No output after invoking graph
- Hangs indefinitely
- No nodes seem to execute

### Diagnosis Steps
1. Check if graph compiled successfully:
   ```python
   graph = create_graph()
   print("Graph compiled:", graph is not None)
   ```

2. Verify state schema matches node outputs:
   ```python
   # Ensure node returns dict with valid keys
   result = node(test_state)
   print("Node output keys:", result.keys())
   ```

3. Check for infinite loops in conditional edges:
   ```python
   # Add debug prints in routing function
   def route_to_agent(state):
       agent = state["current_agent"]
       print(f"Routing to: {agent}")
       return agent
   ```

### Solutions
- Add debug prints at start/end of each node
- Use `stream_mode="updates"` to see step-by-step execution
- Check LangSmith traces for detailed execution flow

---

## 2. State Not Persisting

### Symptoms
- Multi-turn conversations start fresh each time
- Checkpoint history is empty
- `thread_id` doesn't maintain state

### Diagnosis Steps
1. Verify checkpointer is configured:
   ```python
   print("Checkpointer:", graph.checkpointer)
   ```

2. Check `thread_id` is provided:
   ```python
   config = {"configurable": {"thread_id": "test"}}
   print("Config:", config)
   ```

3. Inspect checkpoint history:
   ```python
   history = list(graph.get_state_history(config))
   print(f"Checkpoints: {len(history)}")
   ```

### Solutions
- Ensure `checkpointer` passed to `compile()`
- Always include `thread_id` in config
- For production, use `SqliteSaver` or `PostgresSaver`, not `MemorySaver`
- Check database file permissions

---

## 3. Interrupts Not Working

### Symptoms
- `interrupt()` doesn't pause execution
- No `__interrupt__` in result
- Resume doesn't work

### Diagnosis Steps
1. Verify checkpointer is present (required for interrupts):
   ```python
   assert graph.checkpointer is not None
   ```

2. Check if `interrupt()` is wrapped in try/except (don't do this!):
   ```python
   # BAD - catches interrupt exception
   try:
       value = interrupt("Question?")
   except:
       pass
   ```

3. Ensure using `Command(resume=...)` correctly:
   ```python
   from langgraph.types import Command
   result = graph.invoke(Command(resume=True), config)
   ```

### Solutions
- Remove try/except around `interrupt()`
- Always use same `thread_id` when resuming
- Pass serializable values to `interrupt()`
- Check LangSmith trace for interrupt events

---

## 4. Memory Store Not Working

### Symptoms
- Preferences don't persist across threads
- Store searches return empty
- "user_id" not found errors

### Diagnosis Steps
1. Verify store is configured:
   ```python
   print("Store:", graph.store)
   ```

2. Check namespace is correct:
   ```python
   namespace = (user_id, "memories")
   print("Namespace:", namespace)
   ```

3. Test put/search directly:
   ```python
   from uuid import uuid4
   store.put(namespace, str(uuid4()), {"test": "data"})
   results = list(store.search(namespace))
   print(f"Stored items: {len(results)}")
   ```

### Solutions
- Pass `store` to `compile()`
- Ensure `user_id` in `config["context"]`
- Nodes must accept `store` via runtime: `def node(state, *, store)`
- For semantic search, configure embeddings in store

---

## 5. Routing Issues

### Symptoms
- Wrong agent handles query
- Supervisor routes to same agent every time
- Conditional edges don't work

### Diagnosis Steps
1. Add logging to routing function:
   ```python
   def router(state):
       agent = determine_agent(state)
       print(f"Query: {state['messages'][-1]}")
       print(f"Routing to: {agent}")
       return agent
   ```

2. Test routing logic in isolation:
   ```python
   test_state = {"messages": [{"content": "search for Python"}]}
   result = router(test_state)
   print(f"Routed to: {result}")
   ```

3. Check edge mapping matches return values:
   ```python
   workflow.add_conditional_edges(
       "supervisor",
       router,
       {"web_search": "web_search", ...}  # Keys must match router output
   )
   ```

### Solutions
- Ensure router returns valid node name
- Add default case in routing logic
- Use LLM-based routing for complex queries
- Test with diverse query examples

---

## 6. Tool Execution Failures

### Symptoms
- Tools raise exceptions
- Tool outputs not in state
- Agent gets stuck after tool call

### Diagnosis Steps
1. Test tool independently:
   ```python
   result = tool.invoke({"query": "test"})
   print("Tool result:", result)
   ```

2. Check tool error messages:
   ```python
   try:
       result = tool.invoke(input)
   except Exception as e:
       print(f"Tool error: {type(e).__name__}: {e}")
   ```

3. Verify tool inputs match expected schema:
   ```python
   print("Tool expects:", tool.args_schema)
   print("Actual input:", tool_input)
   ```

### Solutions
- Add error handling in tool definitions
- Validate inputs before tool execution
- Use tool mocks for testing
- Check API keys are valid
- Add retry logic for flaky tools

---

## 7. Performance Issues

### Symptoms
- Graph takes too long to execute
- High token usage
- Timeout errors

### Diagnosis Steps
1. Profile execution time per node:
   ```python
   import time
   for update in graph.stream(input, stream_mode="updates"):
       print(f"Update at {time.time()}: {update}")
   ```

2. Check LangSmith traces for bottlenecks:
   - Look for long-running LLM calls
   - Identify expensive tool calls
   - Find redundant operations

3. Monitor token usage:
   ```python
   # In LangSmith, check:
   # - Total tokens per run
   # - Cost per run
   # - Token usage by node
   ```

### Solutions
- Use cheaper models for routing (e.g., `gpt-4o-mini`)
- Cache frequent LLM calls
- Parallelize independent operations
- Reduce prompt lengths
- Add timeouts to tool calls

---

## 8. LangSmith Tracing Not Working

### Symptoms
- No traces appear in LangSmith
- Traces incomplete or missing data
- Connection errors

### Diagnosis Steps
1. Verify environment variables:
   ```python
   import os
   print("Tracing:", os.getenv("LANGCHAIN_TRACING_V2"))
   print("API key:", os.getenv("LANGSMITH_API_KEY")[:10] + "...")
   print("Project:", os.getenv("LANGSMITH_PROJECT"))
   ```

2. Test LangSmith connection:
   ```python
   from langsmith import Client
   client = Client()
   print("Connected:", client.info())
   ```

3. Check firewall/proxy settings

### Solutions
- Set `LANGCHAIN_TRACING_V2=true` in `.env`
- Verify API key is valid
- Check project exists in LangSmith dashboard
- Ensure network allows connections to api.smith.langchain.com

---

## Quick Debug Commands

```python
# View current state
snapshot = graph.get_state(config)
print("State:", snapshot.values)
print("Next:", snapshot.next)

# View checkpoint history
history = list(graph.get_state_history(config))
for i, snap in enumerate(history):
    print(f"{i}: step={snap.metadata['step']}, next={snap.next}")

# Test individual node
from graph import web_search_agent
result = web_search_agent(test_state, store=store)
print("Node output:", result)

# Stream with detailed updates
for update in graph.stream(input, config, stream_mode="debug"):
    print(update)
```

---

## When to Ask for Help

If you've tried the above and still stuck:
1. Check LangSmith trace and share the run URL
2. Share minimal reproducible code
3. Include error messages and stack traces
4. Describe expected vs actual behavior

**Support Channels**:
- Workshop Slack: #help
- Office hours: 12:00-13:00 daily
- LangChain Discord: https://discord.gg/langchain
