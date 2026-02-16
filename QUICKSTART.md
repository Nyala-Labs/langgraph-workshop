# Quick Start Guide

Get up and running with the LangGraph Workshop in 10 minutes.

## Prerequisites

- Python 3.11+ OR Node 18+
- OpenAI or Anthropic API key
- Git installed

## Python Track (5 minutes)

```bash
# 1. Clone repository
git clone https://github.com/YOUR_ORG/langgraph-workshop.git
cd langgraph-workshop

# 2. Set up environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure API keys
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY or ANTHROPIC_API_KEY

# 5. Verify setup
python scripts/verify_setup.py

# ✅ You're ready! Start with Day 1
```

Expected verification output:
```
✓ Python 3.11.x
✓ LangGraph 0.3.18 installed
✓ API keys configured: OpenAI
✓ Simple graph execution: SUCCESS
✓ Checkpointer working: SUCCESS
✓ LangSmith configured (optional)
✅ All checks passed! You're ready to start.
```

## TypeScript Track (5 minutes)

```bash
# 1. Clone repository
git clone https://github.com/YOUR_ORG/langgraph-workshop.git
cd langgraph-workshop

# 2. Install dependencies
npm install

# 3. Configure API keys
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY or ANTHROPIC_API_KEY

# 4. Build TypeScript
npm run build

# 5. Verify setup
npm run verify-setup

# ✅ You're ready! Start with Day 1
```

## First Exercise (Both Tracks)

Open and run the first lab:

**Python**: `workshop/day1/labs/lab1_first_graph.py`  
**TypeScript**: `workshop/day1/labs/lab1_first_graph.ts`

## Workshop Structure

```
Day 1: Foundations (graphs, state, routing) → workshop/day1/
Day 2: Persistence & durability             → workshop/day2/
Day 3: Human-in-the-loop with interrupts    → workshop/day3/
Day 4: Memory & multi-agent systems         → workshop/day4/
Day 5: Production hardening                 → workshop/day5/

Capstone: Research Assistant Agent          → capstone/
```

## Daily Workflow

Each day:
1. Read `workshop/dayN/README.md` for objectives
2. Follow along with live coding demos
3. Complete lab exercises (pair programming recommended)
4. Integrate learning into capstone project
5. Complete exit ticket

## Getting Help

- **During workshop**: Use sticky notes (red = stuck, green = done)
- **Questions**: Raise hand or post in chat
- **After hours**: Discord/Slack channel
- **Issues**: GitHub Issues

## Common Setup Issues

### "Command not found: python"
```bash
# Try python3
python3 --version
# Or create alias
alias python=python3
```

### "Import Error: No module named langgraph"
```bash
# Make sure venv is activated
source .venv/bin/activate  # You should see (.venv) prefix
pip install -r requirements.txt
```

### "API key not found"
```bash
# Check .env file exists
ls -la .env

# Verify it has your key
cat .env | grep API_KEY

# Make sure no extra spaces
# Good: OPENAI_API_KEY=sk-...
# Bad:  OPENAI_API_KEY = sk-...
```

### TypeScript build errors
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm run build
```

## What You'll Build

By end of workshop, you'll have a **Research Assistant Agent** with:

✅ Multi-agent architecture (supervisor + 3 specialists)  
✅ Persistent conversations across sessions  
✅ Human-in-the-loop approval gates  
✅ Long-term memory for user preferences  
✅ Evaluation suite with multiple test cases  
✅ Production-ready error handling  

## Resources

- [Main README](README.md) - Full workshop overview
- [Setup Guide](SETUP.md) - Detailed setup instructions
- [Day 1 Materials](workshop/day1/README.md) - Start here!
- [Capstone Spec](capstone/README.md) - Final project requirements

## Ready?

```bash
# Start Day 1
cd workshop/day1
cat README.md  # or open in your editor
```

**Let's build some agents! 🚀**

---

**Pro tip**: Star this repo on GitHub to track updates and show support!
