import { initializeWallet, loadKeyFromDisk } from '../lib/wallet.js';
import { getWalletState, saveWalletState } from '../lib/state.js';
import { getBalance } from './balance.js';
import { McpResponse } from '../lib/types.js';
import { getWalletStatusSchema, getAddressesSchema, getBalanceSchema, sendBitcoinSchema } from './schemas.js';

// Tool handlers
export async function handleGetWalletStatus(): Promise<McpResponse> {
  const keyData = loadKeyFromDisk();
  const walletState = getWalletState();
  
  if (!keyData || !walletState.initialized) {
    return {
      content: [{ 
        type: "text", 
        text: "No wallet has been initialized yet. Use the setup_wallet tool to create or restore a wallet." 
      }],
      tools: [{
        name: "setup_wallet",
        description: "Initialize or restore a wallet"
      }]
    };
  }

  try {
    walletState.lastAccessed = Date.now();
    saveWalletState(walletState);
    
    const wallet = await initializeWallet(walletState.network);
    const addresses = await wallet.getAddress();
    
    return {
      content: [
        { 
          type: "text", 
          text: `Wallet is initialized and active.\n` +
                `Network: ${walletState.network}\n` + 
                `Created: ${new Date(keyData.createdAt).toLocaleString()}\n` +
                `Last accessed: ${walletState.lastAccessed ? new Date(walletState.lastAccessed).toLocaleString() : 'Unknown'}`
        },
        {
          type: "resource",
          resource: {
            uri: `bitcoin://addresses`,
            text: JSON.stringify(addresses, null, 2),
            mimeType: "application/json"
          }
        }
      ],
      tools: [
        {
          name: "get_balance",
          description: "Check wallet balance"
        },
        {
          name: "send_bitcoin",
          description: "Send Bitcoin to an address"
        }
      ]
    };
  } catch (error) {
    return {
      content: [{ 
        type: "text", 
        text: `Error getting wallet status: ${error instanceof Error ? error.message : 'Unknown error'}`
      }],
      tools: [{
        name: "setup_wallet",
        description: "Initialize or restore a wallet"
      }]
    };
  }
}

export async function handleGetAddresses(): Promise<McpResponse> {
  const keyData = loadKeyFromDisk();
  const walletState = getWalletState();
  
  if (!keyData || !walletState.initialized) {
    return {
      content: [{ 
        type: "text", 
        text: "No wallet has been initialized yet. Use the setup_wallet tool to create or restore a wallet." 
      }],
      tools: [{
        name: "setup_wallet",
        description: "Initialize or restore a wallet"
      }]
    };
  }
  
  try {
    walletState.lastAccessed = Date.now();
    saveWalletState(walletState);
    
    const wallet = await initializeWallet(walletState.network);
    const addresses = await wallet.getAddress();

    return {
      content: [
        {
          type: "text",
          text: "Your wallet addresses:"
        },
        {
          type: "code",
          language: "json",
          text: JSON.stringify(addresses, null, 2)
        }
      ],
      tools: [
        {
          name: "get_balance",
          description: "Check wallet balance"
        },
        {
          name: "send_bitcoin",
          description: "Send Bitcoin to an address"
        }
      ]
    };
  } catch (error) {
    return {
      content: [{ 
        type: "text", 
        text: `Error getting addresses: ${error instanceof Error ? error.message : 'Unknown error'}`
      }],
      tools: [{
        name: "get_wallet_status",
        description: "Check wallet status"
      }]
    };
  }
}

export async function handleGetBalance(): Promise<McpResponse> {
  const keyData = loadKeyFromDisk();
  const walletState = getWalletState();
  
  if (!keyData || !walletState.initialized) {
    return {
      content: [{ 
        type: "text", 
        text: "No wallet has been initialized yet. Use the setup_wallet tool to create or restore a wallet." 
      }],
      tools: [{
        name: "setup_wallet",
        description: "Initialize or restore a wallet"
      }]
    };
  }
  
  try {
    walletState.lastAccessed = Date.now();
    saveWalletState(walletState);
    
    const wallet = await initializeWallet(walletState.network);
    const balance = await getBalance(wallet);
    
    return {
      content: [
        {
          type: "text",
          text: "Current wallet balance:"
        },
        {
          type: "code",
          language: "json",
          text: JSON.stringify(balance, null, 2)
        }
      ],
      tools: [
        {
          name: "send_bitcoin",
          description: "Send Bitcoin to an address"
        },
        {
          name: "get_addresses",
          description: "View wallet addresses"
        }
      ]
    };
  } catch (error) {
    return {
      content: [{ 
        type: "text", 
        text: `Error getting balance: ${error instanceof Error ? error.message : 'Unknown error'}`
      }],
      tools: [{
        name: "get_wallet_status",
        description: "Check wallet status"
      }]
    };
  }
}

export async function handleSendBitcoin(params: { 
  address: string;
  amount: number;
  feeRate?: number;
}): Promise<McpResponse> {
  const keyData = loadKeyFromDisk();
  const walletState = getWalletState();
  
  if (!keyData || !walletState.initialized) {
    return {
      content: [{ 
        type: "text", 
        text: "No wallet has been initialized yet. Use the setup_wallet tool to create or restore a wallet." 
      }],
      tools: [{
        name: "setup_wallet",
        description: "Initialize or restore a wallet"
      }]
    };
  }
  
  try {
    walletState.lastAccessed = Date.now();
    saveWalletState(walletState);
    
    const wallet = await initializeWallet(walletState.network);
    const txid = await wallet.sendBitcoin({
      address: params.address,
      amount: params.amount,
      feeRate: params.feeRate
    });
    
    return {
      content: [
        {
          type: "text",
          text: "Transaction sent successfully!"
        },
        {
          type: "code",
          language: "json",
          text: JSON.stringify({ txid }, null, 2)
        }
      ],
      tools: [
        {
          name: "get_balance",
          description: "Check updated wallet balance"
        },
        {
          name: "get_wallet_status",
          description: "View wallet status"
        }
      ]
    };
  } catch (error) {
    return {
      content: [{ 
        type: "text", 
        text: `Error sending Bitcoin: ${error instanceof Error ? error.message : 'Unknown error'}`
      }],
      tools: [
        {
          name: "get_balance",
          description: "Check current balance"
        },
        {
          name: "get_wallet_status",
          description: "Check wallet status"
        }
      ]
    };
  }
}

// Tool schemas
export const WalletToolSchemas = {
  getWalletStatus: getWalletStatusSchema,
  getAddresses: getAddressesSchema,
  getBalance: getBalanceSchema,
  sendBitcoin: sendBitcoinSchema
};
