"""
Evaluation Dataset Examples
Define test cases for your research assistant agent.
"""

# Day 5: Add more test cases as you build features
EVALUATION_DATASET = [
    {
        "name": "web_search_routing",
        "inputs": {
            "query": "What is quantum computing?",
            "user_id": "test-user-1"
        },
        "expected": {
            "routed_to": "web_search",
            "has_response": True,
            "response_contains": ["quantum", "computing"]
        }
    },
    {
        "name": "data_analysis_routing",
        "inputs": {
            "query": "Calculate 15% of 200",
            "user_id": "test-user-1"
        },
        "expected": {
            "routed_to": "data_analysis",
            "final_answer": "30"
        }
    },
    {
        "name": "report_writing_routing",
        "inputs": {
            "query": "Write a summary of machine learning",
            "user_id": "test-user-1"
        },
        "expected": {
            "routed_to": "report_writer",
            "has_response": True,
            "min_length": 100
        }
    },
    {
        "name": "multi_turn_memory",
        "inputs": [
            {"query": "My name is Alice", "user_id": "test-user-2"},
            {"query": "What's my name?", "user_id": "test-user-2"}
        ],
        "expected": {
            "second_response_contains": ["Alice"]
        }
    },
    {
        "name": "preference_persistence",
        "inputs": [
            {"query": "I prefer academic sources", "user_id": "test-user-3"},
            {"query": "Search for AI research", "user_id": "test-user-3"}
        ],
        "expected": {
            "uses_preference": True,
            "academic_sources": True
        }
    },
    {
        "name": "approval_gate_triggered",
        "inputs": {
            "query": "Search for expensive data",
            "user_id": "test-user-4"
        },
        "expected": {
            "has_interrupt": True,
            "interrupt_type": "approval"
        }
    },
    {
        "name": "tool_trajectory_search",
        "inputs": {
            "query": "Find recent news about Python 3.13",
            "user_id": "test-user-5"
        },
        "expected": {
            "tools_used": ["search_web"],
            "tool_order": ["search_web"]
        }
    },
    {
        "name": "error_recovery",
        "inputs": {
            "query": "Search with network error simulation",
            "user_id": "test-user-6",
            "simulate_error": True
        },
        "expected": {
            "handled_error": True,
            "has_retry_option": True
        }
    },
]


def create_langsmith_dataset():
    """
    Create a LangSmith dataset from these examples.
    Run this on Day 5 to populate your evaluation suite.
    """
    from langsmith import Client
    
    client = Client()
    
    dataset_name = "research-assistant-test-suite"
    dataset = client.create_dataset(
        dataset_name=dataset_name,
        description="Comprehensive test suite for research assistant agent"
    )
    
    for example in EVALUATION_DATASET:
        client.create_example(
            dataset_id=dataset.id,
            inputs=example["inputs"],
            outputs=example["expected"],
            metadata={"test_name": example["name"]}
        )
    
    print(f"Created dataset '{dataset_name}' with {len(EVALUATION_DATASET)} examples")
    return dataset


if __name__ == "__main__":
    create_langsmith_dataset()
