"""
Verification script for Python track setup.
Run this before Day 1 to ensure your environment is ready.
"""

import sys
import os
from typing import Dict, List, Tuple

def check_python_version() -> Tuple[bool, str]:
    """Check Python version is 3.11+."""
    version = sys.version_info
    if version >= (3, 11):
        return True, f"✓ Python {version.major}.{version.minor}.{version.micro}"
    return False, f"✗ Python {version.major}.{version.minor} (need 3.11+)"

def check_imports() -> Tuple[bool, str]:
    """Check required packages are installed."""
    try:
        import langgraph
        import langchain_core
        from langgraph.checkpoint.sqlite import SqliteSaver
        
        return True, f"✓ LangGraph {langgraph.__version__} installed"
    except ImportError as e:
        return False, f"✗ Missing package: {e.name}"

def check_api_keys() -> Tuple[bool, str]:
    """Check API keys are configured."""
    from dotenv import load_dotenv
    load_dotenv()
    
    openai_key = os.getenv("OPENAI_API_KEY")
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    
    if openai_key or anthropic_key:
        providers = []
        if openai_key:
            providers.append("OpenAI")
        if anthropic_key:
            providers.append("Anthropic")
        return True, f"✓ API keys configured: {', '.join(providers)}"
    return False, "✗ No API keys found in .env"

def check_langsmith() -> Tuple[bool, str]:
    """Check LangSmith configuration."""
    from dotenv import load_dotenv
    load_dotenv()
    
    langsmith_key = os.getenv("LANGSMITH_API_KEY")
    if langsmith_key:
        return True, "✓ LangSmith configured"
    return False, "⚠ LangSmith not configured (optional for Day 1-4)"

def test_simple_graph() -> Tuple[bool, str]:
    """Test creating and running a simple graph."""
    try:
        from typing import TypedDict
        from langgraph.graph import StateGraph, START, END
        
        class State(TypedDict):
            value: int
        
        def node(state: State) -> dict:
            return {"value": state["value"] + 1}
        
        workflow = StateGraph(State)
        workflow.add_node("test", node)
        workflow.add_edge(START, "test")
        workflow.add_edge("test", END)
        
        graph = workflow.compile()
        result = graph.invoke({"value": 0})
        
        if result["value"] == 1:
            return True, "✓ Simple graph execution: SUCCESS"
        return False, "✗ Graph returned unexpected result"
        
    except Exception as e:
        return False, f"✗ Graph execution failed: {str(e)}"

def test_checkpointer() -> Tuple[bool, str]:
    """Test checkpointer functionality."""
    try:
        from typing import TypedDict
        from langgraph.graph import StateGraph, START, END
        from langgraph.checkpoint.memory import MemorySaver
        
        class State(TypedDict):
            count: int
        
        def increment(state: State) -> dict:
            return {"count": state["count"] + 1}
        
        workflow = StateGraph(State)
        workflow.add_node("inc", increment)
        workflow.add_edge(START, "inc")
        workflow.add_edge("inc", END)
        
        checkpointer = MemorySaver()
        graph = workflow.compile(checkpointer=checkpointer)
        
        config = {"configurable": {"thread_id": "test"}}
        result1 = graph.invoke({"count": 0}, config)
        result2 = graph.invoke({"count": 0}, config)
        
        if result2["count"] == 2:  # Should accumulate
            return True, "✓ Checkpointer working: SUCCESS"
        return False, "✗ Checkpointer not persisting state"
        
    except Exception as e:
        return False, f"✗ Checkpointer test failed: {str(e)}"

def test_llm_connection() -> Tuple[bool, str]:
    """Test LLM API connection (optional)."""
    from dotenv import load_dotenv
    load_dotenv()
    
    openai_key = os.getenv("OPENAI_API_KEY")
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    
    if not (openai_key or anthropic_key):
        return False, "⚠ Skip LLM test (no API keys)"
    
    try:
        if openai_key:
            from langchain_openai import ChatOpenAI
            model = ChatOpenAI(model="gpt-4o-mini")
            response = model.invoke([{"role": "user", "content": "Hi"}])
            if response.content:
                return True, "✓ OpenAI API connection: SUCCESS"
        elif anthropic_key:
            from langchain_anthropic import ChatAnthropic
            model = ChatAnthropic(model="claude-3-5-haiku-20241022")
            response = model.invoke([{"role": "user", "content": "Hi"}])
            if response.content:
                return True, "✓ Anthropic API connection: SUCCESS"
    except Exception as e:
        return False, f"⚠ LLM API test failed: {str(e)}"

def main():
    """Run all verification checks."""
    print("=" * 60)
    print("LangGraph Workshop - Python Setup Verification")
    print("=" * 60)
    print()
    
    checks = [
        ("Python Version", check_python_version),
        ("Package Installation", check_imports),
        ("API Keys", check_api_keys),
        ("LangSmith Config", check_langsmith),
        ("Simple Graph", test_simple_graph),
        ("Checkpointer", test_checkpointer),
        ("LLM Connection", test_llm_connection),
    ]
    
    results = []
    for name, check_fn in checks:
        print(f"Checking {name}...", end=" ")
        success, message = check_fn()
        results.append((name, success, message))
        print(message)
    
    print()
    print("=" * 60)
    
    failed = [r for r in results if not r[1] and not r[2].startswith("⚠")]
    warnings = [r for r in results if r[2].startswith("⚠")]
    
    if failed:
        print(f"❌ {len(failed)} check(s) failed:")
        for name, _, msg in failed:
            print(f"   - {name}: {msg}")
        print()
        print("Please fix the issues above before starting the workshop.")
        print("See SETUP.md for detailed instructions.")
        sys.exit(1)
    elif warnings:
        print(f"⚠️  {len(warnings)} warning(s):")
        for name, _, msg in warnings:
            print(f"   - {name}: {msg}")
        print()
        print("You can proceed, but some features may not work.")
        print("All checks will be required by Day 5.")
    else:
        print("✅ All checks passed! You're ready to start.")
    
    print("=" * 60)

if __name__ == "__main__":
    main()
