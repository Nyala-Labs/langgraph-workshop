# Day 1: Foundations — Graphs, State, and Execution

**Duration**: 1 hour  
**Goal**: Understand LangGraph's graph model, state management, and build your first workflow

## Learning Objectives

By the end of Day 1, you will be able to:
- Explain why graphs are useful for agent workflows
- Build a `StateGraph` with typed state schemas
- Use reducers to control state merge behavior
- Add nodes and edges to create workflow logic
- Stream intermediate results from graph execution
- Start your capstone project scaffold

## Schedule

Activity | Duration |
----------|----------|
Welcome + Setup verification | 5 min |
**Lab 1**: Why graphs? + First workflow | 10 min |
**Lab 2**: State schemas + reducers | 10 min |
**Lab 3**: Conditional edges | 10 min |
**Lab 4**: Streaming | 10 min |
**Lab 5**: Capstone | 10 min |

## Topics Covered

### 1. Why Graphs for Agents? (Concept)

**Key Ideas**:
- Traditional chains are linear; agents need branching logic
- Graphs model: decision points, loops, parallel execution
- Nodes = computation units; Edges = flow control
- Super-steps: graph executes until all nodes are done, then saves state

**Mental Model**:
```
Linear Chain:        Agent Graph:
Input → A → B → C    Input → Router
                             ↓
                       ┌─────┴─────┐
                       A           B
                       └─────┬─────┘
                           Loop?
                             ↓
                           Output
```

**Key Vocabulary**:
- **Node**: A function that processes state and returns updates
- **Edge**: Connection between nodes (unconditional or conditional)
- **State**: Dictionary-like object passed through the graph
- **Super-step**: One complete pass where scheduled nodes execute

---

### 2. Building Your First Graph (Lab 1)

**Objective**: Create a simple 3-node graph that processes a message.

#### Python Track

**File**: `workshop/day1/labs/lab1_first_graph.py`

```python
from typing import TypedDict
from langgraph.graph import StateGraph, START, END

# 1. Define state schema
class State(TypedDict):
    message: str
    count: int

# 2. Define nodes
def node_a(state: State) -> dict:
    print(f"Node A received: {state['message']}")
    return {"message": state["message"] + " -> A", "count": state["count"] + 1}

def node_b(state: State) -> dict:
    print(f"Node B received: {state['message']}")
    return {"message": state["message"] + " -> B", "count": state["count"] + 1}

def node_c(state: State) -> dict:
    print(f"Node C received: {state['message']}")
    return {"message": state["message"] + " -> C", "count": state["count"] + 1}

# 3. Build graph
workflow = StateGraph(State)
workflow.add_node("node_a", node_a)
workflow.add_node("node_b", node_b)
workflow.add_node("node_c", node_c)

# 4. Add edges
workflow.add_edge(START, "node_a")
workflow.add_edge("node_a", "node_b")
workflow.add_edge("node_b", "node_c")
workflow.add_edge("node_c", END)

# 5. Compile and run
graph = workflow.compile()
result = graph.invoke({"message": "Hello", "count": 0})
print(f"\nFinal: {result}")
```

**Expected Output**:
```
Node A received: Hello
Node B received: Hello -> A
Node C received: Hello -> A -> B
Final: {'message': 'Hello -> A -> B -> C', 'count': 3}
```

#### TypeScript Track

**File**: `workshop/day1/labs/lab1_first_graph.ts`

```typescript
import { StateGraph, START, END, Annotation } from "@langchain/langgraph";

// 1. Define state schema
const State = Annotation.Root({
  message: Annotation<string>(),
  count: Annotation<number>(),
});

// 2. Define nodes
function nodeA(state: typeof State.State): Partial<typeof State.State> {
  console.log(`Node A received: ${state.message}`);
  return { message: `${state.message} -> A`, count: state.count + 1 };
}

function nodeB(state: typeof State.State): Partial<typeof State.State> {
  console.log(`Node B received: ${state.message}`);
  return { message: `${state.message} -> B`, count: state.count + 1 };
}

function nodeC(state: typeof State.State): Partial<typeof State.State> {
  console.log(`Node C received: ${state.message}`);
  return { message: `${state.message} -> C`, count: state.count + 1 };
}

// 3. Build graph
const workflow = new StateGraph(State)
  .addNode("nodeA", nodeA)
  .addNode("nodeB", nodeB)
  .addNode("nodeC", nodeC)
  .addEdge(START, "nodeA")
  .addEdge("nodeA", "nodeB")
  .addEdge("nodeB", "nodeC")
  .addEdge("nodeC", END);

// 4. Compile and run
const graph = workflow.compile();
(async () => {
  const result = await graph.invoke({ message: "Hello", count: 0 });
  console.log(`\nFinal:`, result);
})();
```

