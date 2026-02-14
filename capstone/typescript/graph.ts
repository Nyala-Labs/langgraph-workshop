/**
 * Research Assistant Agent - Main Graph Implementation
 * This is a starter template. Complete it during the workshop!
 */

import * as dotenv from 'dotenv';
import { StateGraph, START, END, StateSchema, ReducedValue, interrupt, Command } from "@langchain/langgraph";
import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";
import { MemoryStore } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import * as readline from 'readline';

dotenv.config();

// ============================================================================
// STATE DEFINITION
// ============================================================================

const AgentState = new StateSchema({
  messages: new ReducedValue(
    z.array(z.record(z.any())).default([]),
    {
      inputSchema: z.array(z.record(z.any())),
      reducer: (x, y) => x.concat(y),
    }
  ),
  userId: z.string(),
  currentAgent: z.enum(["web_search", "data_analysis", "report_writer", "none"]),
  searchResults: z.array(z.record(z.any())).default([]),
  analysisOutput: z.string().default(""),
  finalResponse: z.string().default(""),
  iterationCount: z.number().default(0),
});

type State = typeof AgentState.State;

// ============================================================================
// NODES - Day 1: Basic stubs
// ============================================================================

function supervisorRouter(state: State): Partial<State> {
  /**
   * Day 1: Basic router using keywords
   * Day 4: Upgrade to LLM-based routing
   */
  // TODO Day 1: Implement keyword-based routing
  // TODO Day 4: Replace with LLM-based decision
  
  const query = (state.messages[state.messages.length - 1]?.content || "").toLowerCase();
  
  let agent: "web_search" | "data_analysis" | "report_writer";
  
  if (["search", "find", "research", "web"].some(word => query.includes(word))) {
    agent = "web_search";
  } else if (["calculate", "analyze", "compute", "data"].some(word => query.includes(word))) {
    agent = "data_analysis";
  } else if (["write", "summarize", "report", "document"].some(word => query.includes(word))) {
    agent = "report_writer";
  } else {
    agent = "web_search"; // Default
  }
  
  return { currentAgent: agent };
}

async function webSearchAgent(state: State, runtime: any): Promise<Partial<State>> {
  /**
   * Day 1: Stub returning mock results
   * Day 3: Add approval gate with interrupt()
   * Day 4: Implement real search + use memory store
   */
  // TODO Day 1: Return mock search results
  // TODO Day 3: Add interrupt() for approval
  // TODO Day 4: Check user preferences from store
  
  const query = state.messages[state.messages.length - 1]?.content || "";
  
  // Day 1: Mock results
  const mockResults = [
    { title: "Result 1", content: `Mock content for: ${query}` },
    { title: "Result 2", content: `More mock content for: ${query}` },
  ];
  
  return {
    searchResults: mockResults,
    messages: [{ role: "assistant", content: `Found ${mockResults.length} results` }]
  };
}

function dataAnalysisAgent(state: State): Partial<State> {
  /**
   * Day 1: Stub returning mock analysis
   * Day 4: Implement real analysis
   */
  // TODO Day 1: Return mock analysis
  // TODO Day 4: Implement real calculation/analysis
  
  return {
    analysisOutput: "Mock analysis: This is a placeholder.",
    messages: [{ role: "assistant", content: "Analysis complete (mock)." }]
  };
}

async function reportWriterAgent(state: State, runtime: any): Promise<Partial<State>> {
  /**
   * Day 1: Stub returning basic response
   * Day 4: Synthesize from search + analysis + use memory for tone
   */
  // TODO Day 1: Return basic response
  // TODO Day 4: Synthesize information + apply user preferences
  
  const query = state.messages[0]?.content || "";
  
  return {
    finalResponse: `This is a mock report for: ${query}`,
    messages: [{ role: "assistant", content: `Report complete for: ${query}` }]
  };
}

// ============================================================================
// GRAPH CONSTRUCTION - Day 1
// ============================================================================

