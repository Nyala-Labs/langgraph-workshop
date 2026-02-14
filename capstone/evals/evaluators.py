"""
Evaluation Functions
Implement evaluators to score agent outputs.
"""

from typing import Dict, Any


def routing_accuracy_evaluator(run, example) -> Dict[str, Any]:
    """Check if query was routed to correct agent."""
    expected_agent = example.outputs.get("routed_to")
    actual_agent = run.outputs.get("current_agent")
    
    return {
        "key": "routing_accuracy",
        "score": 1.0 if actual_agent == expected_agent else 0.0,
        "comment": f"Expected {expected_agent}, got {actual_agent}"
    }


def response_quality_evaluator(run, example) -> Dict[str, Any]:
    """Check if response contains expected keywords."""
    response = run.outputs.get("final_response", "").lower()
    expected_keywords = example.outputs.get("response_contains", [])
    
    if not expected_keywords:
        return {"key": "response_quality", "score": 1.0}
    
    matches = sum(1 for kw in expected_keywords if kw.lower() in response)
    score = matches / len(expected_keywords)
    
    return {
        "key": "response_quality",
        "score": score,
        "comment": f"Matched {matches}/{len(expected_keywords)} keywords"
    }


def exact_answer_evaluator(run, example) -> Dict[str, Any]:
    """Check if final answer matches expected value."""
    predicted = run.outputs.get("final_response", "").strip()
    expected = str(example.outputs.get("final_answer", "")).strip()
    
    if not expected:
        return {"key": "exact_answer", "score": 1.0}
    
    match = expected.lower() in predicted.lower()
    
    return {
        "key": "exact_answer",
        "score": 1.0 if match else 0.0,
        "comment": f"Expected '{expected}' in response"
    }


def tool_trajectory_evaluator(run, example) -> Dict[str, Any]:
    """Validate sequence of tool calls."""
    expected_tools = example.outputs.get("tools_used", [])
    
    # Extract tool calls from run metadata
    actual_tools = []
    if "tool_calls" in run.outputs:
        actual_tools = run.outputs["tool_calls"]
    
    # Check if all expected tools were called
    tools_present = all(tool in actual_tools for tool in expected_tools)
    
    # Check order if specified
    expected_order = example.outputs.get("tool_order", [])
    correct_order = True
    if expected_order:
        try:
            indices = [actual_tools.index(t) for t in expected_order]
            correct_order = indices == sorted(indices)
        except ValueError:
            correct_order = False
    
    if expected_order:
        score = 1.0 if (tools_present and correct_order) else 0.5 if tools_present else 0.0
    else:
        score = 1.0 if tools_present else 0.0
    
    return {
        "key": "tool_trajectory",
        "score": score,
        "comment": f"Tools present: {tools_present}, Order correct: {correct_order}"
    }


def interrupt_detection_evaluator(run, example) -> Dict[str, Any]:
    """Check if interrupt was triggered when expected."""
    expected_interrupt = example.outputs.get("has_interrupt", False)
    actual_interrupt = "__interrupt__" in run.outputs
    
    match = expected_interrupt == actual_interrupt
    
    return {
        "key": "interrupt_detection",
        "score": 1.0 if match else 0.0,
        "comment": f"Expected interrupt: {expected_interrupt}, Got: {actual_interrupt}"
    }


def llm_judge_quality_evaluator(run, example) -> Dict[str, Any]:
    """Use LLM to judge overall response quality."""
    from langchain_openai import ChatOpenAI
    from langchain_core.prompts import PromptTemplate
    
    judge = ChatOpenAI(model="gpt-4o-mini", temperature=0)
    
    prompt = PromptTemplate.from_template("""
    Evaluate this AI agent's response on a scale of 1-5:
    
    User Query: {query}
    Agent Response: {response}
    
    Criteria:
    1. Relevance - Does it address the query?
    2. Accuracy - Is the information correct?
    3. Completeness - Is it thorough?
    4. Clarity - Is it well-written?
    
    Provide ONLY a number from 1 to 5, where:
    1 = Poor, 2 = Below Average, 3 = Average, 4 = Good, 5 = Excellent
    
    Score:""")
    
    query = example.inputs.get("query", "")
    response = run.outputs.get("final_response", "")
    
    try:
        result = judge.invoke(prompt.format(query=query, response=response))
        score_text = result.content.strip()
        
        # Extract number
        import re
        match = re.search(r'[1-5]', score_text)
        if match:
            score = int(match.group())
            normalized_score = score / 5.0
        else:
            normalized_score = 0.5  # Default if parsing fails
        
        return {
            "key": "llm_judge_quality",
            "score": normalized_score,
            "comment": f"LLM Judge Score: {score}/5"
        }
    except Exception as e:
        return {
            "key": "llm_judge_quality",
            "score": 0.5,
            "comment": f"Evaluation failed: {str(e)}"
        }


def response_length_evaluator(run, example) -> Dict[str, Any]:
    """Check if response meets minimum length requirement."""
    response = run.outputs.get("final_response", "")
    min_length = example.outputs.get("min_length", 0)
    
    if min_length == 0:
        return {"key": "response_length", "score": 1.0}
    
    actual_length = len(response)
    meets_requirement = actual_length >= min_length
    
    return {
        "key": "response_length",
        "score": 1.0 if meets_requirement else 0.0,
        "comment": f"Length: {actual_length} (min: {min_length})"
    }


# Collect all evaluators
ALL_EVALUATORS = [
    routing_accuracy_evaluator,
    response_quality_evaluator,
    exact_answer_evaluator,
    tool_trajectory_evaluator,
    interrupt_detection_evaluator,
    response_length_evaluator,
]

# LLM judge is optional (costs money)
LLM_JUDGE_EVALUATORS = [
    llm_judge_quality_evaluator,
]


def run_evaluation(graph, dataset_name: str, use_llm_judge: bool = False):
    """
    Run full evaluation suite.
    
    Usage:
        from capstone.evals.evaluators import run_evaluation
        from capstone.python.graph import create_graph
        
        graph = create_graph()
        results = run_evaluation(graph, "research-assistant-test-suite")
    """
    from langsmith.evaluation import evaluate
    
    evaluators = ALL_EVALUATORS.copy()
    if use_llm_judge:
        evaluators.extend(LLM_JUDGE_EVALUATORS)
    
    def run_graph(inputs):
        """Wrapper to run graph with proper config."""
        config = {
            "configurable": {"thread_id": f"eval-{inputs.get('user_id', 'default')}"}
        }
        return graph.invoke(inputs, config)
    
    results = evaluate(
        run_graph,
        data=dataset_name,
        evaluators=evaluators,
        experiment_prefix="research-assistant"
    )
    
    return results


if __name__ == "__main__":
    # Example: Run evaluation
    from capstone.python.graph import create_graph
    
    print("Running evaluation suite...")
    graph = create_graph()
    results = run_evaluation(graph, "research-assistant-test-suite")
    
    print(f"\nResults: {results}")
