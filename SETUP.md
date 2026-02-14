# Setup Guide

Detailed setup instructions for both Python and TypeScript tracks.

## System Requirements

- **OS**: Windows 10+, macOS 11+, or Linux (Ubuntu 20.04+)
- **RAM**: 8GB minimum, 16GB recommended
- **Disk**: 2GB free space for dependencies
- **Internet**: Stable connection required for API calls

## Python Track Setup

### 1. Install Python 3.11+

**macOS** (using Homebrew):
```bash
brew install python@3.11
```

**Windows** (using installer):
- Download from [python.org](https://www.python.org/downloads/)
- Check "Add Python to PATH" during installation

**Linux** (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install python3.11 python3.11-venv python3-pip
```

Verify:
```bash
python --version  # Should show 3.11.x or higher
```

### 2. Clone Repository

```bash
git clone https://github.com/nyala-labs/langgraph-workshop.git
cd langgraph-workshop
```

### 3. Create Virtual Environment

```bash
# Create venv
python -m venv .venv

# Activate (macOS/Linux)
source .venv/bin/activate

# Activate (Windows PowerShell)
.venv\Scripts\Activate.ps1

# Activate (Windows CMD)
.venv\Scripts\activate.bat
```

You should see `(.venv)` prefix in your terminal.

### 4. Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

This installs:
- `langgraph>=0.3.18`
- `langgraph-checkpoint-sqlite`
- `langchain-core`
- `langchain-openai` or `langchain-anthropic`
- `langsmith`
- Development tools (pytest, black, ruff)

### 5. Configure Environment Variables

```bash
# Copy template
cp .env.example .env

# Edit .env with your favorite editor
# Add your API keys
```

Required in `.env`:
```bash
# LLM Provider (choose one or both)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# LangSmith (required for Day 5)
LANGSMITH_API_KEY=lsv2_...
LANGSMITH_PROJECT=langgraph-workshop

# Optional: for debugging
LANGCHAIN_TRACING_V2=true
LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
```

### 6. Verify Setup

```bash
python scripts/verify_setup.py
```

Expected output:
```
✓ Python version: 3.11.x
✓ LangGraph installed: 0.3.18
✓ API keys configured
✓ Simple graph execution: SUCCESS
✓ Checkpointer working: SUCCESS
✓ LangSmith tracing: SUCCESS

All checks passed! You're ready to start.
```

### Troubleshooting

**ModuleNotFoundError**:
```bash
# Make sure venv is activated
source .venv/bin/activate  # or Windows equivalent
pip install -r requirements.txt
```

**Import errors**:
```bash
pip install --upgrade langgraph langchain-core
```

**API key errors**:
- Check `.env` file exists in project root
- Verify no extra spaces around `=` in `.env`
- Make sure API keys are valid (test at provider's website)

---

## TypeScript Track Setup

### 1. Install Node.js 18+

**macOS** (using Homebrew):
```bash
brew install node@18
```

**Windows**:
- Download from [nodejs.org](https://nodejs.org/)
- Use LTS version (18.x or 20.x)

**Linux**:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Verify:
```bash
node --version  # Should show v18.x or higher
npm --version   # Should show 9.x or higher
```

### 2. Clone Repository

```bash
git clone https://github.com/YOUR_ORG/langgraph-workshop.git
cd langgraph-workshop
```

### 3. Install Dependencies

```bash
npm install
```

This installs:
- `@langchain/langgraph`
- `@langchain/core`
- `@langchain/openai` or `@langchain/anthropic`
- `langsmith`
- TypeScript and development tools

### 4. Configure Environment Variables

```bash
# Copy template
cp .env.example .env

# Edit .env with your favorite editor
```

Required in `.env`:
```bash
# LLM Provider (choose one or both)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# LangSmith (required for Day 5)
LANGSMITH_API_KEY=lsv2_...
LANGSMITH_PROJECT=langgraph-workshop

# Optional: for debugging
LANGCHAIN_TRACING_V2=true
LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
```

### 5. Build TypeScript

```bash
npm run build
```

### 6. Verify Setup

```bash
npm run verify-setup
```

Expected output:
```
✓ Node version: v18.x.x
✓ TypeScript: 5.x.x
✓ LangGraph installed: 0.2.x
✓ API keys configured
✓ Simple graph execution: SUCCESS
✓ Checkpointer working: SUCCESS
✓ LangSmith tracing: SUCCESS

All checks passed! You're ready to start.
```

### Troubleshooting

**Module not found**:
```bash
npm install
npm run build
```

**TypeScript errors**:
```bash
npm install --save-dev @types/node
npm run build
```

**API key errors**:
- Ensure `.env` file is in project root
- Verify API keys have no extra whitespace
- Test keys work at provider's dashboard

---

## Getting API Keys

### OpenAI
1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Navigate to API Keys
4. Create new key
5. Add billing (free tier has limits)

### Anthropic
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in
3. Navigate to API Keys
4. Create new key
5. Add credits (Claude models require paid account)

### LangSmith
1. Go to [smith.langchain.com](https://smith.langchain.com)
2. Sign up with GitHub or email
3. Create a project (e.g., "langgraph-workshop")
4. Settings → API Keys → Create key
5. Free tier: 5k traces/month (sufficient for workshop)

---

## IDE Setup (Optional)

### VS Code Extensions (Recommended)

**Python**:
- Python (ms-python.python)
- Pylance (ms-python.vscode-pylance)
- Ruff (charliermarsh.ruff)

**TypeScript**:
- ESLint (dbaeumer.vscode-eslint)
- Prettier (esbenp.prettier-vscode)

**Both**:
- LangChain (langchain.langchain-vscode) - helpful for prompts
- GitHub Copilot (optional, helpful for labs)

### PyCharm / WebStorm
- Install from JetBrains
- Open project folder
- Configure interpreter (Python) or Node (TS)
- Install recommended plugins

---

## Common Issues

### "Command not found: python"
Try `python3` instead of `python`, or create an alias:
```bash
alias python=python3
```

### Windows: "Execution of scripts is disabled"
Run PowerShell as Administrator:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### macOS: SSL Certificate Errors
```bash
/Applications/Python\ 3.11/Install\ Certificates.command
```

### Network Issues Behind Corporate Proxy
Set proxy environment variables:
```bash
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080
```

---

## Pre-Workshop Checklist

Before Day 1, ensure:
- [ ] Python 3.11+ or Node 18+ installed
- [ ] Repository cloned
- [ ] Dependencies installed
- [ ] `.env` file configured with valid API keys
- [ ] Verification script passes all checks
- [ ] LangSmith account created (for Day 5)
- [ ] IDE/editor ready with syntax highlighting

**Need help?** Open an issue or contact workshop staff before the event.
