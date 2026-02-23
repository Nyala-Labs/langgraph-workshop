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