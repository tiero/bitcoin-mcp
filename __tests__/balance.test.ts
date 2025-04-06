import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getBalance, priceCache } from '../src/tools/balance';
import { Wallet } from '@arklabs/wallet-sdk';

// Mock the fetch function
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock successful price response
const mockPriceResponse = {
  USD: {
    last: 50000.00
  }
};

// Mock wallet data
const mockUtxos = [
  { value: 1000000 }, // 0.01 BTC
  { value: 2000000 }  // 0.02 BTC
];

const mockVtxos = [
  { value: 500000 },  // 0.005 BTC
  { value: 1500000 }  // 0.015 BTC
];

// Mock wallet
const mockWallet = {
  getCoins: vi.fn().mockResolvedValue(mockUtxos),
  getVtxos: vi.fn().mockResolvedValue(mockVtxos)
} as unknown as Wallet;

describe('Balance Tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Reset fetch mock default behavior
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockPriceResponse)
    });
    // Reset cache
    if (priceCache) {
      priceCache.usd = 0;
      priceCache.timestamp = 0;
    }
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return correct balance with fiat conversion', async () => {
    const balance = await getBalance(mockWallet);
    
    // Check balances in sats
    expect(balance.onchain).toBe(3000000); // 0.03 BTC
    expect(balance.offchain).toBe(2000000); // 0.02 BTC
    expect(balance.total).toBe(5000000); // 0.05 BTC
    
    // Check fiat conversion (0.05 BTC * $50,000)
    expect(balance.fiat).toBeDefined();
    expect(balance.fiat?.usd).toBe(2500); // $2,500
    expect(balance.fiat?.timestamp).toBeDefined();
  });

  it('should always attempt to fetch fresh price', async () => {
    const now = new Date('2025-01-01').getTime();
    vi.setSystemTime(now);
    
    // First call
    await getBalance(mockWallet);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    
    // Second call within a minute
    await getBalance(mockWallet);
    expect(mockFetch).toHaveBeenCalledTimes(2); // Always try to fetch fresh price
    
    // Advance time by 61 seconds
    vi.advanceTimersByTime(61 * 1000);
    
    // Third call after cache expiry
    await getBalance(mockWallet);
    expect(mockFetch).toHaveBeenCalledTimes(3); // Should fetch new price
  });

  it('should return balance without fiat when price fetch fails with no cache', async () => {
    // Mock fetch failure
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    
    const balance = await getBalance(mockWallet);
    
    // Balance should still be available
    expect(balance.onchain).toBe(3000000);
    expect(balance.offchain).toBe(2000000);
    expect(balance.total).toBe(5000000);
    
    // Fiat should be undefined
    expect(balance.fiat).toBeUndefined();
  });

  it('should use cached price when fetch fails within cache duration', async () => {
    const now = new Date('2025-01-01').getTime();
    vi.setSystemTime(now);
    
    // First call to set cache
    await getBalance(mockWallet);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    
    // Mock fetch failure for second call
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    
    // Second call within cache time
    const balance = await getBalance(mockWallet);
    expect(mockFetch).toHaveBeenCalledTimes(2); // Fetch attempted but failed
    
    // Should still have fiat info from cache
    expect(balance.fiat).toBeDefined();
    expect(balance.fiat?.usd).toBe(2500);
  });

  it('should not use expired cache when fetch fails', async () => {
    const now = new Date('2025-01-01').getTime();
    vi.setSystemTime(now);
    
    // First call to set cache
    await getBalance(mockWallet);
    
    // Advance time past cache duration
    vi.advanceTimersByTime(61 * 1000);
    
    // Mock fetch failure
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    
    // Call after cache expiry
    const balance = await getBalance(mockWallet);
    
    // Should not have fiat info since cache expired
    expect(balance.fiat).toBeUndefined();
  });
});
