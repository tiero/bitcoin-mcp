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
        type: 'bitcoin',
        address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
        amount: 0,
      },
    } as any);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Number must be greater than 0');
  });

  it('should validate non-empty address', async () => {
    mockWallet.getBalance.mockResolvedValue({
      onchain: { total: 10000 },
      offchain: { total: 0 },
    });

    const result = await tool.handler({
      params: {
        type: 'bitcoin',
        address: '',
        amount: 1000,
      },
    } as any);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Address cannot be empty');
  });

  it('should check for insufficient funds', async () => {
    mockWallet.getBalance.mockResolvedValue({
      onchain: { total: 500 },
      offchain: { total: 0 },
    });

    const result = await tool.handler({
      params: {
        type: 'bitcoin',
        address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
        amount: 1000,
      },
    } as any);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe('Insufficient balance. You have 500 satoshis, but trying to send 1000 satoshis.');
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
        type: 'bitcoin',
        address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
        amount: 1000,
      },
    } as any);

    expect(mockWallet.sendBitcoin).toHaveBeenCalledWith({
      address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
      amount: 1000,
      feeRate: undefined,
    });

    expect(result.content[0].text).toBe(
      'Successfully sent 1000 satoshis to Bitcoin address:\n' +
      'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx\n\n' +
      'Transaction ID: 1234567890abcdef'
    );
    expect(result.resources).toEqual([
      {
        uri: 'bitcoin://tx/1234567890abcdef',
        description: 'Transaction details',
      },
    ]);
  });

  it('should send bitcoin with custom fee rate', async () => {
    const txid = '1234567890abcdef';
    mockWallet.getBalance.mockResolvedValue({
      onchain: { total: 10000 },
      offchain: { total: 0 },
    });
    mockWallet.sendBitcoin.mockResolvedValue(txid);

    const result = await tool.handler({
      params: {
        type: 'bitcoin',
        address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
        amount: 1000,
        feeRate: 5,
      },
    } as any);

    expect(mockWallet.sendBitcoin).toHaveBeenCalledWith({
      address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
      amount: 1000,
      feeRate: 5,
    });

    expect(result.content[0].text).toBe(
      'Successfully sent 1000 satoshis to Bitcoin address:\n' +
      'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx\n\n' +
      'Transaction ID: 1234567890abcdef'
    );
  });

  it('should handle wallet not initialized', async () => {
    (state.getWalletState as any).mockReturnValue({ initialized: false });

    const result = await tool.handler({
      params: {
        type: 'bitcoin',
        address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
        amount: 1000,
      },
    } as any);

    expect(result.content[0].text).toBe(
      "I see you haven't set up a wallet yet. Would you like me to help you create one with the setup_wallet tool?"
    );
    expect(result.tools).toEqual([
      { name: 'setup_wallet', description: 'Create or restore a Bitcoin wallet' },
    ]);
  });
});
