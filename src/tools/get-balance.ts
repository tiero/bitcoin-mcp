import { z } from 'zod';
import { Tool } from './types.js';
import { BalanceResponseSchema, WalletAddresses } from './schemas.js';
import { initializeWallet } from '../lib/wallet.js';
import { getWalletState } from '../lib/state.js';

const POW_8 = 100_000_000n; // 10^8 for BTC/sat conversion

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

export const tool: Tool = {
  name: 'get_balance',
  description: 'Get your wallet balance in Bitcoin and Ark',
  schema: z.object({
    fiat: z.enum(['USD', 'EUR', 'GBP']).optional(),
  }).optional(),
  handler: async ({ params }) => {
    try {
      const walletState = getWalletState();
      if (!walletState.initialized) {
        return {
          content: [{ 
            type: 'text', 
            text: "I see you haven't set up a wallet yet. Would you like me to help you create one with the setup_wallet tool?"
          }],
          tools: [{ name: 'setup_wallet', description: 'Create or restore a Bitcoin wallet' }],
        };
      }

      const wallet = await initializeWallet();
      const [balance, addresses] = await Promise.all([
        wallet.getBalance(),
        wallet.getAddress(),
      ]);

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
      }

      const total = BigInt(balance.onchain.total + (balance.offchain?.total || 0));
      const onchain = BigInt(balance.onchain.total);
      const offchain = BigInt(balance.offchain?.total || 0);

      const response: BalanceResponse = {
        total: Number(total),
        bitcoin: {
          address: walletAddresses.bitcoin,
          balance: Number(onchain),
        }
      };

      if (walletAddresses.ark) {
        response.ark = {
          address: walletAddresses.ark,
          balance: Number(offchain),
        };
      }

      const fiatPrice = await fetchBitcoinPrice();
      if (fiatPrice) {
        response.fiat = {
          usd: fiatPrice,
          timestamp: Date.now(),
        };
      }

      // Convert satoshis to BTC using BigInt
      const btcAmount = `${total / POW_8}.${(total % POW_8).toString().padStart(8, '0')}`;
      const fiatStr = response.fiat ? ` (approximately $${(response.fiat.usd * Number(total) / Number(POW_8)).toFixed(2)} USD)` : '';
      
      return {
        content: [{
          type: 'text',
          text: `Your wallet balance is: ${btcAmount} BTC${fiatStr}\n\n` +
                `Bitcoin Balance: ${Number(onchain) / Number(POW_8)} BTC\n` +
                (response.ark ? `Ark Balance: ${Number(offchain) / Number(POW_8)} BTC\n` : '') +
                `This is testnet Bitcoin on the Mutinynet network, which isn't real Bitcoin that can be exchanged for actual currency.`
        }],
        resources: [{
          uri: `bitcoin://balance`,
          description: 'Wallet Balance',
        }],
      };
    } catch (error) {
      return {
        content: [{ 
          type: 'text', 
          text: `Error getting balance: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }],
        isError: true,
      };
    }
  },
};
