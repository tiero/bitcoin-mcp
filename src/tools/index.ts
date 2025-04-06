import { setupWalletTool, getWalletStatusTool, getAddressesTool, getBalanceTool } from './commands.js';
import { z } from 'zod';
import { checkWalletExists, WalletResponse } from '../lib/state.js';
import { handleSendBitcoin } from './wallet.js';

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

// Define all tools in one place
export const tools = [
  setupWalletTool,
  getWalletStatusTool,
  getAddressesTool,
  getBalanceTool,
  {
    name: 'send_bitcoin',
    description: 'Send Bitcoin to an address',
    schema: {
      params: z.object({
        address: z.string(),
        amount: z.number().positive(),
        feeRate: z.number().positive().optional()
      })
    },
    handler: withWalletCheck(handleSendBitcoin)
  }
];
