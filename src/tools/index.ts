import { z } from 'zod';
import { checkWalletExists, WalletResponse } from '../lib/state.js';
import { 
  handleGetWalletStatus,
  handleGetAddresses,
  handleGetBalance,
  handleSendBitcoin,
  WalletToolSchemas
} from './wallet.js';

// Wrap handler with wallet check
const withWalletCheck = (handler: Function) => async (...args: any[]): Promise<WalletResponse> => {
  const walletCheck = checkWalletExists();
  if (!walletCheck.success) {
    return walletCheck;
  }
  
  try {
    const result = await handler(...args);
    return { success: true, data: result };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// Define the tools with their schemas and handlers
export const tools = [
  {
    name: 'get_wallet_status',
    description: 'Get the current status of the wallet',
    schema: { params: WalletToolSchemas.getWalletStatus },
    handler: withWalletCheck(handleGetWalletStatus)
  },
  {
    name: 'get_addresses',
    description: 'Get all wallet addresses',
    schema: { params: WalletToolSchemas.getAddresses },
    handler: withWalletCheck(handleGetAddresses)
  },
  {
    name: 'get_balance',
    description: 'Get wallet balances including onchain, offchain, and USD value',
    schema: { params: WalletToolSchemas.getBalance },
    handler: withWalletCheck(handleGetBalance)
  },
  {
    name: 'send_bitcoin',
    description: 'Send Bitcoin to an address',
    schema: { params: WalletToolSchemas.sendBitcoin },
    handler: withWalletCheck(handleSendBitcoin)
  }
];

export { setupWalletTool, getWalletStatusTool, getAddressesTool, getBalanceTool } from './commands.js';
