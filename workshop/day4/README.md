# Day 4: Memory, Multi-Agent Systems & Time Travel

**Duration**: ~6.5 hours  
**Goal**: Build multi-agent architectures with long-term memory and master time-travel debugging

## Learning Objectives

By the end of Day 4, you will be able to:
- Implement long-term memory with stores (cross-thread persistence)
- Use semantic search for memory retrieval
- Build supervisor-based multi-agent systems
- Create modular workflows with subgraphs
- Use time travel to debug and fork execution paths
- Update state at arbitrary checkpoints

## Schedule

| Time | Activity | Duration |
|------|----------|----------|
| 09:00-09:15 | Recap + objectives | 15 min |
| 09:15-10:30 | **Block 1**: Memory stores basics | 75 min |
| 10:30-10:45 | Break | 15 min |
| 10:45-12:00 | **Block 2**: Semantic memory retrieval | 75 min |
| 12:00-13:00 | Lunch | 60 min |
| 13:00-14:30 | **Block 3**: Multi-agent supervisor pattern | 90 min |
| 14:30-14:45 | Break | 15 min |
| 14:45-16:00 | **Block 4**: Time travel debugging | 75 min |
| 16:00-16:30 | Capstone integration + exit ticket | 30 min |

## Topics Covered

### 1. Short-term vs Long-term Memory (Concept)

**Mental Model**:

```
┌─────────────────────────────────────┐
│ Thread 1 (User A)                   │
│ Checkpoints: [cp1, cp2, cp3]        │  ← Short-term (within thread)
│ State: {messages: [...], count: 5}  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Store (User A)                       │
│ Namespace: ["user-123", "memories"]│   ← Long-term (across threads)
│ Entries:                             │
│   - {preference: "likes Python"}    │
│   - {fact: "works at Acme Corp"}    │
└─────────────────────────────────────┘
```

**Key Differences**:

| Aspect | Checkpointer (Short-term) | Store (Long-term) |
|--------|---------------------------|-------------------|
| Scope | Single thread | All threads |
| Lifecycle | Session/conversation | Persistent across sessions |
| Access | Via `thread_id` | Via namespace tuple |
| Use case | Conversation context | User profile, facts, preferences |

---

### 2. Memory Store Basics (Lab 1)

#### Python: InMemoryStore

```python
from langgraph.store.memory import InMemoryStore
from uuid import uuid4

# Create store
store = InMemoryStore()

# Define namespace (e.g., user-specific memories)
user_id = "user-123"
namespace = (user_id, "memories")

# Put memories
memory_id = str(uuid4())
memory = {"preference": "likes Python", "context": "mentioned in chat"}
store.put(namespace, memory_id, memory)

# Search memories
memories = list(store.search(namespace))
print(f"Found {len(memories)} memories")
print(memories[0].value)  # {'preference': 'likes Python', ...}
```

**Memory Item Fields**:
- `value`: The memory content (dict)
- `key`: Unique ID for this memory
- `namespace`: Tuple identifying the memory category
- `created_at`: Timestamp
- `updated_at`: Timestamp

#### TypeScript: InMemoryStore

```typescript
import { MemoryStore } from "@langchain/langgraph";
import { v4 as uuidv4 } from "uuid";

const store = new MemoryStore();

const userId = "user-123";
const namespace = [userId, "memories"];

const memoryId = uuidv4();
const memory = { preference: "likes Python", context: "mentioned in chat" };
await store.put(namespace, memoryId, memory);

const memories = await store.search(namespace);
console.log(`Found ${memories.length} memories`);
console.log(memories[0].value);
```

**Lab Exercise**:
1. Store 3 different memories for a user
2. Retrieve all memories
3. Update one memory
4. Delete one memory

---

### 3. Using Store in LangGraph (Lab 2)

```python
from typing import TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from langgraph.store.memory import InMemoryStore
from uuid import uuid4

class State(TypedDict):
    user_id: str
    query: str
    response: str

def recall_node(state: State, *, store) -> dict:
    """Access store via runtime parameter."""
    namespace = (state["user_id"], "memories")
    
    # Retrieve memories
    memories = list(store.search(namespace))
    context = "\n".join([m.value.get("fact", "") for m in memories])
    
    return {"response": f"Based on what I know: {context}"}

def learn_node(state: State, *, store) -> dict:
    """Store new fact."""
    namespace = (state["user_id"], "memories")
    
    # Extract and store fact from query
    fact = state["query"]
    memory_id = str(uuid4())
    store.put(namespace, memory_id, {"fact": fact})
    
    return {"response": f"I'll remember: {fact}"}

workflow = StateGraph(State)
workflow.add_node("recall", recall_node)
workflow.add_node("learn", learn_node)
workflow.add_edge(START, "recall")
workflow.add_edge("recall", END)

# Compile with BOTH checkpointer and store
checkpointer = MemorySaver()
memory_store = InMemoryStore()
graph = workflow.compile(checkpointer=checkpointer, store=memory_store)

# Use in different threads, same user
config1 = {"configurable": {"thread_id": "thread-1"}, "context": {"user_id": "user-123"}}
config2 = {"configurable": {"thread_id": "thread-2"}, "context": {"user_id": "user-123"}}

# Thread 1: Learn
graph.invoke({"user_id": "user-123", "query": "I like pizza", "response": ""}, config1)

# Thread 2: Recall (different thread, same user!)
result = graph.invoke({"user_id": "user-123", "query": "", "response": ""}, config2)
print(result["response"])  # Should mention pizza!
```

