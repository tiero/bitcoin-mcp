import { Wallet } from '@arklabs/wallet-sdk';
import { z } from 'zod';

// Schema for balance response
export const BalanceResponseSchema = z.object({
  total: z.number(),
  onchain: z.number(),
  offchain: z.number(),
  fiat: z.object({
    usd: z.number(),
    timestamp: z.number()
  }).optional()
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
      timestamp: Date.now()
    };
    
    return priceCache.usd;
  } catch (error) {
    console.error('Error fetching BTC price:', error);
    // Return cached price if within duration
    if (priceCache && (Date.now() - priceCache.timestamp) < CACHE_DURATION) {
      return priceCache.usd;
    }
    // Clear cache only if expired or doesn't exist
    priceCache = null;
    return null;
  }
}

export async function getBalance(wallet: Wallet): Promise<BalanceResponse> {
  // Get onchain UTXOs
  const utxos = await wallet.getCoins();
  const onchainBalance = utxos.reduce((sum, utxo) => sum + utxo.value, 0);

  // Get offchain VTXOs
  const vtxos = await wallet.getVtxos();
  const offchainBalance = vtxos.reduce((sum, vtxo) => sum + vtxo.value, 0);

  const totalBalance = onchainBalance + offchainBalance;
  
  // Base response without fiat
  const response: BalanceResponse = {
    total: totalBalance,
    onchain: onchainBalance,
    offchain: offchainBalance
  };

  // Get current BTC/USD price
  const btcPrice = await fetchBitcoinPrice();
  
  // Add fiat information only if price is available
  if (btcPrice !== null && priceCache !== null) {
    response.fiat = {
      usd: (totalBalance / 100_000_000) * btcPrice,
      timestamp: priceCache.timestamp
    };
  }

  return response;
}
