import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { initializeWallet, loadKeyFromDisk, saveKeyToDisk, generateNewKey, type KeyData } from './wallet.js';
import { ensureDataDirectory, getWalletState, saveWalletState } from './state.js';
import path from 'path';
import fs from 'fs';

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

// Initialize the Ark Wallet MCP server
const server = new McpServer({
  name: "Bitcoin MPC",
  version: "0.0.1",
});

// Set up a wallet tool that handles both creation and restoration
server.tool(
  "setup_wallet",
  { 
    action: z.enum(["create", "restore"]),
    privateKey: z.string().optional(),
    network: z.enum(["mutinynet", "mainnet", "testnet"]).default("mutinynet"),
    arkServerUrl: z.string().url().optional(),
    esploraUrl: z.string().url().optional()
  },
  async ({ action, privateKey, network, arkServerUrl, esploraUrl }) => {
    try {
      let wallet;
      
      if (action === "restore" && !privateKey) {
        return {
          content: [{ 
            type: "text", 
            text: "Error: When restoring a wallet, you must provide a private key." 
          }],
        };
      }
      
      if (action === "create") {
        // Create a new wallet
        const newPrivateKey = generateNewKey();
        const keyData: KeyData = {
          privateKeyHex: newPrivateKey,
          createdAt: Date.now()
        };
        
        saveKeyToDisk(keyData);

        wallet = await initializeWallet(network);
      } else {
        // Restore from private key
        const keyData: KeyData = {
          privateKeyHex: privateKey as string,
          createdAt: Date.now()
        };
        
        saveKeyToDisk(keyData);
        
        wallet = await initializeWallet(network);
      }
      
      // Update wallet state
      walletState = {
        initialized: true,
        network: network,
        createdAt: Date.now(),
        lastAccessed: Date.now()
      };
      
      saveWalletState(walletState);
      
      const addresses = await wallet.getAddress();
      
      if (action === "create") {
        return {
          content: [{ 
            type: "text", 
            text: `Wallet created successfully!\n\n` +
                  `IMPORTANT: Please securely backup your private key:\n` +
                  `${loadKeyFromDisk()?.privateKeyHex}\n\n` +
                  `Bitcoin Address: ${addresses.onchain}\n` +
                  `Ark Address: ${addresses.offchain}\n` +
                  `Boarding Address: ${addresses.boarding}\n` +
                  `BIP21 URI: ${addresses.bip21}\n\n` +
                  `Network: ${network}\n` +
                  `Electrum Server: ${esploraUrl || "Default"}\n` +
                  `Ark Server: ${arkServerUrl || "Default"}`
          }],
        };
      } else {
        return {
          content: [{ 
            type: "text", 
            text: `Wallet restored successfully!\n\n` +
                  `Bitcoin Address: ${addresses.onchain}\n` +
                  `Ark Address: ${addresses.offchain}\n` +
                  `Boarding Address: ${addresses.boarding}\n` +
                  `BIP21 URI: ${addresses.bip21}\n\n` +
                  `Network: ${network}\n` +
                  `Electrum Server: ${esploraUrl || "Default"}\n` +
                  `Ark Server: ${arkServerUrl || "Default"}`
          }],
        };
      }
    } catch (error) {
      return {
        content: [{ 
          type: "text", 
          text: `Error setting up wallet: ${error instanceof Error ? error.message : String(error)}` 
        }],
      };
    }
  }
);

// Get wallet status tool
server.tool(
  "get_wallet_status",
  {},
  async () => {
    const keyData = loadKeyFromDisk();
    
    if (!keyData || !walletState.initialized) {
      return {
        content: [{ 
          type: "text", 
          text: "No wallet has been initialized yet. Use the setup_wallet tool to create or restore a wallet." 
        }],
      };
    }
    
    return {
      content: [{ 
        type: "text", 
        text: `Wallet is initialized and active.\n` +
              `Network: ${walletState.network}\n` + 
              `Created: ${new Date(keyData.createdAt).toLocaleString()}\n` +
              `Last accessed: ${walletState.lastAccessed ? new Date(walletState.lastAccessed).toLocaleString() : 'Unknown'}`
      }],
    };
  }
);

// Add a tool to show wallet addresses
server.tool(
  "get_addresses",
  {},
  async () => {
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
      const addresses = await wallet.getAddress();
      
      // Fix: Ensure all address values are strings
      const formattedAddresses = {
        onchain: String(addresses.onchain),
        offchain: String(addresses.offchain),
        boarding: String(addresses.boarding),
        bip21: String(addresses.bip21)
      };
      
      return {
        content: [{ 
          type: "text", 
          text: `Wallet Addresses:\n\n` +
                `Bitcoin Address: ${formattedAddresses.onchain}\n` +
                `Ark Address: ${formattedAddresses.offchain}\n` +
                `Boarding Address: ${formattedAddresses.boarding}\n` +
                `BIP21 URI: ${formattedAddresses.bip21}`
        }],
      };
    } catch (error) {
      return {
        content: [{ 
          type: "text", 
          text: `Error retrieving addresses: ${error instanceof Error ? error.message : String(error)}` 
        }],
      };
    }
  }
);

// Add a tool to send Bitcoin
server.tool(
  "send_bitcoin",
  {
    address: z.string(),
    amount: z.number().positive(),
    feeRate: z.number().positive().optional(),
    zeroFee: z.boolean().optional()
  },
  async ({ address, amount, feeRate, zeroFee }) => {
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
      const txid = await wallet.sendBitcoin({ address, amount });
      
      return {
        content: [{ 
          type: "text", 
          text: `Transaction sent successfully!\n\n` +
                `Transaction ID: ${txid}\n` +
                `Amount: ${amount} satoshis\n` +
                `To: ${address}\n` +
                `Fee Rate: ${feeRate ? `${feeRate} sats/vbyte` : 'Default'}\n` +
                `Zero Fee: ${zeroFee ? 'Yes' : 'No'}`
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
);

// For debugging
console.error("Starting server in directory:", process.cwd());

// Keep this clean for MCP communication
const transport = new StdioServerTransport();

// Wrap the await in an async function
async function startServer() {
  await server.connect(transport);
}

// Call the function
startServer().catch(error => {
  console.error("Failed to start server:", error);
  process.exit(1);
});