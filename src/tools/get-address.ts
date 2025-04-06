import { ToolResponse } from './types.js';
import { initializeWallet } from '../lib/wallet.js';
import { getWalletState } from '../lib/state.js';

export const tool = {
  name: 'get_address',
  description: 'Get your Bitcoin wallet addresses for receiving cryptocurrency (both onchain and offchain)',
  handler: async (): Promise<ToolResponse> => {
    try {
      const walletState = getWalletState();
      if (!walletState.initialized) {
        return {
          content: [{ 
            type: "text", 
            text: "Let me check your Bitcoin wallet addresses. I see you haven't set up a wallet yet. Would you like me to help you create one? You can use the setup_wallet tool to get started."
          }],
          tools: [{
            name: "setup_wallet",
            description: "Create or restore a Bitcoin wallet"
          }]
        };
      }

      const wallet = await initializeWallet();
      const addresses = await wallet.getAddress();
      
      return {
        content: [
          {
            type: "text",
            text: "Here are your Bitcoin wallet addresses for receiving cryptocurrency:\n\n" +
                  "**Onchain Address**\n" +
                  "```\n" +
                  addresses.onchain +
                  "\n```\n\n" +
                  "**Offchain Address**\n" +
                  "```\n" +
                  addresses.offchain +
                  "\n```"
          },
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
          text: `Error getting Bitcoin wallet addresses: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        tools: [{
          name: "setup_wallet",
          description: "Create or restore a Bitcoin wallet"
        }],
        resources: [{
          uri: "bitcoin://wallet/status",
          description: "Check wallet status"
        }]
      };
    }
  }
};
