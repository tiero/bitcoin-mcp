import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Initialize the Ark Wallet MCP server
const server = new McpServer({
  name: "Ark Wallet MPC",
  version: "0.0.1",
});

// Define the addition tool
server.tool(
  "add",
  { a: z.number(), b: z.number() },
  async ({ a, b }) => ({
    content: [{ type: "text", text: `The sum is ${a + b}` }],
  })
);

// Set up the transport
const transport = new StdioServerTransport();
await server.connect(transport);