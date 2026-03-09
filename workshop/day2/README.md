# Day 2: Persistence & Durable Execution

**Duration**: 1 hour
**Goal**: Add persistence, understand checkpoints, and build fault-tolerant agents

## Learning Objectives

By the end of Day 2, you will be able to:
- Add a checkpointer to enable state persistence
- Use `thread_id` to maintain conversation history
- Inspect state snapshots and checkpoint history
- Recover from node failures using checkpoints
- Understand replay vs re-execution
- Build multi-turn conversations in your capstone

## Schedule

Activity | Duration |
----------|----------|
Recap Day 1 + Day 2 objectives | 5 min |
**Lab 1**: Adding a checkpointer | 10 min |
**Lab 2**: Inspecting state snapshots | 10 min |
**Lab 3**: State history | 10 min |
**Lab 4**: Failure recovery | 10 min |
**Lab 5**: Multi-turn conversations | 10 min |

## Topics Covered

### 1. What is Persistence? (Concept)

**Key Idea**: Without persistence, each graph invocation starts fresh. Persistence allows:
- **Memory across turns**: Continue conversations
- **Fault tolerance**: Resume after crashes
- **Debugging**: Inspect past execution states
- **Time travel**: Fork and explore alternatives

**Architecture**:
```
Graph Execution → Checkpoint → Storage (DB/File)
                      ↓
                  thread_id
                      ↓
              State Snapshot
```

**Vocabulary**:
- **Checkpoint**: Saved state snapshot after each super-step
- **Thread**: Sequence of checkpoints identified by `thread_id`
- **Checkpointer**: Object that handles reading/writing checkpoints
- **State Snapshot**: Contains `values`, `next`, `metadata`, `config`

---

### 2. Adding a Checkpointer (Lab 1)

#### Python: MemorySaver for Development

```python
from typing import TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver

class State(TypedDict):
    messages: list[str]
    count: int

def chat_node(state: State) -> dict:
    user_msg = state["messages"][-1] if state["messages"] else "Hello"
    response = f"Echo: {user_msg}"
    return {"messages": [response], "count": state["count"] + 1}

workflow = StateGraph(State)
workflow.add_node("chat", chat_node)
workflow.add_edge(START, "chat")
workflow.add_edge("chat", END)

# ADD CHECKPOINTER HERE
checkpointer = MemorySaver()
graph = workflow.compile(checkpointer=checkpointer)

# First conversation
config = {"configurable": {"thread_id": "conversation-1"}}
result1 = graph.invoke({"messages": ["Hi"], "count": 0}, config)
print(f"Turn 1: {result1}")

# Continue same conversation
result2 = graph.invoke({"messages": ["How are you?"], "count": 0}, config)
print(f"Turn 2: {result2}")
print(f"Total count: {result2['count']}")  # Persisted!
```

**Key Points**:
- `MemorySaver()` stores checkpoints in memory (lost on restart)
- `thread_id` must be provided in config for every invoke
- State accumulates across calls with the same `thread_id`

#### TypeScript: MemorySaver

**File**: `workshop/day2/lab1.ts`

```typescript
import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { MemorySaver } from "@langchain/langgraph-checkpoint";

const State = Annotation.Root({
  messages: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  count: Annotation<number>(),
});

function chatNode(state: typeof State.State) {
  const userMsg = state.messages[state.messages.length - 1] || "Hello";
  const response = `Echo: ${userMsg}`;
  return { messages: [response], count: state.count + 1 };
}

const checkpointer = new MemorySaver();
const graph = new StateGraph(State)
  .addNode("chat", chatNode)
  .addEdge(START, "chat")
  .addEdge("chat", END)
  .compile({ checkpointer });

const config = { configurable: { thread_id: "conversation-1" } };
const result1 = await graph.invoke({ messages: ["Hi"], count: 0 }, config);
console.log("Turn 1:", result1);

const result2 = await graph.invoke({ messages: ["How are you?"], count: 0 }, config);
console.log("Turn 2:", result2);
```

**Lab Exercise**: 
1. Run the code with the same `thread_id` multiple times
2. Change `thread_id` and observe fresh state
3. Try using `SqliteSaver` instead of `MemorySaver`

---

### 3. Production Checkpointers (Concept + Demo)

**MemorySaver**: In-memory, lost on restart (dev/testing only)

**SqliteSaver**: Persists to SQLite file (good for local/single-instance)

