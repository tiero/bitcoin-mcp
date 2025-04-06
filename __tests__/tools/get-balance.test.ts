import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tool } from '../../src/tools/get-balance.js';
import * as state from '../../src/lib/state.js';
import * as wallet from '../../src/lib/wallet.js';
import * as balance from '../../src/tools/balance.js';
import type { WalletState } from '../../src/lib/state.js';
import type { ToolResponse } from '../../src/tools/types.js';

// Mock the modules
vi.mock('../../src/lib/wallet.js', () => ({
  initializeWallet: vi.fn(),
}));

vi.mock('../../src/lib/state.js', () => ({
  getWalletState: vi.fn(),
}));

vi.mock('../../src/tools/balance.js', () => ({
  getBalance: vi.fn(),
}));

describe('get-balance tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return onchain, offchain, and total balances when wallet is initialized', async () => {
    // Mock wallet state as initialized
    vi.mocked(state.getWalletState).mockReturnValue({
      initialized: true,
      network: 'mutinynet',
      createdAt: Date.now(),
    } satisfies WalletState);

    // Mock balance response
    const mockBalance = {
      onchain: 0.5,
      offchain: 0.3,
      total: 0.8,
      fiat: {
        usd: 40000,
        timestamp: Date.now(),
      },
    };

    vi.mocked(wallet.initializeWallet).mockResolvedValue({} as any);
    vi.mocked(balance.getBalance).mockResolvedValue(mockBalance);

    const result = (await tool.handler({})) as ToolResponse;

    // Check response format
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');

    const responseText = result.content[0].text;
    expect(responseText).toContain('0.50000000 BTC');
    expect(responseText).toContain('0.30000000 BTC');
    expect(responseText).toContain('0.80000000 BTC');
    expect(responseText).toContain('$32000.00 USD');
  });

  it('should format balance without fiat when not available', async () => {
    // Mock wallet state as initialized
    vi.mocked(state.getWalletState).mockReturnValue({
      initialized: true,
      network: 'mutinynet',
      createdAt: Date.now(),
    } satisfies WalletState);

    // Mock balance response without fiat
    const mockBalance = {
      onchain: 1.0,
      offchain: 0.5,
      total: 1.5,
    };

    vi.mocked(wallet.initializeWallet).mockResolvedValue({} as any);
    vi.mocked(balance.getBalance).mockResolvedValue(mockBalance);

    const result = (await tool.handler({})) as ToolResponse;

    // Check response format
    const responseText = result.content[0].text;
    expect(responseText).toContain('1.00000000 BTC');
    expect(responseText).toContain('0.50000000 BTC');
    expect(responseText).toContain('1.50000000 BTC');
    expect(responseText).not.toContain('USD');
  });

  it('should suggest wallet setup when wallet is not initialized', async () => {
    // Mock wallet state as not initialized
    vi.mocked(state.getWalletState).mockReturnValue({
      initialized: false,
      network: 'mutinynet',
      createdAt: Date.now(),
    } satisfies WalletState);

    const result = (await tool.handler({})) as ToolResponse;

    // Check response format
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain("haven't set up a wallet yet");

    // Check suggested tool
    expect(result.tools).toBeDefined();
    if (result.tools) {
      expect(result.tools).toHaveLength(1);
      expect(result.tools[0].name).toBe('setup_wallet');
    }
  });

  it('should handle errors gracefully', async () => {
    // Mock wallet state as initialized but make balance throw
    vi.mocked(state.getWalletState).mockReturnValue({
      initialized: true,
      network: 'mutinynet',
      createdAt: Date.now(),
    } satisfies WalletState);

    vi.mocked(wallet.initializeWallet).mockResolvedValue({} as any);
    vi.mocked(balance.getBalance).mockRejectedValue(new Error('Test error'));

    const result = (await tool.handler({})) as ToolResponse;

    // Check error response
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain(
      'Error getting Bitcoin wallet balance'
    );
    expect(result.content[0].text).toContain('Test error');

    // Check suggested tool and resource
    expect(result.tools).toBeDefined();
    if (result.tools) {
      expect(result.tools).toHaveLength(1);
      expect(result.tools[0].name).toBe('setup_wallet');
    }
    expect(result.resources).toBeDefined();
    if (result.resources) {
      expect(result.resources).toHaveLength(1);
      expect(result.resources[0].uri).toBe('bitcoin://wallet/status');
    }
  });
});
