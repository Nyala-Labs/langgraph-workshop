# Day 3: Human-in-the-Loop with Interrupts

**Duration**: 1 hour  
**Goal**: Master interrupts for approval flows, state editing, and safe agent operations

## Learning Objectives

By the end of Day 3, you will be able to:
- Use `interrupt()` to pause graph execution
- Resume execution with `Command(resume=...)`
- Implement approval/rejection workflows
- Allow humans to review and edit state
- Handle interrupts inside tools
- Build streaming HITL interfaces
- Understand interrupt idempotency rules

## Schedule

Activity | Duration |
----------|----------|
Recap Day 2 + objectives | 5 min |
**Lab 1**: Basic interrupt pattern | 10 min |
**Lab 2**: Approval with routing | 10 min |
**Lab 3**: Review and edit state | 10 min |
**Lab 4**: Interrupts in tools | 10 min |
**Lab 5**: Streaming with interrupts | 10 min |
**Lab 6**: Validation loop | 10 min |

## Topics Covered

### 1. What are Interrupts? (Concept)

**Key Idea**: `interrupt()` pauses graph execution and waits for external input.

**Why This Matters**:
- **Safety**: Get approval before risky operations (delete file, charge card, send email)
- **Quality**: Let humans review/edit LLM outputs before proceeding
- **Flexibility**: Support dynamic workflows that adapt to user input

**Mental Model**:
```
Graph Running → interrupt() → Checkpoint Saved → Wait for Resume
                                ↓
                          return value in __interrupt__
                                ↓
                      Human reviews and responds
                                ↓
                   Command(resume=response) → Continue Execution
```

**Critical Rule**: When resumed, the node **restarts from the beginning**, not from the interrupt line!

---

### 2. Basic Interrupt Pattern (Lab 1)

#### Python: Simple Approval

```python
from typing import TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import interrupt, Command

class State(TypedDict):
    action: str
    approved: bool

def approval_node(state: State) -> dict:
    # Pause and ask for approval
    is_approved = interrupt({
        "question": "Approve this action?",
        "action": state["action"]
    })
    
    return {"approved": is_approved}

workflow = StateGraph(State)
workflow.add_node("approval", approval_node)
workflow.add_edge(START, "approval")
workflow.add_edge("approval", END)

checkpointer = MemorySaver()
graph = workflow.compile(checkpointer=checkpointer)

# Step 1: Initial invocation (will interrupt)
config = {"configurable": {"thread_id": "approval-1"}}
result = graph.invoke({"action": "Delete database", "approved": False}, config)

print(result["__interrupt__"])
# Output: [Interrupt(value={'question': '...', 'action': '...'})]

# Step 2: Resume with decision
final = graph.invoke(Command(resume=True), config)  # Approve
print(final["approved"])  # True
```

**Key Points**:
- `interrupt()` returns the payload in `__interrupt__` field
- Resume with `Command(resume=value)` where `value` becomes the return of `interrupt()`
- Must use same `thread_id` to resume

#### TypeScript: Simple Approval

```typescript
import { StateGraph, START, END, interrupt, Command } from "@langchain/langgraph";
import { MemorySaver } from "@langchain/langgraph-checkpoint";

interface State {
  action: string;
  approved: boolean;
}

async function approvalNode(state: State) {
  const isApproved = await interrupt({
    question: "Approve this action?",
    action: state.action,
  });
  
  return { approved: isApproved };
}

const checkpointer = new MemorySaver();
const graph = new StateGraph<State>({ channels: { action: null, approved: null } })
  .addNode("approval", approvalNode)
  .addEdge(START, "approval")
  .addEdge("approval", END)
  .compile({ checkpointer });

const config = { configurable: { thread_id: "approval-1" } };
const result = await graph.invoke({ action: "Delete database", approved: false }, config);

console.log(result.__interrupt__);

// Resume
const final = await graph.invoke(new Command({ resume: true }), config);
console.log(final.approved); // true
```

**Formative Check**: What happens if you invoke without `Command(resume=...)` after an interrupt?

---

### 3. Approval with Routing (Lab 2)

**Pattern**: Route to different nodes based on approval.

