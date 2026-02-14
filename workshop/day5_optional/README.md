# Day 5: Production Hardening (Optional)

**Duration**: ~6.5 hours  
**Goal**: Make your agent production-ready with evals, observability, and safety measures

## Learning Objectives

By the end of Day 5, you will be able to:
- Build evaluation harnesses for agent testing
- Use LangSmith Studio for observability and prompt iteration
- Run experiments over datasets
- Implement safety measures (allowlists, rate limits, secrets)
- Create operational runbooks
- Present and demo your capstone project

## Schedule

| Time | Activity | Duration |
|------|----------|----------|
| 09:00-09:15 | Recap + production mindset | 15 min |
| 09:15-10:30 | **Block 1**: Evaluation fundamentals | 75 min |
| 10:30-10:45 | Break | 15 min |
| 10:45-12:00 | **Block 2**: Studio observability | 75 min |
| 12:00-13:00 | Lunch | 60 min |
| 13:00-14:30 | **Block 3**: Safety & operational practices | 90 min |
| 14:30-14:45 | Break | 15 min |
| 14:45-16:00 | **Block 4**: Capstone demos | 75 min |
| 16:00-16:30 | Wrap-up + next steps | 30 min |

## Topics Covered

### 1. Production Mindset (Concept)

**Key Shift**: Development vs Production

| Development | Production |
|-------------|------------|
| "Does it work?" | "Does it work reliably?" |
| Manual testing | Automated test suites |
| Console logs | Structured observability |
| API key in code | Secrets management |
| Single instance | Scale + redundancy |
| Fix when broken | Prevent breakage |

**Production Checklist**:
- ✅ Automated evaluations
- ✅ Observability/tracing
- ✅ Error handling & retry logic
- ✅ Secrets management
- ✅ Rate limiting
- ✅ Monitoring & alerts
- ✅ Runbooks for common issues

---

### 2. Evaluation Fundamentals (Lab 1)

#### The Evaluation Loop

```
1. Create dataset (inputs + expected outputs)
2. Run agent over dataset
3. Score outputs (programmatic or LLM-as-judge)
4. Analyze failures
5. Iterate and improve
```

#### Building a Dataset

```python
from langsmith import Client

client = Client()

# Create dataset
dataset_name = "research-agent-v1"
dataset = client.create_dataset(
    dataset_name=dataset_name,
    description="Test cases for research agent"
)

# Add examples
examples = [
    {
        "inputs": {"query": "What is quantum computing?"},
        "outputs": {"contains_keywords": ["quantum", "superposition", "qubit"]}
    },
    {
        "inputs": {"query": "Calculate 15% of 200"},
        "outputs": {"final_answer": "30"}
    },
    {
        "inputs": {"query": "Write Python hello world"},
        "outputs": {"has_code": True, "language": "python"}
    }
]

for example in examples:
    client.create_example(
        dataset_id=dataset.id,
        inputs=example["inputs"],
        outputs=example["outputs"]
    )
```

#### Programmatic Evaluator

```python
def exact_match_evaluator(run, example):
    """Check if final answer matches expected."""
    predicted = run.outputs.get("final_answer", "")
    expected = example.outputs.get("final_answer", "")
    
    return {
        "key": "exact_match",
        "score": 1.0 if predicted == expected else 0.0
    }

def contains_keywords_evaluator(run, example):
    """Check if response contains required keywords."""
    response = run.outputs.get("response", "").lower()
    keywords = example.outputs.get("contains_keywords", [])
    
    matches = sum(1 for kw in keywords if kw.lower() in response)
    score = matches / len(keywords) if keywords else 0.0
    
    return {
        "key": "keyword_coverage",
        "score": score
    }
```

#### Running Evaluations

```python
from langsmith.evaluation import evaluate

# Run evaluation
results = evaluate(
    lambda inputs: graph.invoke(inputs, config={"configurable": {"thread_id": "eval"}}),
    data=dataset_name,
    evaluators=[exact_match_evaluator, contains_keywords_evaluator],
    experiment_prefix="research-agent-baseline"
)

print(f"Results: {results}")
```

**Lab Exercise**: 
1. Create a dataset with 5 examples
2. Write 2 evaluators
3. Run evaluation and analyze results

---

### 3. LLM-as-Judge Evaluators (Lab 2)

**Pattern**: Use an LLM to score outputs.

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate

def llm_judge_evaluator(run, example):
    """Use LLM to judge response quality."""
    judge = ChatOpenAI(model="gpt-4o")
    
    prompt = PromptTemplate.from_template("""
    Evaluate this response on a scale of 1-5:
    
    Query: {query}
    Response: {response}
    
    Criteria:
    - Accuracy
    - Completeness
    - Clarity
    
    Return ONLY a number 1-5.
    """)
    
    query = example.inputs["query"]
    response = run.outputs.get("response", "")
    
    result = judge.invoke(prompt.format(query=query, response=response))
    score = int(result.content.strip())
    
    return {
        "key": "llm_judge_quality",
        "score": score / 5.0  # Normalize to 0-1
    }
