"""
Research Assistant Agent - Main Graph Implementation
This is a starter template. Complete it during the workshop!
"""

from typing import TypedDict, Annotated, Literal
from operator import add
import os

from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.store.memory import InMemoryStore
from langgraph.types import interrupt
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv

load_dotenv()

# ============================================================================
# STATE DEFINITION
# ============================================================================

class AgentState(TypedDict):
    """State schema for the research assistant."""
    # Message history
    messages: Annotated[list[dict], add]
    
    # User context
    user_id: str
    
    # Routing
    current_agent: Literal["web_search", "data_analysis", "report_writer", "none"]
    
    # Intermediate results
    search_results: list[dict]
    analysis_output: str
    
    # Final output
    final_response: str
    
    # Metadata
    iteration_count: int


# ============================================================================
# NODES - Day 1: Basic stubs
# ============================================================================

def supervisor_router(state: AgentState) -> dict:
    """
    Day 1: Basic router using keywords
    Day 4: Upgrade to LLM-based routing
    """
    # TODO Day 1: Implement keyword-based routing
    # TODO Day 4: Replace with LLM-based decision
    
    query = state["messages"][-1]["content"].lower()
    
    if any(word in query for word in ["search", "find", "research", "web"]):
        agent = "web_search"
    elif any(word in query for word in ["calculate", "analyze", "compute", "data"]):
        agent = "data_analysis"
    elif any(word in query for word in ["write", "summarize", "report", "document"]):
        agent = "report_writer"
    else:
        agent = "web_search"  # Default
    
    return {"current_agent": agent}


def web_search_agent(state: AgentState, *, store) -> dict:
    """
    Day 1: Stub returning mock results
    Day 3: Add approval gate with interrupt()
    Day 4: Implement real search + use memory store
    """
    # TODO Day 1: Return mock search results
    # TODO Day 3: Add interrupt() for approval
    # TODO Day 4: Check user preferences from store
    
    query = state["messages"][-1]["content"]
    
    # Day 1: Mock results
    mock_results = [
        {"title": "Result 1", "content": f"Mock content for: {query}"},
        {"title": "Result 2", "content": f"More mock content for: {query}"},
    ]
    
    return {
        "search_results": mock_results,
        "messages": [{"role": "assistant", "content": f"Found {len(mock_results)} results"}]
    }


def data_analysis_agent(state: AgentState) -> dict:
    """
    Day 1: Stub returning mock analysis
    Day 4: Implement real analysis
    """
    # TODO Day 1: Return mock analysis
    # TODO Day 4: Implement real calculation/analysis
    
    return {
        "analysis_output": "Mock analysis: This is a placeholder.",
        "messages": [{"role": "assistant", "content": "Analysis complete (mock)."}]
    }


def report_writer_agent(state: AgentState, *, store) -> dict:
    """
    Day 1: Stub returning basic response
    Day 4: Synthesize from search + analysis + use memory for tone
    """
    # TODO Day 1: Return basic response
    # TODO Day 4: Synthesize information + apply user preferences
    
    query = state["messages"][0]["content"]
    
    return {
        "final_response": f"This is a mock report for: {query}",
        "messages": [{"role": "assistant", "content": f"Report complete for: {query}"}]
    }


# ============================================================================
# GRAPH CONSTRUCTION - Day 1
# ============================================================================

def create_graph():
    """Build and compile the graph."""
    
    workflow = StateGraph(AgentState)
    
    # Add nodes
    workflow.add_node("supervisor", supervisor_router)
    workflow.add_node("web_search", web_search_agent)
    workflow.add_node("data_analysis", data_analysis_agent)
    workflow.add_node("report_writer", report_writer_agent)
    
    # Day 1: Basic routing
    workflow.add_edge(START, "supervisor")
    
    # Conditional routing based on current_agent
    def route_to_agent(state: AgentState) -> str:
        return state["current_agent"]
    
    workflow.add_conditional_edges(
        "supervisor",
        route_to_agent,
        {
            "web_search": "web_search",
            "data_analysis": "data_analysis",
            "report_writer": "report_writer",
        }
    )
    
    # All agents go to END for now
    # TODO Day 4: Add synthesizer node
    workflow.add_edge("web_search", END)
    workflow.add_edge("data_analysis", END)
    workflow.add_edge("report_writer", END)
    
    # Day 2: Add checkpointer
    # TODO: Replace MemorySaver with SqliteSaver
    import sqlite3
    conn = sqlite3.connect("checkpoints.db", check_same_thread=False)
    checkpointer = SqliteSaver(conn)
    
    # Day 4: Add store
    # TODO: Configure with embeddings for semantic search
    memory_store = InMemoryStore()
    
    return workflow.compile(checkpointer=checkpointer, store=memory_store)


# ============================================================================
# MAIN / CLI INTERFACE
# ============================================================================

def main():
    """Run the agent in CLI mode."""
    graph = create_graph()
    
    print("=" * 60)
    print("Research Assistant Agent")
    print("=" * 60)
    print("Commands: 'quit' to exit, 'new' for new conversation")
    print()
    
    user_id = input("Enter your user ID (or press Enter for 'user-1'): ").strip()
    if not user_id:
        user_id = "user-1"
    
    thread_id = f"thread-{user_id}-1"
    conversation_num = 1
    
    while True:
        print()
        user_input = input("You: ").strip()
        
        if user_input.lower() in ["quit", "exit", "q"]:
            print("Goodbye!")
            break
        
        if user_input.lower() == "new":
            conversation_num += 1
            thread_id = f"thread-{user_id}-{conversation_num}"
            print(f"Started new conversation: {thread_id}")
            continue
        
        if not user_input:
            continue
        
        config = {
            "configurable": {"thread_id": thread_id},
            "context": {"user_id": user_id}
        }
        
        try:
            result = graph.invoke(
                {
                    "messages": [{"role": "user", "content": user_input}],
                    "user_id": user_id,
                    "current_agent": "none",
                    "search_results": [],
                    "analysis_output": "",
                    "final_response": "",
                    "iteration_count": 0,
                },
                config
            )
            
            # Check for interrupts
            if "__interrupt__" in result:
                print()
                print("🛑 Interrupt:", result["__interrupt__"][0].value)
                approval = input("Your response: ").strip()
                
                from langgraph.types import Command
                result = graph.invoke(Command(resume=approval.lower() == "yes"), config)
            
            # Print response
            if result.get("final_response"):
                print(f"\nAssistant: {result['final_response']}")
            elif result.get("messages"):
                print(f"\nAssistant: {result['messages'][-1]['content']}")
        
        except Exception as e:
            print(f"\n❌ Error: {e}")


if __name__ == "__main__":
    main()
