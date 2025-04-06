import { z } from 'zod';
import { Tool } from './types.js';
import { initializeWallet } from '../lib/wallet.js';
import { getWalletState } from '../lib/state.js';

// Schema for send_bitcoin command
export const schema = z.object({
  address: z.string(),
  amount: z.number(),
  feeRate: z.number().optional(),
});

// Handler
const handler: Tool['handler'] = async ({ params }) => {
  try {
    const { address, amount, feeRate } = params as z.infer<typeof schema>;
    const walletState = getWalletState();

    if (!walletState.initialized) {
      return {
        content: [
          {
            type: 'text',
            text: 'Wallet is not initialized. Please set up a wallet first.',
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

    const wallet = await initializeWallet(walletState.network);
    const txid = await wallet.sendBitcoin({ address, amount, feeRate });

    return {
      content: [
        {
          type: 'text',
          text: `Successfully sent ${amount} BTC to ${address}\nTransaction ID: ${txid}`,
        },
      ],
      tools: [
        {
          name: 'get_balance',
          description: 'Check updated wallet balance',
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error sending Bitcoin: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      tools: [
        {
          name: 'get_balance',
          description: 'Check current wallet balance',
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
};

// Tool definition
export const tool: Tool = {
  name: 'send_bitcoin',
  description: 'Send Bitcoin to a specified address',
  schema,
  handler,
};