**Formative Check**: Before running, predict:
- What will `result['message']` be?
- What will `result['count']` be?
- In what order will nodes print?

---

### 3. State Schemas and Reducers (Lab 2)

**Key Concept**: By default, state updates *overwrite* previous values. Reducers let you *merge* updates (e.g., append to a list).

#### Python: Using Annotated Reducers

```python
from typing import TypedDict, Annotated
from operator import add
from langgraph.graph import StateGraph, START, END

class State(TypedDict):
    messages: Annotated[list[str], add]  # Reducer: concatenate lists
    counter: int                          # No reducer: overwrites

def node_1(state: State) -> dict:
    return {"messages": ["msg1"], "counter": 1}

def node_2(state: State) -> dict:
    return {"messages": ["msg2"], "counter": 2}

workflow = StateGraph(State)
workflow.add_node("node_1", node_1)
workflow.add_node("node_2", node_2)
workflow.add_edge(START, "node_1")
workflow.add_edge("node_1", "node_2")
workflow.add_edge("node_2", END)

graph = workflow.compile()
result = graph.invoke({"messages": [], "counter": 0})

print(result["messages"])  # ['msg1', 'msg2'] — appended!
print(result["counter"])   # 2 — overwritten!
```

#### TypeScript: Using ReducedValue

```typescript
import { StateGraph, START, END, Annotation } from "@langchain/langgraph";

const State = Annotation.Root({
  messages: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  counter: Annotation<number>(),
});

function node1(state: typeof State.State) {
  return { messages: ["msg1"], counter: 1 };
}

function node2(state: typeof State.State) {
  return { messages: ["msg2"], counter: 2 };
}

const graph = new StateGraph(State)
  .addNode("node1", node1)
  .addNode("node2", node2)
  .addEdge(START, "node1")
  .addEdge("node1", "node2")
  .addEdge("node2", END)
  .compile();

(async () => {
  const result = await graph.invoke({ messages: [], counter: 0 });
  console.log(result.messages); // ['msg1', 'msg2']
  console.log(result.counter);  // 2
})();
```

**Lab Exercise**: Add a third node that appends "msg3". Predict the final `messages` list.

---

### 4. Conditional Edges (Lab 3)

**Objective**: Route dynamically based on state.

#### Python

```python
from langgraph.graph import StateGraph, START, END

class State(TypedDict):
    number: int
    path: str

def start_node(state: State) -> dict:
    return {"number": state["number"], "path": "start"}

def even_node(state: State) -> dict:
    return {"path": "even"}

def odd_node(state: State) -> dict:
    return {"path": "odd"}

def router(state: State) -> str:
    """Conditional routing function"""
    if state["number"] % 2 == 0:
        return "even"
    else:
        return "odd"

workflow = StateGraph(State)
workflow.add_node("start", start_node)
workflow.add_node("even", even_node)
workflow.add_node("odd", odd_node)

workflow.add_edge(START, "start")
workflow.add_conditional_edges(
    "start",
    router,  # Function that returns next node name
    {"even": "even", "odd": "odd"}  # Mapping
)
workflow.add_edge("even", END)
workflow.add_edge("odd", END)

graph = workflow.compile()
print(graph.invoke({"number": 4, "path": ""}))  # Goes to even
print(graph.invoke({"number": 7, "path": ""}))  # Goes to odd
```

#### TypeScript

**File**: `workshop/day1/labs/lab3_conditional_edges.ts`

```typescript
import { StateGraph, START, END, Annotation } from "@langchain/langgraph";

const State = Annotation.Root({
  number: Annotation<number>(),
  path: Annotation<string>(),
});

function startNode(state: typeof State.State) {
  return { number: state.number, path: "start" };
}

function evenNode(_state: typeof State.State) {
  return { path: "even" };
}

function oddNode(_state: typeof State.State) {
  return { path: "odd" };
}

// Conditional routing function — returns the name of the next node
function router(state: typeof State.State): string {
  return state.number % 2 === 0 ? "even" : "odd";
}

const graph = new StateGraph(State)
  .addNode("start", startNode)
  .addNode("even", evenNode)
  .addNode("odd", oddNode)
  .addEdge(START, "start")
  .addConditionalEdges("start", router, { even: "even", odd: "odd" })
  .addEdge("even", END)
  .addEdge("odd", END)
  .compile();

(async () => {
  console.log(await graph.invoke({ number: 4, path: "" })); // Goes to even
  console.log(await graph.invoke({ number: 7, path: "" })); // Goes to odd
})();
```

**Formative Check**:
1. What happens if `router` returns `"unknown"`?
2. How would you add a third path for numbers divisible by 3?

---

### 5. Streaming (Demo + Lab 4)

