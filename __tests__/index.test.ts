import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

describe('MCP Server', () => {
  let server: McpServer;
  let addHandler: (params: {a: number, b: number}) => Promise<any>;
  
  beforeEach(() => {
    // Initialize the server before each test
    server = new McpServer({
      name: "Ark Wallet MPC",
      version: "0.0.1",
    });
    
    // Store the handler function directly when defining the tool
    addHandler = async ({ a, b }) => ({
      content: [{ type: "text", text: `The sum is ${a + b}` }],
    });
    
    // Define the addition tool
    server.tool(
      "add",
      { a: z.number(), b: z.number() },
      addHandler
    );
  });
  
  afterEach(() => {
    // Clean up after each test
    vi.restoreAllMocks();
  });
  
  it('should correctly add two numbers', async () => {
    // Call the handler directly
    const result = await addHandler({ a: 5, b: 7 });
    
    // Verify the result
    expect(result).toEqual({
      content: [{ type: "text", text: "The sum is 12" }]
    });
  });
  
  it('should handle negative numbers', async () => {
    const result = await addHandler({ a: -3, b: 10 });
    
    expect(result).toEqual({
      content: [{ type: "text", text: "The sum is 7" }]
    });
  });
  
  it('should handle decimal numbers', async () => {
    const result = await addHandler({ a: 2.5, b: 3.5 });
    
    expect(result).toEqual({
      content: [{ type: "text", text: "The sum is 6" }]
    });
  });
}); 