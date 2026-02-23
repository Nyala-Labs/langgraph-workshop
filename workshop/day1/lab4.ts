import { StateGraph, START, END, Annotation } from "@langchain/langgraph";

const State = Annotation.Root({
  number: Annotation<number>(),
  path: Annotation<string>(),
});

function startNode(state: typeof State.State) {
  return { number: state.number, path: "start" };
}

function evenNode(_state: typeof State.State) {
  return { path: "even" };
}

function oddNode(_state: typeof State.State) {
  return { path: "odd" };
}

function router(state: typeof State.State): string {
  return state.number % 2 === 0 ? "even" : "odd";
}

const graph = new StateGraph(State)
  .addNode("start", startNode)
  .addNode("even", evenNode)
  .addNode("odd", oddNode)
  .addEdge(START, "start")
  .addConditionalEdges("start", router, { even: "even", odd: "odd" })
  .addEdge("even", END)
  .addEdge("odd", END)
  .compile();

(async () => {
  // Stream mode: "values" returns full state after each node
  console.log("--- streamMode: values ---");
  for await (const chunk of await graph.stream(
    { number: 5, path: "" },
    { streamMode: "values" }
  )) {
    console.log(chunk);
  }

  // Stream mode: "updates" returns only the node's output delta
  console.log("--- streamMode: updates ---");
  for await (const chunk of await graph.stream(
    { number: 5, path: "" },
    { streamMode: "updates" }
  )) {
    console.log(chunk);
  }
})();
