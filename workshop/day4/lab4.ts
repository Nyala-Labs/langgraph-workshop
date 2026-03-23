import * as path from "path";
import * as dotenv from "dotenv";
import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { ChatMistralAI } from "@langchain/mistralai";

// Load repo-root .env regardless of shell cwd (e.g. running from workshop/day4)
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function mistralChat() {
  return new ChatMistralAI({
    model: "mistral-small-latest",
    apiKey: process.env.MISTRAL_API_KEY,
  });
}

const State = Annotation.Root({
  task: Annotation<string>(),
  messages: Annotation<Array<{ agent: string; content: string }>>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  nextAgent: Annotation<string>(),
  finalAnswer: Annotation<string>(),
});

type SupervisorRoute = "research" | "code" | "math" | "finish";

function supervisorNode(_state: typeof State.State) {
  return {};
}

async function researchAgent(state: typeof State.State) {
  const model = mistralChat();
  const prompt = `Research this: ${state.task}`;
  const response = await model.invoke([{ role: "user", content: prompt }]);
  return {
    messages: [{ agent: "research", content: response.content as string }],
  };
}

async function codeAgent(state: typeof State.State) {
  const model = mistralChat();
  const prompt = `Write code for: ${state.task}`;
  const response = await model.invoke([{ role: "user", content: prompt }]);
  return {
    messages: [{ agent: "code", content: response.content as string }],
  };
}

async function mathAgent(state: typeof State.State) {
  const model = mistralChat();
  const prompt = `Solve this math: ${state.task}`;
  const response = await model.invoke([{ role: "user", content: prompt }]);
  return {
    messages: [{ agent: "math", content: response.content as string }],
  };
}

function supervisorRoute(state: typeof State.State): SupervisorRoute {
  const taskLower = state.task.toLowerCase();

  if (["search", "find", "research"].some((word) => taskLower.includes(word))) {
    return "research";
  }
  if (["code", "program", "implement"].some((word) => taskLower.includes(word))) {
    return "code";
  }
  if (["calculate", "math", "solve"].some((word) => taskLower.includes(word))) {
    return "math";
  }
  return "finish";
}

function synthesizeNode(state: typeof State.State) {
  const combined = state.messages.map((m) => m.content).join("\n\n");
  return { finalAnswer: combined };
}

const graph = new StateGraph(State)
  .addNode("supervisor", supervisorNode)
  .addNode("research", researchAgent)
  .addNode("code", codeAgent)
  .addNode("math", mathAgent)
  .addNode("synthesize", synthesizeNode)
  .addEdge(START, "supervisor")
  .addConditionalEdges("supervisor", supervisorRoute, {
    research: "research",
    code: "code",
    math: "math",
    finish: "synthesize",
  })
  .addEdge("research", "synthesize")
  .addEdge("code", "synthesize")
  .addEdge("math", "synthesize")
  .addEdge("synthesize", END)
  .compile();

(async () => {
  const result = await graph.invoke({
    task: "Research the history of pizza",
    messages: [],
    nextAgent: "",
    finalAnswer: "",
  });
  console.log(result.finalAnswer);
})();