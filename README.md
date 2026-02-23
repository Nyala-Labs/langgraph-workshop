# LangGraph Workshop

A hands-on, multi-day bootcamp teaching everything you need to build production-ready LangGraph agents.

## 🎯 What You'll Learn

By the end of this workshop, you will be able to:

- Build **stateful agent workflows** using LangGraph's Graph API
- Implement **persistence** with threads, checkpoints, and durable execution
- Add **human-in-the-loop** controls with interrupts and approval flows
- Debug and fix agents using **time travel** and checkpoint forking
- Build **memory systems** (short-term state + long-term cross-thread storage)
- Compose **multi-agent systems** using supervisor patterns and subgraphs
- Ship production agents with **observability**, **evaluation harnesses**, and **prompt iteration** workflows

## 📋 Prerequisites

### Required Knowledge
- **Python track**: Python 3.11+ experience, basic async/await understanding
- **TypeScript track**: Node 18+, TypeScript basics, async/await familiarity
- Basic understanding of LLMs and prompting
- Git basics for cloning and tracking changes

### Required Setup
- Laptop with 8GB+ RAM
- API keys:
  - **OpenAI** or **Anthropic** API key (required)
  - **LangSmith** account (free tier works; sign up at [smith.langchain.com](https://smith.langchain.com))
- Development environment (see Setup below)

### Helpful But Not Required
- LangChain familiarity
- Experience with chatbots or agents
- Docker knowledge (for optional deployment exercises)

## 🚀 Setup Instructions

### Python Track

```bash
# Clone the repository
git clone https://github.com/nyala-labs/langgraph-workshop.git
cd langgraph-workshop

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env and add your API keys

# Verify setup
python scripts/verify_setup.py
```

### TypeScript Track

```bash
# Clone the repository
git clone https://github.com/nyala-labs/langgraph-workshop.git
cd langgraph-workshop

# Install dependencies
npm install
`
# Set up environment variables
cp .env.example .env
# Edit .env and add your API keys

# Verify setup
npm run verify-setup
```

## 📅 Schedule Overview

### 5-Day Core

**Day 1: Foundations**
- Graph fundamentals: nodes, edges, state schemas
- Reducers and state merge semantics
- Streaming and execution model
- *Milestone*: First workflow running

**Day 2: Persistence & Durability**
- Threads, checkpoints, and `thread_id`
- State history and replay
- Failure recovery patterns
- *Milestone*: Multi-turn conversations with persistence

**Day 3: Human-in-the-Loop**
- Interrupts and approval gates
- Review/edit patterns
- Tool safety and HITL workflows
- *Milestone*: Safe agent with operator controls

**Day 4: Memory, Composition & Debugging**
- Long-term memory with stores
- Multi-agent routing (supervisor pattern)
- Time travel for debugging
- *Milestone*: Production-ready multi-agent system

**Day 5: Production Hardening**
- Observability with LangSmith/Studio
- Evaluation harnesses and testing strategies
- Safety, secrets, and rate limiting
- *Capstone Demo Day*

## 🏗️ Workshop Structure

```
langgraph-workshop/
├── README.md                    # This file
├── SETUP.md                     # Detailed setup instructions
├── requirements.txt             # Python dependencies
├── package.json                 # TypeScript dependencies
├── .env.example                 # Environment template
├── scripts/
│   ├── verify_setup.py          # Python setup verification
│   └── verify_setup.ts          # TypeScript setup verification
├── workshop/
│   ├── day1/                    # Foundations
│   ├── day2/                    # Persistence
│   ├── day3/                    # Human-in-the-loop
│   ├── day4/                    # Memory & composition
│   └── day5/                    # Production
└── capstone/
    ├── python/                  # Python capstone implementation
    ├── typescript/              # TypeScript capstone implementation
    ├── evals/                   # Evaluation harness
    └── runbooks/                # Operational guides
```

## 🎯 Capstone Project

Build a **Real-World Agent Service** with:
- User-facing chat/task interface
- Multiple tools (web search, file operations, action execution)
- Durable execution and persistence
- HITL approvals for risky operations
- Long-term memory (user profiles + episodic notes)
- Multi-agent routing (supervisor → specialists)
- Evaluation suite and observability

See [`capstone/README.md`](capstone/README.md) for full requirements and rubric.

## 📚 Reference Materials

### Official Documentation (2026)
- [LangGraph Concepts](https://langchain-ai.github.io/langgraph/concepts/)
- [Persistence Guide](https://docs.langchain.com/oss/python/langgraph/persistence)
- [Interrupts (HITL)](https://docs.langchain.com/oss/python/langgraph/interrupts)
- [Time Travel](https://docs.langchain.com/oss/python/langgraph/use-time-travel)
- [Studio Observability](https://docs.langchain.com/langgraph-platform/observability-studio)

### Additional Resources
- [LangChain Academy - Intro to LangGraph](https://academy.langchain.com/courses/intro-to-langgraph)
- [LangGraph Examples](https://langchain-ai.github.io/langgraph/examples/)
- [Carpentries Instructor Training](https://carpentries.github.io/instructor-training/) (pedagogy reference)

## 📜 License

This workshop is licensed under [MIT License](LICENSE). Workshop materials are © 2026 [Nyala Labs].

## 🙋 Questions or Issues?

- Open an issue in this repository
- Contact the Nyala team: [nyalateam@gmail.com](mailto:nyalateam@gmail.com)

---