```python
from typing import Literal
from langgraph.types import Command

def approval_node(state: State) -> Command[Literal["proceed", "cancel"]]:
    approved = interrupt(f"Approve: {state['action']}?")
    
    if approved:
        return Command(goto="proceed")
    else:
        return Command(goto="cancel")

def proceed_node(state: State) -> dict:
    print(f"Executing: {state['action']}")
    return {"status": "completed"}

def cancel_node(state: State) -> dict:
    print(f"Cancelled: {state['action']}")
    return {"status": "cancelled"}

workflow = StateGraph(State)
workflow.add_node("approval", approval_node)
workflow.add_node("proceed", proceed_node)
workflow.add_node("cancel", cancel_node)
workflow.add_edge(START, "approval")
# No explicit edges - routing via Command(goto=...)
workflow.add_edge("proceed", END)
workflow.add_edge("cancel", END)

graph = workflow.compile(checkpointer=MemorySaver())
```

**Lab Exercise**: 
1. Run with approval (resume=True)
2. Run with rejection (resume=False)
3. Verify correct node is executed

---

### 4. Review and Edit State (Lab 3)

**Pattern**: Let humans edit LLM outputs before continuing.

```python
from typing import TypedDict
from langgraph.types import interrupt

class State(TypedDict):
    original_text: str
    edited_text: str

def generate_node(state: State) -> dict:
    # Simulate LLM generation
    generated = f"Generated content based on: {state['original_text']}"
    return {"edited_text": generated}

def review_node(state: State) -> dict:
    # Pause for human review
    edited = interrupt({
        "instruction": "Review and edit this content",
        "content": state["edited_text"]
    })
    
    # The human's edits become the new value
    return {"edited_text": edited}

workflow = StateGraph(State)
workflow.add_node("generate", generate_node)
workflow.add_node("review", review_node)
workflow.add_edge(START, "generate")
workflow.add_edge("generate", "review")
workflow.add_edge("review", END)

graph = workflow.compile(checkpointer=MemorySaver())

# First: generate
config = {"configurable": {"thread_id": "edit-1"}}
result = graph.invoke({"original_text": "Write about AI", "edited_text": ""}, config)
print(result["__interrupt__"])

# Resume with edited content
final = graph.invoke(
    Command(resume="Edited: AI is transforming software development..."),
    config
)
print(final["edited_text"])
```

**Real-World Use Cases**:
- Edit email drafts before sending
- Correct tool call arguments
- Modify search queries
- Adjust generated code

---

### 5. Interrupts in Tools (Lab 4)

**Pattern**: Put `interrupt()` inside tool definitions for per-tool approval.

```python
from langchain.tools import tool
from langgraph.types import interrupt

@tool
def send_email(to: str, subject: str, body: str) -> str:
    """Send an email to a recipient."""
    
    # Pause before sending
    response = interrupt({
        "action": "send_email",
        "to": to,
        "subject": subject,
        "body": body,
        "message": "Approve sending this email?"
    })
    
    if response.get("action") == "approve":
        # Could override arguments here
        final_to = response.get("to", to)
        final_subject = response.get("subject", subject)
        final_body = response.get("body", body)
        
        # Actually send (simulated)
        return f"Email sent to {final_to}"
    else:
        return "Email cancelled by user"

# Use in a ReAct agent
from langgraph.prebuilt import create_react_agent
from langchain_openai import ChatOpenAI

model = ChatOpenAI(model="gpt-4o-mini")
agent = create_react_agent(
    model,
    tools=[send_email],
    checkpointer=MemorySaver()
)

config = {"configurable": {"thread_id": "email-agent"}}
result = agent.invoke(
    {"messages": [{"role": "user", "content": "Send an email to bob@example.com about the meeting"}]},
    config
)

# Check for interrupt
if "__interrupt__" in result:
    print("Waiting for approval:", result["__interrupt__"])
    
    # Resume with approval
    final = agent.invoke(
        Command(resume={"action": "approve"}),
        config
    )
```

**Benefit**: The approval logic lives with the tool, making it reusable!

---

### 6. Streaming with Interrupts (Lab 5)

**Challenge**: How to detect interrupts while streaming?

