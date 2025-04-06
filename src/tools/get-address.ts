import { ToolResponse } from './types.js';
import { initializeWallet, loadKeyFromDisk } from '../lib/wallet.js';
import { getWalletState } from '../lib/state.js';

export const tool = {
  name: 'get_address',
  description: 'Get Bitcoin address',
  handler: async (): Promise<ToolResponse> => {
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
      const wallet = await initializeWallet(walletState.network);
      const addresses = await wallet.getAddress();
      
      return {
        content: [
          {
            type: "resource",
            resource: {
              uri: `bitcoin://address`,
              text: JSON.stringify(addresses, null, 2),
              mimeType: "application/json"
            }
          }
        ]
      };
    } catch (error) {
      return {
        content: [{ 
          type: "text", 
          text: `Error getting address: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        tools: [{
          name: "get_wallet_status",
          description: "Check wallet status"
        }]
      };
    }
  }
};