async function createGraph() {
  /**
   * Build and compile the graph.
   */
  
  const workflow = new StateGraph(AgentState)
    .addNode("supervisor", supervisorRouter)
    .addNode("webSearch", webSearchAgent)
    .addNode("dataAnalysis", dataAnalysisAgent)
    .addNode("reportWriter", reportWriterAgent);
  
  // Day 1: Basic routing
  workflow.addEdge(START, "supervisor");
  
  // Conditional routing based on currentAgent
  function routeToAgent(state: State): string {
    if (state.currentAgent === "web_search") return "webSearch";
    if (state.currentAgent === "data_analysis") return "dataAnalysis";
    if (state.currentAgent === "report_writer") return "reportWriter";
    return "webSearch"; // Default
  }
  
  workflow.addConditionalEdges(
    "supervisor",
    routeToAgent,
    {
      webSearch: "webSearch",
      dataAnalysis: "dataAnalysis",
      reportWriter: "reportWriter",
    }
  );
  
  // All agents go to END for now
  // TODO Day 4: Add synthesizer node
  workflow.addEdge("webSearch", END);
  workflow.addEdge("dataAnalysis", END);
  workflow.addEdge("reportWriter", END);
  
  // Day 2: Add checkpointer
  // TODO: Test with SqliteSaver
  const checkpointer = SqliteSaver.fromConnString("checkpoints.db");
  
  // Day 4: Add store
  // TODO: Configure with embeddings for semantic search
  const memoryStore = new MemoryStore();
  
  return workflow.compile({ checkpointer, store: memoryStore });
}

// ============================================================================
// MAIN / CLI INTERFACE
// ============================================================================

async function main() {
  /**
   * Run the agent in CLI mode.
   */
  const graph = await createGraph();
  
  console.log("=".repeat(60));
  console.log("Research Assistant Agent");
  console.log("=".repeat(60));
  console.log("Commands: 'quit' to exit, 'new' for new conversation");
  console.log();
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const question = (prompt: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(prompt, resolve);
    });
  };
  
  let userId = await question("Enter your user ID (or press Enter for 'user-1'): ");
  userId = userId.trim() || "user-1";
  
  let conversationNum = 1;
  let threadId = `thread-${userId}-${conversationNum}`;
  
  while (true) {
    console.log();
    const userInput = await question("You: ");
    const trimmed = userInput.trim();
    
    if (["quit", "exit", "q"].includes(trimmed.toLowerCase())) {
      console.log("Goodbye!");
      rl.close();
      break;
    }
    
    if (trimmed.toLowerCase() === "new") {
      conversationNum++;
      threadId = `thread-${userId}-${conversationNum}`;
      console.log(`Started new conversation: ${threadId}`);
      continue;
    }
    
    if (!trimmed) continue;
    
    const config = {
      configurable: { thread_id: threadId },
      context: { userId }
    };
    
    try {
      let result = await graph.invoke(
        {
          messages: [{ role: "user", content: trimmed }],
          userId,
          currentAgent: "none",
          searchResults: [],
          analysisOutput: "",
          finalResponse: "",
          iterationCount: 0,
        },
        config
      );
      
      // Check for interrupts
      if (result.__interrupt__) {
        console.log();
        console.log("🛑 Interrupt:", result.__interrupt__[0].value);
        const approval = await question("Your response: ");
        
        result = await graph.invoke(
          new Command({ resume: approval.trim().toLowerCase() === "yes" }),
          config
        );
      }
      
      // Print response
      if (result.finalResponse) {
        console.log(`\nAssistant: ${result.finalResponse}`);
      } else if (result.messages && result.messages.length > 0) {
        const lastMsg = result.messages[result.messages.length - 1];
        console.log(`\nAssistant: ${lastMsg.content}`);
      }
    } catch (error: any) {
      console.log(`\n❌ Error: ${error.message}`);
    }
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { createGraph, AgentState };