**Key Points**:
- Store is passed via `runtime` parameter: `def node(state, *, store)`
- `user_id` in context allows sharing across threads
- Store persists even when checkpointer is in-memory

---

### 4. Semantic Search (Lab 3)

**Problem**: Keyword search doesn't understand meaning.

**Solution**: Configure store with embeddings for semantic retrieval.

```python
from langgraph.store.memory import InMemoryStore
from langchain_openai import OpenAIEmbeddings

# Create store with semantic search
store = InMemoryStore(
    index={
        "embeddings": OpenAIEmbeddings(model="text-embedding-3-small"),
        "dims": 1536,
        "fields": ["fact", "$"]  # Which fields to embed
    }
)

# Store memories
namespace = ("user-123", "memories")
store.put(namespace, "1", {"fact": "User enjoys Italian cuisine"})
store.put(namespace, "2", {"fact": "User is allergic to peanuts"})
store.put(namespace, "3", {"fact": "User works as a software engineer"})

# Semantic search
results = list(store.search(
    namespace,
    query="What does the user like to eat?",  # Natural language!
    limit=2
))

for r in results:
    print(r.value["fact"])
# Output: "User enjoys Italian cuisine", "User is allergic to peanuts"
```

**Use Cases**:
- Find relevant user preferences
- Retrieve past decisions
- Contextual knowledge injection

---

### 5. Multi-Agent Supervisor Pattern (Lab 4)

**Architecture**:
```
User Query
    ↓
Supervisor (Router Agent)
    ↓
┌───┴───┬───────┬────────┐
│       │       │        │
Research Code   Math    Writer
Agent    Agent  Agent   Agent
│       │       │        │
└───┬───┴───────┴────────┘
    ↓
Supervisor (Synthesizer)
    ↓
Final Response
```

#### Implementation

```python
from typing import TypedDict, Literal
from langgraph.graph import StateGraph, START, END
from langchain_openai import ChatOpenAI

class State(TypedDict):
    task: str
    messages: list[dict]
    next_agent: str
    final_answer: str

# Define specialist agents
def research_agent(state: State) -> dict:
    """Handles research tasks."""
    model = ChatOpenAI(model="gpt-4o-mini")
    prompt = f"Research this: {state['task']}"
    response = model.invoke([{"role": "user", "content": prompt}])
    return {"messages": [{"agent": "research", "content": response.content}]}

def code_agent(state: State) -> dict:
    """Handles coding tasks."""
    model = ChatOpenAI(model="gpt-4o-mini")
    prompt = f"Write code for: {state['task']}"
    response = model.invoke([{"role": "user", "content": prompt}])
    return {"messages": [{"agent": "code", "content": response.content}]}

def math_agent(state: State) -> dict:
    """Handles math tasks."""
    model = ChatOpenAI(model="gpt-4o-mini")
    prompt = f"Solve this math: {state['task']}"
    response = model.invoke([{"role": "user", "content": prompt}])
    return {"messages": [{"agent": "math", "content": response.content}]}

# Supervisor (router)
def supervisor_route(state: State) -> Literal["research", "code", "math", "finish"]:
    """Determine which agent to call."""
    task_lower = state["task"].lower()
    
    if any(word in task_lower for word in ["search", "find", "research"]):
        return "research"
    elif any(word in task_lower for word in ["code", "program", "implement"]):
        return "code"
    elif any(word in task_lower for word in ["calculate", "math", "solve"]):
        return "math"
    else:
        return "finish"

def synthesize_node(state: State) -> dict:
    """Combine results."""
    combined = "\n\n".join([m["content"] for m in state["messages"]])
    return {"final_answer": combined}

# Build graph
workflow = StateGraph(State)
workflow.add_node("research", research_agent)
workflow.add_node("code", code_agent)
workflow.add_node("math", math_agent)
workflow.add_node("synthesize", synthesize_node)

workflow.add_edge(START, "supervisor")
workflow.add_conditional_edges(
    "supervisor",
    supervisor_route,
    {
        "research": "research",
        "code": "code",
        "math": "math",
        "finish": "synthesize"
    }
)
workflow.add_edge("research", "synthesize")
workflow.add_edge("code", "synthesize")
workflow.add_edge("math", "synthesize")
workflow.add_edge("synthesize", END)

graph = workflow.compile()
```

