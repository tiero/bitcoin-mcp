import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { tool, fetchBitcoinPrice } from '../../src/tools/get-balance.js';
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
      // Note: We can't test priceCache directly as it's internal to the module
    });

    it('should use cached price when fetch fails within cache duration', async () => {
      vi.useFakeTimers();
      const mockPrice = 50000;
      
      // First successful fetch
      globalFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ USD: { last: mockPrice } }),
      });
      await fetchBitcoinPrice();

      // Subsequent failed fetch
      globalFetch.mockRejectedValueOnce(new Error('Network error'));
      
      // Within cache duration
      vi.advanceTimersByTime(CACHE_DURATION - 1000);
      const price = await fetchBitcoinPrice();
      expect(price).toBe(mockPrice);
    });

    it('should return null when fetch fails and cache is expired', async () => {
      vi.useFakeTimers();
      const mockPrice = 50000;
      
      // First successful fetch
      globalFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ USD: { last: mockPrice } }),
      });
      await fetchBitcoinPrice();

      // Subsequent failed fetch after cache expiration
      globalFetch.mockRejectedValueOnce(new Error('Network error'));
      vi.advanceTimersByTime(CACHE_DURATION + 1000);
      
      const price = await fetchBitcoinPrice();
      expect(price).toBeNull();
    });
  });

  describe('balance handler', () => {
    it('should return formatted balance with fiat conversion when wallet is initialized', async () => {
      // Mock wallet state
      vi.mocked(state.getWalletState).mockReturnValue({
        initialized: true,
        network: 'mutinynet',
        createdAt: Date.now(),
      } satisfies WalletState);

      // Mock wallet initialization with proper coin methods
      vi.mocked(wallet.initializeWallet).mockResolvedValue({
        getCoins: async () => [
          { value: 100000000 }, // 1 BTC in sats
        ],
        getVtxos: async () => [
          { value: 0 }, // 0 BTC in sats
        ],
      } as any);

      // Mock Bitcoin price
      globalFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ USD: { last: 50000 } }),
      });

      const result = (await tool.handler({})) as ToolResponse;

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      const text = result.content[0].text;
      
      const expectedText = 'Your Bitcoin wallet balance is: 1.00000000 BTC (approximately $50000.00 USD)\n\nThis is testnet Bitcoin on the Mutinynet network, which isn\'t real Bitcoin that can be exchanged for actual currency.';
      expect(text).toBe(expectedText);
    });

    it('should suggest wallet setup when wallet is not initialized', async () => {
      vi.mocked(state.getWalletState).mockReturnValue({
        initialized: false,
        network: 'mutinynet',
        createdAt: Date.now(),
      } satisfies WalletState);

      const result = (await tool.handler({})) as ToolResponse;

      expect(result.content[0].text).toContain("haven't set up a wallet yet");
      expect(result.tools).toContainEqual({
        name: 'setup_wallet',
        description: expect.any(String),
      });
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(state.getWalletState).mockReturnValue({
        initialized: true,
        network: 'mutinynet',
        createdAt: Date.now(),
      } satisfies WalletState);

      vi.mocked(wallet.initializeWallet).mockRejectedValue(new Error('Wallet error'));

      const result = (await tool.handler({})) as ToolResponse;
      expect(result.content[0].text).toContain('error');
    });
  });
});
