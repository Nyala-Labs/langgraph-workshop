import { StateGraph, START, END, Annotation } from "@langchain/langgraph";

const State = Annotation.Root({
  messages: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  counter: Annotation<number>(),
});

function node1(state: typeof State.State) {
  return { messages: ["msg1"], counter: 1 };
}

function node2(state: typeof State.State) {
  return { messages: ["msg2"], counter: 2 };
}

const graph = new StateGraph(State)
  .addNode("node1", node1)
  .addNode("node2", node2)
  .addEdge(START, "node1")
  .addEdge("node1", "node2")
  .addEdge("node2", END)
  .compile();

(async () => {
  const result = await graph.invoke({ messages: [], counter: 0 });
  console.log(result.messages); // ['msg1', 'msg2']
  console.log(result.counter);  // 2
})();
