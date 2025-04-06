import { z } from 'zod';
import { Tool } from './types.js';
import { initializeWallet } from '../lib/wallet.js';
import { getWalletState } from '../lib/state.js';

// Schema for balance response
export const BalanceResponseSchema = z.object({
  total: z.number(),
  onchain: z.number(),
  offchain: z.number(),
  fiat: z
    .object({
      usd: z.number(),
      timestamp: z.number(),
    })
    .optional(),
});

export type BalanceResponse = z.infer<typeof BalanceResponseSchema>;

// Cache for Bitcoin price
export let priceCache: {
  usd: number;
  timestamp: number;
} | null = null;

const CACHE_DURATION = 60 * 1000; // 1 minute in milliseconds

export async function fetchBitcoinPrice(): Promise<number | null> {
  try {
    const response = await fetch('https://blockchain.info/ticker');
    if (!response.ok) {
      throw new Error('Price API response not OK');
    }

    const data = await response.json();

    // Update cache
    priceCache = {
      usd: data.USD.last,
      timestamp: Date.now(),
    };

    return priceCache.usd;
  } catch (error) {
    // Only log errors in production, not in tests
    if (!process.env.VITEST) {
      console.error('Error fetching BTC price:', error);
    }
    
    // Return cached price if within duration
    if (priceCache && Date.now() - priceCache.timestamp < CACHE_DURATION) {
      return priceCache.usd;
    }

    // Clear cache and return null
    priceCache = null;
    return null;
  }
}

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
    const coins = await wallet.getCoins();
    const vtxos = await wallet.getVtxos();
    const balance: BalanceResponse = {
      total: coins.reduce((sum: number, coin: { value: number }) => sum + coin.value, 0) + vtxos.reduce((sum: number, vtxo: { value: number }) => sum + vtxo.value, 0),
      onchain: coins.reduce((sum: number, coin: { value: number }) => sum + coin.value, 0),
      offchain: vtxos.reduce((sum: number, vtxo: { value: number }) => sum + vtxo.value, 0),
      fiat: await fetchBitcoinPrice().then((price) => (price ? { usd: price, timestamp: Date.now() } : undefined)),
    };

    // Convert satoshis to BTC
    const btcAmount = (balance.total / 100000000).toFixed(8);
    const fiatStr = balance.fiat ? ` (approximately $${(balance.fiat.usd * balance.total / 100000000).toFixed(2)} USD)` : '';

    return {
      content: [
        {
          type: 'text',
          text: `Your Bitcoin wallet balance is: ${btcAmount} BTC${fiatStr}\n\nThis is testnet Bitcoin on the Mutinynet network, which isn't real Bitcoin that can be exchanged for actual currency.`,
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