```python
from langgraph.checkpoint.sqlite import SqliteSaver
import sqlite3

conn = sqlite3.connect("checkpoints.db")
checkpointer = SqliteSaver(conn)
graph = workflow.compile(checkpointer=checkpointer)
```

**PostgresSaver**: Production-grade, supports multiple instances

```python
from langgraph.checkpoint.postgres import PostgresSaver
import psycopg

conn = psycopg.connect("postgresql://user:pass@host/db")
checkpointer = PostgresSaver(conn)
graph = workflow.compile(checkpointer=checkpointer)
```

**Best Practice**:
- Dev: `MemorySaver`
- Local testing: `SqliteSaver`
- Production: `PostgresSaver` or cloud-native (RDS, etc.)

---

### 4. Inspecting State Snapshots (Lab 2)

#### Python

```python
# Get current state
config = {"configurable": {"thread_id": "conversation-1"}}
snapshot = graph.get_state(config)

print(f"State values: {snapshot.values}")
print(f"Next nodes: {snapshot.next}")
print(f"Metadata: {snapshot.metadata}")
print(f"Config: {snapshot.config}")
```

#### TypeScript

**File**: `workshop/day2/lab2.ts`

```typescript
const snapshot = await graph.getState(config);
console.log("State values:", snapshot.values);
console.log("Next nodes:", snapshot.next);
console.log("Metadata:", snapshot.metadata);
console.log("Config:", snapshot.config);
```

**State Snapshot Fields**:
- `values`: Current state dictionary
- `next`: Tuple of next node names to execute (empty if done)
- `metadata`: Step number, writes made, source
- `config`: Includes `thread_id` and `checkpoint_id`
- `tasks`: PregelTask objects for next steps

**Formative Check**: What does `next` tell you about graph execution?

---

### 5. State History (Lab 3)

#### Python

```python
# Get full history for a thread
config = {"configurable": {"thread_id": "conversation-1"}}
history = list(graph.get_state_history(config))

print(f"Total checkpoints: {len(history)}")
for i, snapshot in enumerate(history):
    print(f"Checkpoint {i}: step={snapshot.metadata['step']}, next={snapshot.next}")
```

#### TypeScript

**File**: `workshop/day2/lab3.ts`

```typescript
const history: any[] = [];
for await (const snapshot of graph.getStateHistory(config)) {
  history.push(snapshot);
}
console.log(`Total checkpoints: ${history.length}`);
```

**Key Points**:
- History is in **reverse chronological order** (newest first)
- Each checkpoint has a unique `checkpoint_id`
- You can resume from any checkpoint (time travel!)

**Lab Exercise**: 
1. Run a 5-turn conversation
2. Print all checkpoint IDs
3. Get state at checkpoint 3

---

### 6. Replay vs Re-execute (Concept)

**Critical Mental Model**:

When you invoke with a specific `checkpoint_id`:
1. **Before the checkpoint**: Nodes are *replayed* (not re-executed)
2. **After the checkpoint**: Nodes are *re-executed* (new fork)

```python
# Get a past checkpoint
history = list(graph.get_state_history(config))
old_checkpoint = history[2]  # Third most recent

# Resume from there (creates a fork)
fork_config = {
    "configurable": {
        "thread_id": "conversation-1",
        "checkpoint_id": old_checkpoint.config["configurable"]["checkpoint_id"]
    }
}
result = graph.invoke(None, fork_config)
```

**Why This Matters**:
- Efficient: Don't re-run expensive operations
- Deterministic: Past behavior is preserved
- Debugging: Can explore "what if" scenarios

---

### 7. Failure Recovery (Lab 4)

**Scenario**: A node fails mid-execution. Can we recover?

#### Python

