/**
 * Verification script for TypeScript track setup.
 * Run this before Day 1 to ensure your environment is ready.
 */

import * as dotenv from 'dotenv';
import { StateGraph, START, END, StateSchema } from "@langchain/langgraph";
import { MemorySaver } from "@langchain/langgraph-checkpoint";
import { z } from "zod";

dotenv.config();

// interface is a structure that defines the properties of a type.
interface CheckResult {
  name: string;
  success: boolean;
  message: string;
}

// Promise is a type that represents the result of a asynchronous operation.
// the <> after Promise is a type parameter that specifies the type of the result of the asynchronous operation.
async function checkNodeVersion(): Promise<CheckResult> {
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0]);
  
  if (major >= 18) {
    return {
      name: "Node Version",
      success: true,
      message: `✓ Node ${version}`
    };
  }
  return {
    name: "Node Version",
    success: false,
    message: `✗ Node ${version} (need 18+)`
  };
}

async function checkImports(): Promise<CheckResult> {
  try {
    // Already imported at top
    return {
      name: "Package Installation",
      success: true,
      message: "✓ LangGraph packages installed"
    };
  } catch (error: any) {
    return {
      name: "Package Installation",
      success: false,
      message: `✗ Missing packages: ${error.message}`
    };
  }
}

async function checkApiKeys(): Promise<CheckResult> {
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  
  if (openaiKey || anthropicKey) {
    const providers = [];
    if (openaiKey) providers.push("OpenAI");
    if (anthropicKey) providers.push("Anthropic");
    return {
      name: "API Keys",
      success: true,
      message: `✓ API keys configured: ${providers.join(', ')}`
    };
  }
  return {
    name: "API Keys",
    success: false,
    message: "✗ No API keys found in .env"
  };
}

async function checkLangSmith(): Promise<CheckResult> {
  const langsmithKey = process.env.LANGSMITH_API_KEY;
  
  if (langsmithKey) {
    return {
      name: "LangSmith Config",
      success: true,
      message: "✓ LangSmith configured"
    };
  }
  return {
    name: "LangSmith Config",
    success: false,
    message: "⚠ LangSmith not configured (optional for Day 1-4)"
  };
}

async function testSimpleGraph(): Promise<CheckResult> {
  try {
    const State = new StateSchema({
      value: z.number(),
    });
    
    function node(state: typeof State.State) {
      return { value: state.value + 1 };
    }
    
    const workflow = new StateGraph(State)
      .addNode("test", node)
      .addEdge(START, "test")
      .addEdge("test", END);
    
    const graph = workflow.compile();
    const result = await graph.invoke({ value: 0 });
    
    if (result.value === 1) {
      return {
        name: "Simple Graph",
        success: true,
        message: "✓ Simple graph execution: SUCCESS"
      };
    }
    return {
      name: "Simple Graph",
      success: false,
      message: "✗ Graph returned unexpected result"
    };
  } catch (error: any) {
    return {
      name: "Simple Graph",
      success: false,
      message: `✗ Graph execution failed: ${error.message}`
    };
  }
}

async function testCheckpointer(): Promise<CheckResult> {
  try {
    const State = new StateSchema({
      count: z.number(),
    });
    
    function increment(state: typeof State.State) {
      return { count: state.count + 1 };
    }
    
    const checkpointer = new MemorySaver();
    const workflow = new StateGraph(State)
      .addNode("inc", increment)
      .addEdge(START, "inc")
      .addEdge("inc", END);
    
    const graph = workflow.compile({ checkpointer });
    
    const config = { configurable: { thread_id: "test" } };
    await graph.invoke({ count: 0 }, config);
    const result2 = await graph.invoke({ count: 0 }, config);
    
    if (result2.count === 2) {
      return {
        name: "Checkpointer",
        success: true,
        message: "✓ Checkpointer working: SUCCESS"
      };
    }
    return {
      name: "Checkpointer",
      success: false,
      message: "✗ Checkpointer not persisting state"
    };
  } catch (error: any) {
    return {
      name: "Checkpointer",
      success: false,
      message: `✗ Checkpointer test failed: ${error.message}`
    };
  }
}

async function testLlmConnection(): Promise<CheckResult> {
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  
  if (!openaiKey && !anthropicKey) {
    return {
      name: "LLM Connection",
      success: false,
      message: "⚠ Skip LLM test (no API keys)"
    };
  }
  
  try {
    if (openaiKey) {
      const { ChatOpenAI } = await import("@langchain/openai");
      const model = new ChatOpenAI({ model: "gpt-4o-mini" });
      const response = await model.invoke([{ role: "user", content: "Hi" }]);
      if (response.content) {
        return {
          name: "LLM Connection",
          success: true,
          message: "✓ OpenAI API connection: SUCCESS"
        };
      }
    } else if (anthropicKey) {
      const { ChatAnthropic } = await import("@langchain/anthropic");
      const model = new ChatAnthropic({ model: "claude-3-5-haiku-20241022" });
      const response = await model.invoke([{ role: "user", content: "Hi" }]);
      if (response.content) {
        return {
          name: "LLM Connection",
          success: true,
          message: "✓ Anthropic API connection: SUCCESS"
        };
      }
    }
  } catch (error: any) {
    return {
      name: "LLM Connection",
      success: false,
      message: `⚠ LLM API test failed: ${error.message}`
    };
  }
  
  return {
    name: "LLM Connection",
    success: false,
    message: "⚠ LLM test inconclusive"
  };
}

async function main() {
  console.log("=".repeat(60));
  console.log("LangGraph Workshop - TypeScript Setup Verification");
  console.log("=".repeat(60));
  console.log();
  
  const checks = [
    checkNodeVersion,
    checkImports,
    checkApiKeys,
    checkLangSmith,
    testSimpleGraph,
    testCheckpointer,
    testLlmConnection,
  ];
  
  const results: CheckResult[] = [];
  
  for (const checkFn of checks) {
    const result = await checkFn();
    process.stdout.write(`Checking ${result.name}... `); // write to the console without a new line
    console.log(result.message);
    results.push(result);
  }
  
  console.log();
  console.log("=".repeat(60));
  
  const failed = results.filter(r => !r.success && !r.message.startsWith("⚠"));
  const warnings = results.filter(r => r.message.startsWith("⚠"));
  
  if (failed.length > 0) {
    console.log(`❌ ${failed.length} check(s) failed:`);
    failed.forEach(r => {
      console.log(`   - ${r.name}: ${r.message}`);
    });
    console.log();
    console.log("Please fix the issues above before starting the workshop.");
    console.log("See SETUP.md for detailed instructions.");
    process.exit(1);
  } else if (warnings.length > 0) {
    console.log(`⚠️  ${warnings.length} warning(s):`);
    warnings.forEach(r => {
      console.log(`   - ${r.name}: ${r.message}`);
    });
    console.log();
    console.log("You can proceed, but some features may not work.");
    console.log("All checks will be required by Day 5.");
  } else {
    console.log("✅ All checks passed! You're ready to start.");
  }
  
  console.log("=".repeat(60));
}

main().catch(console.error);