```

**Best Practices**:
- Use structured output (JSON) for reliable parsing
- Include examples in prompt (few-shot)
- Use temperature=0 for consistency
- Cache judge results to save costs

---

### 4. Tool Trajectory Evaluation (Lab 3)

**Pattern**: Validate the sequence of tool calls.

```python
def tool_trajectory_evaluator(run, example):
    """Check if correct tools were called in order."""
    expected_tools = example.outputs.get("expected_tools", [])
    
    # Extract tool calls from run
    actual_tools = []
    for message in run.outputs.get("messages", []):
        if hasattr(message, "tool_calls"):
            actual_tools.extend([tc["name"] for tc in message.tool_calls])
    
    # Check exact match
    exact = actual_tools == expected_tools
    
    # Check if required tools present (order-independent)
    required_present = all(tool in actual_tools for tool in expected_tools)
    
    return {
        "key": "tool_trajectory",
        "score": 1.0 if exact else (0.5 if required_present else 0.0)
    }
```

**Use Cases**:
- Validate workflow correctness
- Catch regressions in tool selection
- Ensure required steps aren't skipped

---

### 5. CI/CD Integration (Concept + Demo)

**Gate Suite**: Fast tests run on every commit

```python
# tests/test_agent.py
import pytest
from my_agent import graph

@pytest.mark.parametrize("query,expected_tool", [
    ("Search for Python tutorials", "search_web"),
    ("Calculate 2+2", "calculator"),
    ("Read file data.txt", "read_file"),
])
def test_tool_routing(query, expected_tool):
    """Verify correct tool is selected."""
    config = {"configurable": {"thread_id": f"test-{query}"}}
    result = graph.invoke({"query": query}, config)
    
    # Extract tool calls
    tools_used = [msg.tool_calls[0]["name"] for msg in result["messages"] if hasattr(msg, "tool_calls")]
    assert expected_tool in tools_used

def test_persistence():
    """Verify state persists across turns."""
    config = {"configurable": {"thread_id": "persistence-test"}}
    
    # Turn 1
    graph.invoke({"query": "My name is Alice"}, config)
    
    # Turn 2
    result = graph.invoke({"query": "What's my name?"}, config)
    assert "Alice" in result["response"].lower()
```

**GitHub Actions Example**:

```yaml
# .github/workflows/test.yml
name: Agent Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - run: pip install -r requirements.txt
      - run: pytest tests/ --cov=src
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

---

### 6. LangSmith Studio (Lab 4)

**Key Features**:
1. **Trace inspection**: See every step of execution
2. **Prompt iteration**: Edit prompts directly in UI
3. **Experiments**: Compare variants over datasets
4. **Debugging**: Import production traces locally

#### Viewing Traces

```python
import os
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_PROJECT"] = "langgraph-workshop"

# Run agent - traces automatically captured
result = graph.invoke({"query": "Test query"}, config)

# View at: https://smith.langchain.com
```

#### Running Experiments in Studio

1. Create a dataset in LangSmith
2. Open your agent in Studio
3. Click "Run experiment"
4. Select dataset
5. Monitor progress
6. Compare results across runs

**Lab Exercise**:
1. Capture 5 traces of your agent
2. Export one trace to a dataset
3. Run an experiment comparing two prompts

---

### 7. Safety Measures (Lab 5)

#### Tool Allowlists

```python
ALLOWED_TOOLS = ["search_web", "read_file", "calculator"]

def safe_tool_executor(tool_name, tool_input):
    """Only execute allowed tools."""
    if tool_name not in ALLOWED_TOOLS:
        raise ValueError(f"Tool '{tool_name}' not in allowlist")
    
    # Execute tool
    return execute_tool(tool_name, tool_input)
```

#### Rate Limiting

```python
from collections import defaultdict
from datetime import datetime, timedelta
import time

class RateLimiter:
    def __init__(self, max_requests, time_window):
        self.max_requests = max_requests
        self.time_window = time_window  # seconds
        self.requests = defaultdict(list)
    
    def check(self, user_id):
        now = datetime.now()
        cutoff = now - timedelta(seconds=self.time_window)
        
        # Clean old requests
        self.requests[user_id] = [
            req_time for req_time in self.requests[user_id]
            if req_time > cutoff
        ]
        
        # Check limit
        if len(self.requests[user_id]) >= self.max_requests:
            raise Exception(f"Rate limit exceeded for {user_id}")
        
        # Record request
        self.requests[user_id].append(now)

# Usage
rate_limiter = RateLimiter(max_requests=10, time_window=60)  # 10/min

def agent_handler(user_id, query):
    rate_limiter.check(user_id)
    return graph.invoke({"query": query}, config)
```

