import { Tool, ToolResponse } from './types.js';
import { initializeWallet } from '../lib/wallet.js';
import { getWalletState } from '../lib/state.js';
import { WalletAddresses } from './schemas.js';

export const tool: Tool = {
  name: 'get_address',
  description: 'Get Bitcoin and Ark addresses from the wallet',
  handler: async (): Promise<ToolResponse> => {
    try {
      const walletState = getWalletState();
      if (!walletState.initialized) {
        return {
          content: [
            {
              type: 'text',
              text: "I see you haven't set up a wallet yet. Would you like me to help you create one with the setup_wallet tool?",
            },
          ],
          tools: [
            {
              name: 'setup_wallet',
              description: 'Create or restore a Bitcoin wallet',
            },
          ],
        };
      }

      const wallet = await initializeWallet();
      const addresses = await wallet.getAddress();


      const walletAddresses: WalletAddresses = {
        bitcoin: {
          type: 'bitcoin',
          network: walletState.network,
          address: addresses.onchain,
        }
      };

      if (addresses.offchain !== undefined) {
        walletAddresses.ark = {
          type: 'ark',
          network: walletState.network,
          address: addresses.offchain.address,
        }
      };


      return {
        content: [
          {
            type: 'text',
            text:
              'Here are your wallet addresses:\n\n' +
              '**Bitcoin Address**\n' +
              '```\n' +
              walletAddresses.bitcoin.address +
              '\n```' +
              (walletAddresses.ark ? '\n\n**Ark Address**\n```\n' +
              walletAddresses.ark.address +
              '\n```' : ''),
          },
          {
            type: 'resource',
            resource: {
              uri: 'bitcoin://address',
              text: JSON.stringify(walletAddresses, null, 2),
              mimeType: 'application/json',
            },
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error getting Bitcoin wallet addresses: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        tools: [
          {
            name: 'setup_wallet',
            description: 'Create or restore a Bitcoin wallet',
          },
        ],
        resources: [
          {
            uri: 'bitcoin://wallet/status',
            description: 'Check wallet status',
          },
        ],
      };
    }
  },
};
