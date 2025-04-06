import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tool } from '../../src/tools/get-address.js';
import * as state from '../../src/lib/state.js';
import * as wallet from '../../src/lib/wallet.js';
import type { WalletState } from '../../src/lib/state.js';
import type { ToolResponse, Tool } from '../../src/tools/types.js';

// Mock the modules
vi.mock('../../src/lib/wallet.js', () => ({
  initializeWallet: vi.fn(),
}));

vi.mock('../../src/lib/state.js', () => ({
  getWalletState: vi.fn(),
}));

describe('get-address tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return both onchain and offchain addresses when wallet is initialized', async () => {
    // Mock wallet state as initialized
    vi.mocked(state.getWalletState).mockReturnValue({
      initialized: true,
      network: 'mutinynet',
      createdAt: Date.now(),
    } satisfies WalletState);

    // Mock wallet addresses
    const mockAddresses = {
      onchain: 'bc1qxxx',
      offchain: {
        address: 'lnxxx',
      },
    };

    vi.mocked(wallet.initializeWallet).mockResolvedValue({
      getAddress: () => Promise.resolve(mockAddresses),
    } as any);

    const result = (await tool.handler()) as ToolResponse;

    // Check response format
    expect(result.content).toHaveLength(2);

    // Check text content
    const textContent = result.content[0];
    expect(textContent.type).toBe('text');
    expect(textContent.text).toContain('bc1qxxx');
    expect(textContent.text).toContain('lnxxx');

    // Check resource content
    const resourceContent = result.content[1];
    expect(resourceContent.type).toBe('resource');
    if (resourceContent.type === 'resource') {
      expect(resourceContent.resource.uri).toBe('bitcoin://address');
      expect(JSON.parse(resourceContent.resource.text as string)).toEqual(
        mockAddresses
      );
      expect(resourceContent.resource.mimeType).toBe('application/json');
    }
  });

  it('should suggest wallet setup when wallet is not initialized', async () => {
    // Mock wallet state as not initialized
    vi.mocked(state.getWalletState).mockReturnValue({
      initialized: false,
      network: 'mutinynet',
      createdAt: Date.now(),
    } satisfies WalletState);

    const result = (await tool.handler()) as ToolResponse;

    // Check response format
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain("haven't set up a wallet yet");

    // Check that setup_wallet tool is suggested
    expect(result.tools).toBeDefined();
    expect(result.tools?.[0].name).toBe('setup_wallet');
  });

  it('should handle errors gracefully', async () => {
    // Mock wallet state as initialized
    vi.mocked(state.getWalletState).mockReturnValue({
      initialized: true,
      network: 'mutinynet',
      createdAt: Date.now(),
    } satisfies WalletState);

    // Mock an error during wallet initialization
    vi.mocked(wallet.initializeWallet).mockRejectedValue(new Error('Test error'));

    const result = (await tool.handler()) as ToolResponse;

    // Check error response format
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain(
      'Error getting Bitcoin wallet addresses'
    );

    // Check that setup_wallet tool is suggested
    expect(result.tools).toBeDefined();
    expect(result.tools?.[0].name).toBe('setup_wallet');
  });
});
