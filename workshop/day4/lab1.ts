import { InMemoryStore } from "@langchain/langgraph-checkpoint"; 
import { v4 as uuidv4 } from "uuid"; 

const store = new InMemoryStore(); 
const userId = "user-123"; 
const namespace: string[] = [userId, "memories"]; 
const memoryId = uuidv4(); 
// this is one memory
const memory = { preference: "likes Python", context: "mentioned in chat" }; 

// Wrap everything in a single async IIFE
// No need to pass arguments, we can access the variables from the outer scope directly
(async () => {
    // 1. Put the memory in the store
    await store.put(namespace, memoryId, memory);

    // 2. Search for the memories AND assign the awaited result to the variable
    const memories = await store.search(namespace);

    // 3. Log the results
    console.log(`Found ${memories.length} memories`); 
    console.log(memories[0].value);
})();