#### Secrets Management

```python
# ❌ BAD
api_key = "sk-1234567890abcdef"

# ✅ GOOD
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("OPENAI_API_KEY not set")
```

#### Input Validation

```python
def validate_query(query: str) -> str:
    """Sanitize user input."""
    # Length check
    if len(query) > 5000:
        raise ValueError("Query too long")
    
    # Injection check (basic)
    forbidden = ["<script>", "DROP TABLE", "'; --"]
    for pattern in forbidden:
        if pattern.lower() in query.lower():
            raise ValueError("Potentially malicious input")
    
    return query.strip()
```

---

### 8. Operational Runbooks (Lab 6)

**Runbook Template**:

```markdown
# Runbook: Agent Not Responding

## Symptoms
- API returns 500 errors
- Requests time out after 30s
- Traces show no node execution

## Diagnosis Steps
1. Check LangSmith traces for last successful run
2. Verify database connection (checkpointer)
3. Check API key validity
4. Review recent code changes

## Resolution
- If DB connection failed: Restart database, verify credentials
- If API key expired: Rotate key, update secrets
- If graph stuck: Check for infinite loops in conditional edges

## Prevention
- Add health check endpoint
- Monitor database connection pool
- Set up alerts for error rate > 5%
```

**Lab Exercise**: Create runbooks for:
1. Tool execution timeout
2. Checkpoint corruption
3. Memory (store) unavailable

---

### 9. Monitoring & Alerts (Concept)

**Key Metrics**:
- **Latency**: P50, P95, P99 response times
- **Error rate**: % of failed requests
- **Token usage**: Cost tracking
- **Tool success rate**: Per-tool metrics

**Example: Prometheus + Grafana**

```python
from prometheus_client import Counter, Histogram
import time

request_counter = Counter('agent_requests_total', 'Total requests', ['status'])
request_duration = Histogram('agent_request_duration_seconds', 'Request duration')

@request_duration.time()
def handle_request(query):
    try:
        result = graph.invoke({"query": query}, config)
        request_counter.labels(status='success').inc()
        return result
    except Exception as e:
        request_counter.labels(status='error').inc()
        raise
```

---

## Capstone Demo (Lab 7)

**Presentation Format** (5-7 minutes per team):

1. **Problem & Solution** (1 min)
   - What does your agent do?
   - Why is it useful?

2. **Architecture** (2 min)
   - State design
   - Multi-agent routing
   - Memory strategy

3. **Live Demo** (3 min)
   - Show multi-turn conversation
   - Trigger HITL interrupt
   - Demonstrate memory across threads

4. **Production Readiness** (1 min)
   - Evaluation results
   - Safety measures
   - One key challenge solved

### Scoring Rubric

| Criteria | Points | Description |
|----------|--------|-------------|
| Functionality | 25 | Core features work correctly |
| Persistence | 15 | Multi-turn state management |
| HITL | 15 | At least one interrupt gate |
| Memory | 15 | Cross-thread memory store |
| Evaluation | 10 | Has test suite with ≥3 cases |
| Safety | 10 | Input validation, error handling |
| Code Quality | 10 | Clean, documented, follows patterns |

**Minimum to Pass**: 60/100 points

---

## Final Wrap-up

### What You've Built

Over 5 days, you've learned:
- ✅ Graph-based workflows with state management
- ✅ Persistence, durability, and recovery
- ✅ Human-in-the-loop patterns
- ✅ Long-term memory across conversations
- ✅ Multi-agent architectures
- ✅ Time-travel debugging
- ✅ Production evaluation and observability

### Next Steps

**Continue Learning**:
- LangChain Academy advanced courses
- Build a personal project using LangGraph
- Contribute to LangGraph open source

**Community**:
- Join LangChain Discord
- Share your projects on Twitter/LinkedIn
- Attend LangChain meetups

**Production Deployment**:
- Deploy to LangSmith Cloud
- Set up monitoring
- Iterate based on real usage

---

## Exit Survey

Please complete: [Post-Workshop Survey](https://forms.gle/example)

Topics:
1. What was most valuable?
2. What needs improvement?
3. Will you use LangGraph in your work?
4. Would you recommend this workshop?

---

## Congratulations! 🎉

You've completed the comprehensive LangGraph workshop. You now have the skills to build production-ready agent systems. Keep building, keep learning, and share what you create!

**Questions?** Email: [workshop@example.com](mailto:workshop@example.com)

---

**Certificate of Completion**: Available after capstone demo and minimum passing score.
