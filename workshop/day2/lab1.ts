import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { MemorySaver } from "@langchain/langgraph-checkpoint";

const State = Annotation.Root({
  messages: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  count: Annotation<number>(),
});

function chatNode(state: typeof State.State) {
  const userMsg = state.messages[state.messages.length - 1] || "Hello";
  const response = `Echo: ${userMsg}`;
  return { messages: [response], count: state.count + 1 };
}

const checkpointer = new MemorySaver();
const graph = new StateGraph(State)
  .addNode("chat", chatNode)
  .addEdge(START, "chat")
  .addEdge("chat", END)
  .compile({ checkpointer });

const config = { configurable: { thread_id: "conversation-1" } };

(async () => {
  const result1 = await graph.invoke({ messages: ["Hi"], count: 0 }, config);
  console.log("Turn 1:", result1);

  const result2 = await graph.invoke({ messages: ["How are you?"], count: 0 }, config);
  console.log("Turn 2:", result2);
  console.log("Total count:", result2.count); // Persisted!
})();
