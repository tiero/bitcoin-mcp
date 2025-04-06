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

export async function handleGetAddresses(): Promise<McpResponse> {
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
        text: `Error retrieving addresses: ${error instanceof Error ? error.message : String(error)}` 
      }],
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
    };
  }
  
  try {
    // Update last accessed timestamp
    walletState.lastAccessed = Date.now();
    saveWalletState(walletState);
    
    const wallet = await initializeWallet(walletState.network);
    const balance = await getBalance(wallet);
    
    // Format balance in sats and BTC
    const btcBalance = balance.total / 100_000_000;
    
    let response = `Wallet Balance:\n\n` +
                  `Total: ${balance.total} sats (${btcBalance.toFixed(8)} BTC)\n` +
                  `Onchain: ${balance.onchain} sats\n` +
                  `Offchain: ${balance.offchain} sats`;
    
    if (balance.fiat) {
      response += `\nUSD Value: $${balance.fiat.usd.toFixed(2)}`;
    }
    
    return {
      content: [{ 
        type: "text", 
        text: response
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
      amount: params.amount,
      feeRate: params.feeRate
    });
    
    return {
      content: [{ 
        type: "text", 
        text: `Transaction sent successfully!\n\n` +
              `Transaction ID: ${txid}\n` +
              `Amount: ${params.amount} satoshis\n` +
              `To: ${params.address}\n` +
              `Fee Rate: ${params.feeRate ? `${params.feeRate} sats/vbyte` : 'Default'}`
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

// Tool schemas
export const WalletToolSchemas = {
  getWalletStatus: getWalletStatusSchema,
  getAddresses: getAddressesSchema,
  getBalance: getBalanceSchema,
  sendBitcoin: sendBitcoinSchema
};
