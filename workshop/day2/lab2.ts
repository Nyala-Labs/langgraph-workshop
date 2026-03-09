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
  await graph.invoke({ messages: ["Hi"], count: 0 }, config);
  await graph.invoke({ messages: ["How are you?"], count: 0 }, config);

  // Get current state snapshot
  const snapshot = await graph.getState(config);

  console.log("State values:", snapshot.values);
  console.log("Next nodes:", snapshot.next);
  console.log("Metadata:", snapshot.metadata);
  console.log("Config:", snapshot.config);
})();