```python
async def run_with_streaming_hitl(graph, initial_input, config):
    """Stream updates and handle interrupts dynamically."""
    
    current_input = initial_input
    
    while True:
        interrupted = False
        
        async for metadata, mode, chunk in graph.astream(
            current_input,
            stream_mode=["messages", "updates"],
            config=config
        ):
            if mode == "messages":
                # Stream message content
                msg, _ = chunk
                if hasattr(msg, 'content') and msg.content:
                    print(msg.content, end="", flush=True)
            
            elif mode == "updates":
                # Check for interrupts
                if "__interrupt__" in chunk:
                    interrupted = True
                    interrupt_info = chunk["__interrupt__"][0].value
                    print(f"\n\n🛑 Interrupt: {interrupt_info}")
                    
                    # Get user input
                    user_response = input("Your response: ")
                    current_input = Command(resume=user_response)
                    break
        
        if not interrupted:
            break
    
    print("\n✅ Complete!")

# Usage
import asyncio
asyncio.run(run_with_streaming_hitl(
    agent,
    {"messages": [{"role": "user", "content": "Draft an email"}]},
    {"configurable": {"thread_id": "stream-1"}}
))
```

**Key Points**:
- Use `stream_mode=["messages", "updates"]` to get both
- Check for `"__interrupt__"` in updates
- Resume with `Command(resume=...)` as the next input

---

### 7. Validation Loop (Lab 6)

**Pattern**: Keep asking until valid input received.

```python
def get_age_node(state: State) -> dict:
    prompt = "What is your age?"
    
    while True:
        answer = interrupt(prompt)
        
        # Validate
        if isinstance(answer, int) and answer > 0:
            return {"age": answer}
        else:
            prompt = f"'{answer}' is not valid. Enter a positive number."

# Usage
graph = workflow.compile(checkpointer=MemorySaver())
config = {"configurable": {"thread_id": "validation-1"}}

# First try: invalid
result = graph.invoke({"age": None}, config)
graph.invoke(Command(resume="twenty"), config)  # Still interrupted!

# Second try: valid
final = graph.invoke(Command(resume=25), config)
print(final["age"])  # 25
```

---

### 8. Interrupt Rules (Critical!)

#### Rule 1: Do NOT wrap interrupt() in try/except

```python
# ❌ BAD
def node(state):
    try:
        value = interrupt("Question?")
    except Exception:
        pass  # This catches the interrupt exception!

# ✅ GOOD
def node(state):
    value = interrupt("Question?")
    try:
        risky_operation(value)
    except Exception:
        handle_error()
```

#### Rule 2: Keep interrupt order consistent

```python
# ❌ BAD - conditionally skipping interrupts
def node(state):
    name = interrupt("Name?")
    if state.get("needs_age"):  # Order changes!
        age = interrupt("Age?")
    city = interrupt("City?")

# ✅ GOOD - consistent order
def node(state):
    name = interrupt("Name?")
    age = interrupt("Age?")  # Always call
    city = interrupt("City?")
```

#### Rule 3: Use JSON-serializable values

```python
# ❌ BAD
def node(state):
    func = interrupt(lambda x: x + 1)  # Functions aren't serializable!

# ✅ GOOD
def node(state):
    number = interrupt({"question": "Enter a number", "default": 0})
```

#### Rule 4: Side effects before interrupt must be idempotent

```python
# ⚠️ RISKY - increment happens multiple times on resume
def node(state):
    state["counter"] += 1  # Side effect!
    approved = interrupt("Approve?")
    return {"counter": state["counter"]}

# ✅ BETTER - put side effects after interrupt
def node(state):
    approved = interrupt("Approve?")
    if approved:
        return {"counter": state["counter"] + 1}
```

---

## Capstone Integration

**Objective**: Add HITL gates to your Research Assistant.

### Requirements
1. Add approval gate before expensive search operations
2. Let user review and edit search queries
3. Stream results with interrupt detection
4. Validate user corrections in a loop

### Checkpoint
Scenario:
```
User: "Search for Python tutorials"
Agent: "I'll search Google. Approve?" [INTERRUPT]
User: "Yes, but add 'for beginners'"
Agent: [Searches with edited query]
```

---

## Exit Ticket

1. Why does a node restart from the beginning when resumed?
2. What happens if you forget to use `Command(resume=...)`?
3. Name two real-world uses for interrupts in your domain.

## Homework (Optional)

- Read: [Interrupts Guide](https://docs.langchain.com/oss/python/langgraph/interrupts)
- Experiment: Build a multi-step form with validation interrupts
- Challenge: Create a "confirm every action" debug mode

---

**Next**: [Day 4 - Memory & Multi-Agent Systems](../day4/README.md) →