```python
from typing import TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.sqlite import SqliteSaver
import sqlite3

class State(TypedDict):
    steps: list[str]
    counter: int

def node_a(state: State) -> dict:
    print("Node A executing")
    return {"steps": ["A"], "counter": state["counter"] + 1}

def node_b(state: State) -> dict:
    print("Node B executing")
    if state["counter"] == 1:
        raise Exception("Node B failed!")
    return {"steps": ["B"], "counter": state["counter"] + 1}

def node_c(state: State) -> dict:
    print("Node C executing")
    return {"steps": ["C"], "counter": state["counter"] + 1}

workflow = StateGraph(State)
workflow.add_node("a", node_a)
workflow.add_node("b", node_b)
workflow.add_node("c", node_c)
workflow.add_edge(START, "a")
workflow.add_edge("a", "b")
workflow.add_edge("b", "c")
workflow.add_edge("c", END)

conn = sqlite3.connect("recovery.db")
checkpointer = SqliteSaver(conn)
graph = workflow.compile(checkpointer=checkpointer)

config = {"configurable": {"thread_id": "recovery-test"}}

# First attempt - will fail at node B
try:
    result = graph.invoke({"steps": [], "counter": 0}, config)
except Exception as e:
    print(f"Failed: {e}")

# Check state - should have checkpoint AFTER node A
snapshot = graph.get_state(config)
print(f"State after failure: {snapshot.values}")
print(f"Next nodes: {snapshot.next}")  # Should show 'b' ready to retry

# Fix the issue (in real world: deploy fixed code)
# For demo: update state to skip the failure condition
graph.update_state(config, {"counter": 2})

# Resume - will continue from node B
result = graph.invoke(None, config)
print(f"Recovered result: {result}")
```

**Key Patterns**:
1. **Automatic checkpointing** saves state after each successful node
2. **Failed nodes** don't create checkpoints
3. **Resume** by invoking with same `thread_id` (pass `None` as input)
4. **Fix and retry** using `update_state` or deploying fixed code

#### TypeScript

**File**: `workshop/day2/lab4.ts`

Uses `Annotation` for state, `SqliteSaver` for persistence, and `graph.updateState()` to fix state before resuming.

**Lab Exercise**: 
1. Make node C fail on first run
2. Recover by updating state
3. Verify final result includes all steps

---

### 8. Multi-Turn Conversations (Lab 5)

**Build a simple chatbot with memory**:

#### Python

```python
from typing import TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from langchain_openai import ChatOpenAI

class State(TypedDict):
    messages: list[dict]

def call_model(state: State) -> dict:
    model = ChatOpenAI(model="gpt-4o-mini")
    response = model.invoke(state["messages"])
    return {"messages": [{"role": "assistant", "content": response.content}]}

workflow = StateGraph(State)
workflow.add_node("model", call_model)
workflow.add_edge(START, "model")
workflow.add_edge("model", END)

checkpointer = MemorySaver()
graph = workflow.compile(checkpointer=checkpointer)

# Conversation loop
config = {"configurable": {"thread_id": "user-123"}}

while True:
    user_input = input("You: ")
    if user_input.lower() in ["quit", "exit"]:
        break
    
    state = {"messages": [{"role": "user", "content": user_input}]}
    result = graph.invoke(state, config)
    
    assistant_msg = result["messages"][-1]["content"]
    print(f"Assistant: {assistant_msg}")
```

#### TypeScript

**File**: `workshop/day2/lab5.ts`

Uses `Annotation.Root` with a `messages` reducer, `MemorySaver`, and `ChatOpenAI` for a multi-turn chatbot. Run with `npx ts-node workshop/day2/lab5.ts`.

**Key Feature**: Each turn adds to the thread's checkpoint history!

---

## Capstone Integration

**Objective**: Add persistence to your Research Assistant.

### Requirements
1. Use `SqliteSaver` to persist threads
2. Support multi-turn conversations
3. Maintain context across queries
4. Handle tool failures gracefully

### Checkpoint
Run this scenario:
```
User: "Search for Python best practices"
[Agent searches and responds]
User: "Summarize the results"
[Agent uses previous search results - must be in state!]
```

**Validation**: State should accumulate search results across turns.

---

## Common Gotchas

1. **Forgetting `thread_id`**: Without it, no persistence happens
2. **Wrong checkpointer for environment**: Don't use `MemorySaver` in production
3. **Assuming fresh state**: Each turn builds on previous state (use reducers!)
4. **Not handling failures**: Always plan for node failures
5. **Checkpoint ID confusion**: `checkpoint_id` identifies a specific snapshot, not a thread

---

## Exit Ticket

1. What's the difference between `thread_id` and `checkpoint_id`?
2. When does a checkpoint get created?
3. How would you debug a failing multi-turn conversation?

## Homework (Optional)

- Read: [Persistence Guide](https://docs.langchain.com/oss/python/langgraph/persistence)
- Experiment: Try PostgresSaver with a real database
- Challenge: Implement checkpoint pruning (delete old checkpoints)

---

**Next**: [Day 3 - Human-in-the-Loop](../day3/README.md) →
