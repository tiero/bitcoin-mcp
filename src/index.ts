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

// Register bitcoin wallet status resource
server.resource(
  "status",
  "bitcoin://wallet/status",
  async (uri) => {
    const walletState = getWalletState();
    const keyData = loadKeyFromDisk();

    const status = {
      initialized: walletState.initialized,
      network: walletState.network,
      createdAt: walletState.createdAt,
      lastAccessed: walletState.lastAccessed,
      hasKey: !!keyData
    };

    return {
      contents: [{
        uri: uri.href,
        text: "Bitcoin Wallet Status:\n\n" +
              "**Initialization**\n" +
              "```\n" +
              `Initialized: ${status.initialized}\n` +
              `Network: ${status.network}\n` +
              `Created: ${new Date(status.createdAt).toLocaleString()}\n` +
              (status.lastAccessed ? 
                `Last Accessed: ${new Date(status.lastAccessed).toLocaleString()}\n` : 
                '') +
              `Has Private Key: ${status.hasKey}\n` +
              "```",
        mimeType: "text/markdown"
      }]
    };
  }
);

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
        text: "Here are your Bitcoin wallet addresses for receiving cryptocurrency:\n\n" +
              "**Onchain Address**\n" +
              "```\n" +
              addresses.onchain +
              "\n```\n\n" +
              "**Offchain Address**\n" +
              "```\n" +
              addresses.offchain +
              "\n```",
        mimeType: "text/markdown"
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