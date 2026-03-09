import * as dotenv from "dotenv";
import * as readline from "readline";
import { StateGraph, START, END, Annotation } from "@langchain/langgraph";

dotenv.config();
import { MemorySaver } from "@langchain/langgraph-checkpoint";
import { ChatOpenAI } from "@langchain/openai";

const State = Annotation.Root({
  messages: Annotation<Array<{ role: string; content: string }>>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
});

async function callModel(state: typeof State.State) {
  const model = new ChatOpenAI({ model: "gpt-4o-mini" });
  const response = await model.invoke(state.messages);
  return {
    messages: [{ role: "assistant", content: response.content as string }],
  };
}

const checkpointer = new MemorySaver();
const graph = new StateGraph(State)
  .addNode("model", callModel)
  .addEdge(START, "model")
  .addEdge("model", END)
  .compile({ checkpointer });

const config = { configurable: { thread_id: "user-123" } };

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const question = (prompt: string) =>
    new Promise<string>((resolve) => rl.question(prompt, resolve));

  console.log("Type 'quit' or 'exit' to end.\n");

  while (true) {
    const userInput = await question("You: ");
    if (["quit", "exit"].includes(userInput.toLowerCase().trim())) {
      break;
    }

    const state = { messages: [{ role: "user", content: userInput }] };
    const result = await graph.invoke(state, config);
    const assistantMsg = result.messages[result.messages.length - 1]?.content ?? "";
    console.log(`Assistant: ${assistantMsg}\n`);
  }

  rl.close();
}

main().catch(console.error);
