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
  // Run a 5-turn conversation
  for (let i = 1; i <= 5; i++) {
    await graph.invoke({ messages: [`Message ${i}`], count: 0 }, config);
  }

  // Get full history for the thread (reverse chronological order - newest first)
  const history: any[] = [];
  for await (const snapshot of graph.getStateHistory(config)) {
    history.push(snapshot);
  }

  console.log(`Total checkpoints: ${history.length}`);
  history.forEach((snapshot, i) => {
    console.log(
      `Checkpoint ${i}: step=${snapshot.metadata?.step ?? "?"}, next=${JSON.stringify(snapshot.next)}`
    );
  });

  // Get state at checkpoint 3 (third most recent)
  if (history.length >= 3) {
    const checkpoint3 = history[2];
    const checkpointId = checkpoint3.config?.configurable?.checkpoint_id;
    console.log("\nState at checkpoint 3:", checkpoint3.values);
  }
})();
