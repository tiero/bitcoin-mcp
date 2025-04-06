import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ensureDataDirectory } from './lib/state.js';
import { registerTools } from './tools/index.js';

// Ensure data directory exists
ensureDataDirectory();

// Initialize MCP server
const server = new McpServer({
  name: "Bitcoin MCP",
  version: "0.0.1",
  tools: [] // Tools will be registered after server creation
});

// Register all tools
registerTools(server);

// Start the server
server.connect(new StdioServerTransport()).catch((error: Error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});