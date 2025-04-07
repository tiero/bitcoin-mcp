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

  it('should return both bitcoin and ark addresses when wallet is initialized', async () => {
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

    const result = (await tool.handler({})) as ToolResponse;

    // Check response content
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
      const addresses = JSON.parse(resourceContent.resource.text as string);
      expect(addresses).toEqual({
        bitcoin: {
          type: 'bitcoin',
          network: 'mutinynet',
          address: 'bc1qxxx',
        },
        ark: {
          type: 'ark',
          network: 'mutinynet',
          address: 'lnxxx',
        }
      });
      expect(resourceContent.resource.mimeType).toBe('application/json');
      expect(resourceContent.resource.uri).toBe('bitcoin://address');
    }
  });

  it('should return only bitcoin address when ark address is not available', async () => {
    // Mock wallet state as initialized
    vi.mocked(state.getWalletState).mockReturnValue({
      initialized: true,
      network: 'mutinynet',
      createdAt: Date.now(),
    } satisfies WalletState);

    // Mock wallet addresses without offchain
    const mockAddresses = {
      onchain: 'bc1qxxx',
    };

    vi.mocked(wallet.initializeWallet).mockResolvedValue({
      getAddress: () => Promise.resolve(mockAddresses),
    } as any);

    const result = (await tool.handler({})) as ToolResponse;

    // Check response content
    expect(result.content).toHaveLength(2);
    
    // Check text content
    const textContent = result.content[0];
    expect(textContent.type).toBe('text');
    expect(textContent.text).toContain('bc1qxxx');
    expect(textContent.text).not.toContain('Ark Address');

    // Check resource content
    const resourceContent = result.content[1];
    expect(resourceContent.type).toBe('resource');
    if (resourceContent.type === 'resource') {
      const addresses = JSON.parse(resourceContent.resource.text as string);
      expect(addresses).toEqual({
        bitcoin: {
          type: 'bitcoin',
          network: 'mutinynet',
          address: 'bc1qxxx',
        }
      });
      expect(addresses.ark).toBeUndefined();
      expect(resourceContent.resource.mimeType).toBe('application/json');
      expect(resourceContent.resource.uri).toBe('bitcoin://address');
    }
  });

  it('should suggest setup_wallet tool when wallet is not initialized', async () => {
    // Mock wallet state as not initialized
    vi.mocked(state.getWalletState).mockReturnValue({
      initialized: false,
      network: 'mutinynet',
      createdAt: Date.now(),
    } satisfies WalletState);

    const result = (await tool.handler({})) as ToolResponse;

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain("haven't set up a wallet");
    expect(result.tools).toHaveLength(1);
    expect(result.tools![0].name).toBe('setup_wallet');
  });
});
