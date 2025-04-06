import { z } from 'zod';
import { initializeWallet, loadKeyFromDisk } from '../lib/wallet.js';
import { getWalletState } from '../lib/state.js';
import { Tool, ToolResponse } from './types.js';

// Schema
export const schema = z.object({}).optional();

// Handler
const handler: Tool['handler'] = async (): Promise<ToolResponse> => {
  const keyData = loadKeyFromDisk();
  const walletState = getWalletState();
  
  if (!keyData || !walletState.initialized) {
    return {
      content: [{ 
        type: "text", 
        text: "No wallet has been initialized yet. Use the setup_wallet tool to create or restore a wallet." 
      }]
    };
  }
  
  return {
    content: [{ 
      type: "text", 
      text: `Wallet is initialized and active.\n` +
            `Network: ${walletState.network}\n` + 
            `Created: ${new Date(keyData.createdAt).toLocaleString()}\n` +
            `Last accessed: ${walletState.lastAccessed ? new Date(walletState.lastAccessed).toLocaleString() : 'Unknown'}`
    }]
  };
};

// Tool definition
export const tool: Tool = {
  name: 'get_wallet_status',
  schema,
  handler
};
