import { z } from 'zod';
import { Tool } from './types.js';
import { getWalletState, saveWalletState } from '../lib/state.js';
import { initializeWallet } from '../lib/wallet.js';

// Schema for setup_wallet command
export const schema = z
  .object({
    network: z.enum(['mutinynet', 'mainnet']).optional(),
    privateKey: z.string().optional(),
  })
  .optional();

export const tool: Tool = {
  name: 'setup_wallet',
  description: 'Set up a new Bitcoin wallet or restore an existing one',
  schema,
  handler: async ({ params }) => {
    try {
      const options = params as z.infer<typeof schema>;
      const network = options?.network || 'mutinynet';

      const wallet = await initializeWallet(network);

      // Save wallet state
      saveWalletState({
        initialized: true,
        network,
        createdAt: Date.now(),
      });

      return {
        content: [
          {
            type: 'text',
            text: `Bitcoin wallet successfully initialized on ${network}!`,
          },
        ],
        resources: [
          {
            uri: 'bitcoin://wallet/status',
            description: 'Check wallet status',
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error setting up wallet: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
      };
    }
  },
};
