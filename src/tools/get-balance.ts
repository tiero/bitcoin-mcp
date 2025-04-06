import { z } from 'zod';
import { getBalance, type BalanceResponse } from './balance.js';
import { Tool, ToolResponse } from './types.js';
import { initializeWallet } from '../lib/wallet.js';
import { getWalletState } from '../lib/state.js';

// Schema
export const schema = z
  .object({
    fiat: z.enum(['USD', 'EUR', 'GBP']).optional(),
  })
  .optional();

interface BalanceAmount {
  amount: number;
  formatted: string;
}

interface FormattedBalance {
  onchain: BalanceAmount;
  offchain: BalanceAmount;
  total: BalanceAmount;
  fiat?: {
    currency: string;
    rate: number;
    value: number;
    timestamp: number;
  };
}

// Handler
const handler: Tool['handler'] = async ({ params }) => {
  try {
    const walletState = getWalletState();
    if (!walletState.initialized) {
      return {
        content: [
          {
            type: 'text',
            text: "Let me check your Bitcoin wallet balance. I see you haven't set up a wallet yet. Would you like me to help you create one? You can use the setup_wallet tool to get started.",
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
    const balance = await getBalance(wallet);

    const formattedBalance: FormattedBalance = {
      onchain: {
        amount: balance.onchain,
        formatted: `${balance.onchain.toFixed(8)} BTC`,
      },
      offchain: {
        amount: balance.offchain,
        formatted: `${balance.offchain.toFixed(8)} BTC`,
      },
      total: {
        amount: balance.total,
        formatted: `${balance.total.toFixed(8)} BTC`,
      },
    };

    if (balance.fiat) {
      formattedBalance.fiat = {
        currency: 'USD',
        rate: balance.fiat.usd,
        value: balance.total * balance.fiat.usd,
        timestamp: balance.fiat.timestamp,
      };
    }

    return {
      content: [
        {
          type: 'text',
          text:
            'Here is your Bitcoin wallet balance:\n\n' +
            '**Onchain Balance**\n' +
            '```\n' +
            formattedBalance.onchain.formatted +
            '\n```\n\n' +
            '**Offchain Balance**\n' +
            '```\n' +
            formattedBalance.offchain.formatted +
            '\n```\n\n' +
            '**Total Balance**\n' +
            '```\n' +
            formattedBalance.total.formatted +
            (formattedBalance.fiat
              ? `\n≈ $${formattedBalance.fiat.value.toFixed(2)} USD`
              : '') +
            '\n```',
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error getting Bitcoin wallet balance: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
};

export const tool = {
  name: 'get_balance',
  description: 'Get your Bitcoin wallet balance (both onchain and offchain)',
  schema,
  handler,
};
