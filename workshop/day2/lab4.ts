import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";

const State = Annotation.Root({
  steps: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  counter: Annotation<number>(),
});

function nodeA(state: typeof State.State) {
  console.log("Node A executing");
  return { steps: ["A"], counter: state.counter + 1 };
}

function nodeB(state: typeof State.State) {
  console.log("Node B executing");
  if (state.counter === 1) {
    throw new Error("Node B failed!");
  }
  return { steps: ["B"], counter: state.counter + 1 };
}

function nodeC(state: typeof State.State) {
  console.log("Node C executing");
  return { steps: ["C"], counter: state.counter + 1 };
}

const checkpointer = SqliteSaver.fromConnString("recovery.db");
const graph = new StateGraph(State)
  .addNode("a", nodeA)
  .addNode("b", nodeB)
  .addNode("c", nodeC)
  .addEdge(START, "a")
  .addEdge("a", "b")
  .addEdge("b", "c")
  .addEdge("c", END)
  .compile({ checkpointer });

const config = { configurable: { thread_id: "recovery-test" } };

(async () => {
  try {
    await graph.invoke({ steps: [], counter: 0 }, config);
  } catch (e: any) {
    console.log("Failed:", e.message);
  }

  // Check state - should have checkpoint AFTER node A
  const snapshot = await graph.getState(config);
  console.log("State after failure:", snapshot.values);
  console.log("Next nodes:", snapshot.next); // Should show 'b' ready to retry

  // Fix: update state to skip the failure condition
  await graph.updateState(config, { counter: 2 });

  // Resume - will continue from node B
  const result = await graph.invoke(null as any, config);
  console.log("Recovered result:", result);
})();
