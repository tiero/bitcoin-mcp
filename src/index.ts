import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ensureDataDirectory, getWalletState, saveWalletState } from './lib/state.js';
import { initializeWallet, loadKeyFromDisk } from './lib/wallet.js';
import { setupWalletTool, getWalletStatusTool, getAddressesTool, getBalanceTool } from './tools/commands.js';
import { z } from "zod";

// Ensure data directory exists
ensureDataDirectory();

// Get current wallet state
let walletState = getWalletState();

// Automatically create wallet if not initialized
if (!walletState.initialized) {
  const wallet = await initializeWallet(walletState.network);
  walletState = {
    initialized: true,
    network: walletState.network,
    createdAt: Date.now(),
    lastAccessed: Date.now(),
  };
  saveWalletState(walletState);
}

// Initialize MCP server
const server = new McpServer({
  name: "Bitcoin MCP",
  version: "0.0.1",
  transport: new StdioServerTransport(),
  tools: [
    setupWalletTool,
    getWalletStatusTool,
    getAddressesTool,
    getBalanceTool,
    {
      name: "send_bitcoin",
      schema: {
        params: z.object({
          address: z.string(),
          amount: z.number().positive(),
          feeRate: z.number().positive().optional()
        })
      },
      handler: async ({ params }: { params: { address: string; amount: number; feeRate?: number } }) => {
        const keyData = loadKeyFromDisk();
        
        if (!keyData || !walletState.initialized) {
          return {
            content: [{ 
              type: "text", 
              text: "No wallet has been initialized yet. Use the setup_wallet tool to create or restore a wallet." 
            }],
          };
        }
        
        try {
          // Update last accessed timestamp
          walletState.lastAccessed = Date.now();
          saveWalletState(walletState);
          
          const wallet = await initializeWallet(walletState.network);
          
          // Send the transaction
          const txid = await wallet.sendBitcoin({
            address: params.address,
            amount: params.amount
          });
          
          return {
            content: [{ 
              type: "text", 
              text: `Transaction sent successfully!\n\n` +
                    `Transaction ID: ${txid}\n` +
                    `Amount: ${params.amount} satoshis\n` +
                    `To: ${params.address}`
            }],
          };
        } catch (error) {
          return {
            content: [{ 
              type: "text", 
              text: `Error sending transaction: ${error instanceof Error ? error.message : String(error)}` 
            }],
          };
        }
      }
    }
  ]
});

// For debugging
console.error("Starting server in directory:", process.cwd());
console.error("Environment:", process.env.NODE_ENV || "development");

// Start the server
server.connect(new StdioServerTransport()).catch((error: Error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});