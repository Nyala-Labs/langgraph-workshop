import { StateGraph, START, END, Annotation } from "@langchain/langgraph";

const State = Annotation.Root({
  messages: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  current_tool: Annotation<string>(),
});

// Stub nodes — replace with real implementations later
function routerNode(state: typeof State.State) {
  const query = state.messages.at(-1) ?? "";
  if (query.includes("calculate")) return { current_tool: "calculator" };
  if (query.includes("file")) return { current_tool: "file_lookup" };
  return { current_tool: "search" };
}

function searchTool(state: typeof State.State) {
  return { messages: [`[search result for: ${state.messages.at(-1)}]`] }; // reducer concats this array of 1 element to existing array for messages
}

function synthesize(state: typeof State.State) {
  return { messages: [`Synthesized: ${state.messages.join(" | ")}`] };
}

function routerEdge(state: typeof State.State): string {
  return state.current_tool; // "search" | "calculator" | "file_lookup"
}

const graph = new StateGraph(State)
  .addNode("router", routerNode)
  .addNode("search", searchTool)
  .addNode("calculator", searchTool)   // stub — replace with real calculator
  .addNode("file_lookup", searchTool)  // stub — replace with real file lookup
  .addNode("synthesize", synthesize)
  .addEdge(START, "router")
  .addConditionalEdges("router", routerEdge, {
    search: "search",
    calculator: "calculator",
    file_lookup: "file_lookup",
  })
  .addEdge("search", "synthesize")
  .addEdge("calculator", "synthesize")
  .addEdge("file_lookup", "synthesize")
  .addEdge("synthesize", END)
  .compile();

(async () => {
  const result = await graph.invoke({ messages: ["calculate 2 + 2"], current_tool: "" });
  console.log(result.messages);
})();