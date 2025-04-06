import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tool } from '../../src/tools/send-bitcoin.js';
import * as wallet from '../../src/lib/wallet.js';
import * as state from '../../src/lib/state.js';

// Mock the wallet module
vi.mock('../../src/lib/wallet.js', () => ({
  initializeWallet: vi.fn(),
}));

// Mock the state module
vi.mock('../../src/lib/state.js', () => ({
  getWalletState: vi.fn(),
}));

describe('send-bitcoin tool', () => {
  const mockWallet = {
    getBalance: vi.fn(),
    sendBitcoin: vi.fn(),
  };

  const mockWalletState = {
    initialized: true,
    network: 'mutinynet',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (wallet.initializeWallet as any).mockResolvedValue(mockWallet);
    (state.getWalletState as any).mockReturnValue(mockWalletState);
  });

  it('should validate amount greater than 0', async () => {
    mockWallet.getBalance.mockResolvedValue({
      onchain: { total: 10000 },
      offchain: { total: 0 },
    });

    const result = await tool.handler({
      params: {
        address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
        amount: 0,
      },
    } as any);

    expect(result.content[0].text).toBe('Amount must be greater than 0');
  });

  it('should validate non-empty address', async () => {
    mockWallet.getBalance.mockResolvedValue({
      onchain: { total: 10000 },
      offchain: { total: 0 },
    });

    const result = await tool.handler({
      params: {
        address: '',
        amount: 1000,
      },
    } as any);

    expect(result.content[0].text).toBe('Address cannot be empty');
  });

  it('should check for insufficient funds', async () => {
    mockWallet.getBalance.mockResolvedValue({
      onchain: { total: 500 },
      offchain: { total: 0 },
    });

    const result = await tool.handler({
      params: {
        address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
        amount: 1000,
      },
    } as any);

    expect(result.content[0].text).toBe('Insufficient funds. Available balance: 500 sats');
  });

  it('should send bitcoin successfully', async () => {
    const txid = '1234567890abcdef';
    mockWallet.getBalance.mockResolvedValue({
      onchain: { total: 10000 },
      offchain: { total: 0 },
    });
    mockWallet.sendBitcoin.mockResolvedValue(txid);

    const result = await tool.handler({
      params: {
        address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
        amount: 1000,
      },
    } as any);

    expect(mockWallet.sendBitcoin).toHaveBeenCalledWith({
      address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
      amount: 1000,
    }, true);
    expect(result.content[0].text).toBe(`Successfully sent 1000 sats to tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx\nTransaction ID: ${txid}`);
  });

  it('should handle wallet initialization error', async () => {
    (state.getWalletState as any).mockReturnValue({ initialized: false });

    const result = await tool.handler({
      params: {
        address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
        amount: 1000,
      },
    } as any);

    expect(result.content[0].text).toBe('Wallet is not initialized. Please set up a wallet first.');
  });

  it('should handle send error', async () => {
    mockWallet.getBalance.mockResolvedValue({
      onchain: { total: 10000 },
      offchain: { total: 0 },
    });
    mockWallet.sendBitcoin.mockRejectedValue(new Error('Network error'));

    const result = await tool.handler({
      params: {
        address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
        amount: 1000,
      },
    } as any);

    expect(result.content[0].text).toBe('Error sending Bitcoin: Network error');
  });
});