**Lab Exercise**:
1. Add a fourth specialist (e.g., "writer")
2. Make supervisor use LLM instead of keywords
3. Allow multiple specialists to collaborate

---

### 6. Subgraphs (Lab 5)

**Use Case**: Modularize complex workflows.

```python
from langgraph.graph import StateGraph, START, END

# Subgraph: Email validation workflow
class EmailState(TypedDict):
    email: str
    valid: bool

def validate_format(state: EmailState) -> dict:
    valid = "@" in state["email"] and "." in state["email"]
    return {"valid": valid}

email_validator = StateGraph(EmailState)
email_validator.add_node("validate", validate_format)
email_validator.add_edge(START, "validate")
email_validator.add_edge("validate", END)
email_subgraph = email_validator.compile()

# Main graph: User registration
class RegistrationState(TypedDict):
    email: str
    name: str
    status: str

def registration_node(state: RegistrationState) -> dict:
    # Call subgraph
    result = email_subgraph.invoke({"email": state["email"], "valid": False})
    
    if result["valid"]:
        return {"status": "registered"}
    else:
        return {"status": "invalid_email"}

main_workflow = StateGraph(RegistrationState)
main_workflow.add_node("register", registration_node)
main_workflow.add_edge(START, "register")
main_workflow.add_edge("register", END)

graph = main_workflow.compile()
```

**Benefits**:
- Reusable logic
- Easier testing
- Clearer separation of concerns

---

### 7. Time Travel: Debugging by Forking (Lab 6)

**Scenario**: Agent made wrong decision. Can we fix it?

```python
from langgraph.checkpoint.sqlite import SqliteSaver
import sqlite3

# Run initial execution
conn = sqlite3.connect("debug.db")
checkpointer = SqliteSaver(conn)
graph = workflow.compile(checkpointer=checkpointer)

config = {"configurable": {"thread_id": "debug-1"}}
result = graph.invoke({"task": "Research quantum computing"}, config)

# Inspect history
history = list(graph.get_state_history(config))
print(f"Total checkpoints: {len(history)}")

# Find the checkpoint where supervisor made decision
for i, snapshot in enumerate(history):
    print(f"Step {i}: next={snapshot.next}, values={snapshot.values}")

# Pick a checkpoint to fork from
fork_checkpoint = history[2]
fork_config = {
    "configurable": {
        "thread_id": "debug-1",
        "checkpoint_id": fork_checkpoint.config["configurable"]["checkpoint_id"]
    }
}

# Update state at that checkpoint
graph.update_state(
    fork_config,
    {"next_agent": "code"},  # Force different routing
    as_node="supervisor"
)

# Resume with modified state
forked_result = graph.invoke(None, fork_config)
print(f"Forked result: {forked_result}")
```

**Key Operations**:
1. `get_state_history()`: View all past checkpoints
2. Select checkpoint by `checkpoint_id`
3. `update_state()`: Modify state at that point
4. `invoke(None, fork_config)`: Resume from modified state

**Debugging Workflow**:
```
Original Execution:
A → B → C → D (wrong)
        ↑
        Fork here

Modified Execution:
A → B → X → Y (correct)
```

---

### 8. Advanced: Update State as Different Node (Lab 7)

```python
# Update state as if it came from a different node
graph.update_state(
    config,
    {"intermediate_result": "New value"},
    as_node="node_b"  # Pretend node_b wrote this
)

# This affects which node runs next!
```

**Use Cases**:
- Manually inject tool results
- Skip expensive operations in testing
- Simulate different agent responses

---

## Capstone Integration

**Objective**: Transform Research Assistant into multi-agent system with memory.

### Requirements
1. Add long-term memory for user preferences
2. Split into 3 specialists:
   - Web search agent
   - Data analysis agent
   - Report writer agent
3. Supervisor routes to appropriate specialist
4. Use time travel to debug routing decisions

### Checkpoint
```
User (Thread 1): "I prefer academic sources"
[Store this preference]

User (Thread 2): "Research machine learning"
[Retrieve preference, use academic-focused search]
```

---

## Common Gotchas

1. **Forgetting `context` for user_id**: Store needs it for cross-thread access
2. **Not using semantic search when needed**: Keyword search misses intent
3. **Supervisor bottlenecks**: Make routing fast (use cached models)
4. **Time travel confusion**: Remember replayed nodes don't re-execute
5. **Store vs checkpointer**: Use right tool for the job

---

## Exit Ticket

1. When would you use a store vs checkpointer?
2. How does time travel help in debugging?
3. Design a 3-agent system for your domain.

## Homework (Optional)

- Read: [Memory Guide](https://docs.langchain.com/oss/python/langgraph/add-memory)
- Read: [Time Travel Guide](https://docs.langchain.com/oss/python/langgraph/use-time-travel)
- Experiment: Build a 5-agent system with hierarchical routing
- Challenge: Implement memory pruning (delete old/irrelevant memories)

---

**Next**: [Day 5 - Production Hardening (Optional)](../day5_optional/README.md) →