**Key Idea**: Stream intermediate results as the graph executes.

#### Python

```python
# Stream mode: "values" returns state after each node
for chunk in graph.stream({"number": 5, "path": ""}, stream_mode="values"):
    print(chunk)

# Stream mode: "updates" returns only the node's output
for chunk in graph.stream({"number": 5, "path": ""}, stream_mode="updates"):
    print(chunk)
```

#### TypeScript

```typescript
import { StateGraph, START, END, Annotation } from "@langchain/langgraph";

const State = Annotation.Root({
  number: Annotation<number>(),
  path: Annotation<string>(),
});

function startNode(state: typeof State.State) {
  return { number: state.number, path: "start" };
}

function evenNode(_state: typeof State.State) {
  return { path: "even" };
}

function oddNode(_state: typeof State.State) {
  return { path: "odd" };
}

function router(state: typeof State.State): string {
  return state.number % 2 === 0 ? "even" : "odd";
}

const graph = new StateGraph(State)
  .addNode("start", startNode)
  .addNode("even", evenNode)
  .addNode("odd", oddNode)
  .addEdge(START, "start")
  .addConditionalEdges("start", router, { even: "even", odd: "odd" })
  .addEdge("even", END)
  .addEdge("odd", END)
  .compile();

(async () => {
  // Stream mode: "values" returns full state after each node
  console.log("--- streamMode: values ---");
  for await (const chunk of await graph.stream(
    { number: 5, path: "" },
    { streamMode: "values" }
  )) {
    console.log(chunk);
  }

  // Stream mode: "updates" returns only the node's output delta
  console.log("--- streamMode: updates ---");
  for await (const chunk of await graph.stream(
    { number: 5, path: "" },
    { streamMode: "updates" }
  )) {
    console.log(chunk);
  }
})();

```

**Lab**: Modify your graph to print streaming updates in real-time.

---

## Capstone Integration (Lab 5)

**Objective**: Start your week-long capstone project.

### Scenario
Build a "Research Assistant Agent" that:
- Takes a user query
- Routes to appropriate tools (search, calculator, file lookup)
- Returns a synthesized answer

### Day 1 Scaffold

#### Python

Create:
- State schema with `messages` (list) and `current_tool` (str)
- Three nodes: `router`, `search_tool`, `synthesize`
- Conditional edge from `router` based on query type

#### TypeScript

**File**: `workshop/day1/labs/lab5_capstone.ts`

```typescript
import { StateGraph, START, END, Annotation } from "@langchain/langgraph";

const State = Annotation.Root({
  messages: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  current_tool: Annotation<string>(),
});

// Stub nodes — replace with real implementations later
function routerNode(state: typeof State.State) {
  const query = state.messages.at(-1) ?? "";
  if (query.includes("calculate")) return { current_tool: "calculator" };
  if (query.includes("file")) return { current_tool: "file_lookup" };
  return { current_tool: "search" };
}

function searchTool(state: typeof State.State) {
  return { messages: [`[search result for: ${state.messages.at(-1)}]`] }; // reducer concats this array of 1 element to existing array for messages
}

function synthesize(state: typeof State.State) {
  return { messages: [`Synthesized: ${state.messages.join(" | ")}`] };
}

function routerEdge(state: typeof State.State): string {
  return state.current_tool; // "search" | "calculator" | "file_lookup"
}

const graph = new StateGraph(State)
  .addNode("router", routerNode)
  .addNode("search", searchTool)
  .addNode("calculator", searchTool)   // stub — replace with real calculator
  .addNode("file_lookup", searchTool)  // stub — replace with real file lookup
  .addNode("synthesize", synthesize)
  .addEdge(START, "router")
  .addConditionalEdges("router", routerEdge, {
    search: "search",
    calculator: "calculator",
    file_lookup: "file_lookup",
  })
  .addEdge("search", "synthesize")
  .addEdge("calculator", "synthesize")
  .addEdge("file_lookup", "synthesize")
  .addEdge("synthesize", END)
  .compile();

(async () => {
  const result = await graph.invoke({ messages: ["calculate 2 + 2"], current_tool: "" });
  console.log(result.messages);
})();
```

**Checkpoint**: By end of Day 1, your graph should route correctly but tools can be stubs.

---

## Exit Ticket (5 minutes)

Answer in the shared document:
1. What's the difference between a node and an edge?
2. When would you use a reducer vs default state merge?
3. One thing you're still confused about?

## Homework (Optional)

- Read: [LangGraph Concepts](https://langchain-ai.github.io/langgraph/concepts/)
- Try: Add a fourth node to your first graph
- Explore: What other reducer functions could be useful? (hint: `operator` module)

---

**Next**: [Day 2 - Persistence & Durability](../day2/README.md) →
