import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ensureDataDirectory, getWalletState } from './lib/state.js';
import { registerTools } from './tools/index.js';
import { initializeWallet, loadKeyFromDisk } from './lib/wallet.js';

// Ensure data directory exists
ensureDataDirectory();

// Initialize MCP server
const server = new McpServer({
  name: "Bitcoin MCP",
  version: "0.0.1"
});

// Register bitcoin addresses resource
server.resource(
  "address",
  "bitcoin://address",
  async (uri) => {
    const keyData = loadKeyFromDisk();
    const walletState = getWalletState();
    
    if (!keyData || !walletState.initialized) {
      throw new Error("Wallet not initialized");
    }
    
    const wallet = await initializeWallet(walletState.network);
    const addresses = await wallet.getAddress();
    
    return {
      contents: [{
        uri: uri.href,
        text: JSON.stringify(addresses, null, 2),
        mimeType: "application/json"
      }]
    };
  }
);

// Register all tools
registerTools(server);

// Start the server
server.connect(new StdioServerTransport()).catch((error: Error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});