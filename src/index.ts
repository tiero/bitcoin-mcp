import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ensureDataDirectory, getWalletState, saveWalletState } from './lib/state.js';
import { initializeWallet } from './lib/wallet.js';
import { tools } from './tools/index.js';

// Ensure data directory exists
ensureDataDirectory();

// Get current wallet state
const walletState = getWalletState();

// Initialize MCP server with tools
const server = new McpServer({
  name: "Bitcoin MCP",
  version: "0.0.1",
  transport: new StdioServerTransport(),
  tools: tools // Use unified tools from tools/index.js
});

// Start the server
server.connect(new StdioServerTransport()).catch((error: Error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});