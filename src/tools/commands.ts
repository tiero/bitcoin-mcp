import { getWalletState, saveWalletState } from '../lib/state.js';
import { initializeWallet, loadKeyFromDisk, saveKeyToDisk, generateNewKey, type KeyData } from '../lib/wallet.js';
import { getBalance } from './balance.js';
import { setupWalletSchema, getWalletStatusSchema, getAddressesSchema, getBalanceSchema } from './schemas.js';
import { McpResponse } from '../lib/types.js';

// Tool definitions
export const setupWalletTool = {
  name: "setup_wallet",
  schema: setupWalletSchema,
  handler: async (params: unknown) => {
    const { action, privateKey, network, arkServerUrl, esploraUrl } = setupWalletSchema.parse(params);
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
      const walletState = {
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
};

export const getWalletStatusTool = {
  name: "get_wallet_status",
  schema: getWalletStatusSchema,
  handler: async () => {
    const keyData = loadKeyFromDisk();
    const walletState = getWalletState();
    
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
};

export const getAddressesTool = {
  name: "get_addresses",
  schema: getAddressesSchema,
  handler: async () => {
    const keyData = loadKeyFromDisk();
    const walletState = getWalletState();
    
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
          text: `Error getting addresses: ${error instanceof Error ? error.message : String(error)}` 
        }],
      };
    }
  }
};

export const getBalanceTool = {
  name: "get_balance",
  schema: getBalanceSchema,
  handler: async () => {
    const keyData = loadKeyFromDisk();
    const walletState = getWalletState();
    
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
      const balance = await getBalance(wallet);
      
      return {
        content: [{ 
          type: "text", 
          text: `Balance:\n\n` +
                `Onchain: ${balance.onchain} sats\n` +
                `Offchain: ${balance.offchain} sats\n` +
                `Total: ${balance.total} sats\n` +
                (balance.fiat ? `Fiat Value: $${balance.fiat.usd} USD\n` : '') +
                (balance.fiat ? `Price Updated: ${new Date(balance.fiat.timestamp).toLocaleString()}\n` : '')
        }],
      };
    } catch (error) {
      return {
        content: [{ 
          type: "text", 
          text: `Error getting balance: ${error instanceof Error ? error.message : String(error)}` 
        }],
      };
    }
  }
};
