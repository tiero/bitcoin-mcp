import { z } from 'zod';
import { Tool } from './types.js';
import { initializeWallet } from '../lib/wallet.js';
import { getWalletState } from '../lib/state.js';

const POW_8 = 100_000_000n; // 10^8 for BTC/sat conversion

// Schema for balance response
export const BalanceResponseSchema = z.object({
  total: z.number(),
  onchain: z.number(),
  offchain: z.number(),
  address: z.string(),
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
    priceCache = {
      usd: data.USD.last,
      timestamp: Date.now(),
    };

    return priceCache.usd;
  } catch (error) {
    if (!process.env.VITEST) {
      console.error('Error fetching BTC price:', error);
    }
    
    if (priceCache && Date.now() - priceCache.timestamp < CACHE_DURATION) {
      return priceCache.usd;
    }

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

// Handler
const handler: Tool['handler'] = async ({ params }) => {
  try {
    const walletState = getWalletState();
    if (!walletState.initialized) {
      return {
        content: [{ 
          type: 'text', 
          text: "Let me check your Bitcoin wallet balance. I see you haven't set up a wallet yet. Would you like me to help you create one? You can use the setup_wallet tool to get started."
        }],
        tools: [{ name: 'setup_wallet', description: 'Create or restore a Bitcoin wallet' }],
      };
    }

    const wallet = await initializeWallet();
    const [balance, addresses] = await Promise.all([
      wallet.getBalance(),
      wallet.getAddress(),
    ]);

    const total = BigInt(balance.onchain.total + balance.offchain.total);
    const onchain = BigInt(balance.onchain.total);
    const offchain = BigInt(balance.offchain.total);

    const response: BalanceResponse = {
      total: Number(total),
      onchain: Number(onchain),
      offchain: Number(offchain),
      address: addresses.onchain,
      fiat: await fetchBitcoinPrice().then((price) => (price ? { usd: price, timestamp: Date.now() } : undefined)),
    };

    // Convert satoshis to BTC using BigInt
    const btcAmount = `${total / POW_8}.${(total % POW_8).toString().padStart(8, '0')}`;
    const fiatStr = response.fiat ? ` (approximately $${(response.fiat.usd * Number(total) / Number(POW_8)).toFixed(2)} USD)` : '';
    
    return {
      content: [{
        type: 'text',
        text: `Your Bitcoin wallet balance is: ${btcAmount} BTC${fiatStr}\n\n` +
              `Your receiving address: ${addresses.onchain}\n\n` +
              `This is testnet Bitcoin on the Mutinynet network, which isn't real Bitcoin that can be exchanged for actual currency.`
      }],
      resources: [{
        uri: `bitcoin://address/${addresses.onchain}`,
        description: 'Your Bitcoin wallet address',
      }],
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
      tools: [{ name: 'setup_wallet', description: 'Create or restore a Bitcoin wallet' }],
    };
  }
};

export const tool = {
  name: 'get_balance',
  description: 'Get your Bitcoin wallet balance and address',
  schema,
  handler,
};
