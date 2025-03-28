import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { initializeWallet, loadKeyFromDisk, saveKeyToDisk, generateNewKey, type KeyData } from './wallet';
import path from 'path';
import fs from 'fs';

// Define the data directory for storing wallet state
const DATA_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.ark-wallet-mcp');
const WALLET_STATE_PATH = path.join(DATA_DIR, 'wallet-state.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Interface for wallet state
interface WalletState {
  initialized: boolean;
  network: string;
  createdAt: number;
  lastAccessed?: number;
}

// Initialize or load wallet state
function getWalletState(): WalletState {
  if (fs.existsSync(WALLET_STATE_PATH)) {
    try {
      const data = fs.readFileSync(WALLET_STATE_PATH, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading wallet state:', error);
    }
  }
  
  // Default state if not found or error
  return {
    initialized: false,
    network: 'mutinynet',
    createdAt: Date.now()
  };
}

// Save wallet state
function saveWalletState(state: WalletState): void {
  fs.writeFileSync(WALLET_STATE_PATH, JSON.stringify(state, null, 2));
}

// Initialize the Ark Wallet MCP server
const server = new McpServer({
  name: "Ark Wallet MPC",
  version: "0.0.1",
});

// Get current wallet state
let walletState = getWalletState();

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
      
      return {
        content: [{ 
          type: "text", 
          text: `Wallet Addresses:\n\n` +
                `Bitcoin Address: ${addresses.onchain}\n` +
                `Ark Address: ${addresses.offchain}\n` +
                `Boarding Address: ${addresses.boarding}\n` +
                `BIP21 URI: ${addresses.bip21}`
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

// Set up the transport
const transport = new StdioServerTransport();
await server.connect(transport);