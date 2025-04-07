import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { tool as getBalance, fetchBitcoinPrice } from '../../src/tools/get-balance.js';
import * as state from '../../src/lib/state.js';
import * as wallet from '../../src/lib/wallet.js';
import type { WalletState } from '../../src/lib/state.js';
import type { ToolResponse } from '../../src/tools/types.js';

// Mock fetch globally
const globalFetch = vi.fn();
global.fetch = globalFetch;

// Mock modules
vi.mock('../../src/lib/wallet.js', () => ({
  initializeWallet: vi.fn(),
}));

vi.mock('../../src/lib/state.js', () => ({
  getWalletState: vi.fn(),
}));

describe('get-balance tool', () => {
  const CACHE_DURATION = 60 * 1000; // 1 minute in milliseconds
  let priceCache: { usd: number; timestamp: number } | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset price cache before each test
    priceCache = null;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('fetchBitcoinPrice', () => {
    it('should fetch and cache bitcoin price', async () => {
      const mockPrice = 50000;
      globalFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ USD: { last: mockPrice } }),
      });

      const price = await fetchBitcoinPrice();
      expect(price).toBe(mockPrice);
    });

    it('should use cached price when fetch fails within cache duration', async () => {
      vi.useFakeTimers();
      const mockPrice = 50000;
      
      // Initial successful fetch
      globalFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ USD: { last: mockPrice } }),
      });
      await fetchBitcoinPrice();

      // Subsequent failed fetch
      globalFetch.mockRejectedValueOnce(new Error('Network error'));
      const price = await fetchBitcoinPrice();
      expect(price).toBe(mockPrice);
    });

    it('should return null when fetch fails and cache is expired', async () => {
      vi.useFakeTimers();
      const mockPrice = 50000;

      // Initial successful fetch
      globalFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ USD: { last: mockPrice } }),
      });
      await fetchBitcoinPrice();

      // Advance time beyond cache duration
      vi.advanceTimersByTime(CACHE_DURATION + 1000);

      // Subsequent failed fetch after cache expiration
      globalFetch.mockRejectedValueOnce(new Error('Network error'));
      const price = await fetchBitcoinPrice();
      expect(price).toBeNull();
    });
  });

  describe('get-balance handler', () => {
    it('should return wallet balance with bitcoin and ark addresses', async () => {
      // Mock wallet state as initialized
      vi.mocked(state.getWalletState).mockReturnValue({
        initialized: true,
        network: 'mutinynet',
        createdAt: Date.now(),
      } satisfies WalletState);

      // Mock wallet balance and addresses
      vi.mocked(wallet.initializeWallet).mockResolvedValue({
        getBalance: () => Promise.resolve({
          onchain: { total: 1000000 }, // 0.01 BTC
          offchain: { total: 500000 }, // 0.005 BTC
        }),
        getAddress: () => Promise.resolve({
          onchain: 'bc1qxxx',
          offchain: {
            address: 'lnxxx',
          },
        }),
      } as any);

      // Mock Bitcoin price
      globalFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ USD: { last: 50000 } }),
      });

      const result = (await getBalance.handler({})) as ToolResponse;

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Your wallet balance is: 0.01500000 BTC'); // Total balance
      expect(result.content[0].text).toContain('Bitcoin Balance: 0.01 BTC'); // Bitcoin balance
      expect(result.content[0].text).toContain('Ark Balance: 0.005 BTC'); // Ark balance
      expect(result.content[0].text).toContain('$750.00 USD'); // Fiat value
      expect(result.content[0].text).toContain('This is testnet Bitcoin'); // Network info

      expect(result.resources).toHaveLength(1);
      expect(result.resources![0].uri).toBe('bitcoin://balance');
    });

    it('should return wallet balance without ark address', async () => {
      // Mock wallet state as initialized
      vi.mocked(state.getWalletState).mockReturnValue({
        initialized: true,
        network: 'mutinynet',
        createdAt: Date.now(),
      } satisfies WalletState);

      // Mock wallet balance and addresses without offchain
      vi.mocked(wallet.initializeWallet).mockResolvedValue({
        getBalance: () => Promise.resolve({
          onchain: { total: 1000000 }, // 0.01 BTC
        }),
        getAddress: () => Promise.resolve({
          onchain: 'bc1qxxx',
        }),
      } as any);

      // Mock Bitcoin price
      globalFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ USD: { last: 50000 } }),
      });

      const result = (await getBalance.handler({})) as ToolResponse;

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Your wallet balance is: 0.01000000 BTC'); // Total balance
      expect(result.content[0].text).toContain('Bitcoin Balance: 0.01 BTC'); // Bitcoin balance
      expect(result.content[0].text).not.toContain('Ark Balance'); // No Ark balance
      expect(result.content[0].text).toContain('$500.00 USD'); // Fiat value
      expect(result.content[0].text).toContain('This is testnet Bitcoin'); // Network info

      expect(result.resources).toHaveLength(1);
      expect(result.resources![0].uri).toBe('bitcoin://balance');
    });

    it('should suggest setup_wallet tool when wallet is not initialized', async () => {
      // Mock wallet state as not initialized
      vi.mocked(state.getWalletState).mockReturnValue({
        initialized: false,
        network: 'mutinynet',
        createdAt: Date.now(),
      } satisfies WalletState);

      const result = (await getBalance.handler({})) as ToolResponse;

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain("haven't set up a wallet");
      expect(result.tools).toHaveLength(1);
      expect(result.tools![0].name).toBe('setup_wallet');
    });

    it('should handle errors gracefully', async () => {
      // Mock wallet state as initialized
      vi.mocked(state.getWalletState).mockReturnValue({
        initialized: true,
        network: 'mutinynet',
        createdAt: Date.now(),
      } satisfies WalletState);

      // Mock wallet initialization error
      vi.mocked(wallet.initializeWallet).mockRejectedValue(new Error('Test error'));

      const result = (await getBalance.handler({})) as ToolResponse;

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Error getting balance');
      expect(result.isError).toBe(true);
    });
  });
});
