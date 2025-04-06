import { handleCommand } from './commands.js';
import { z } from 'zod';
import { checkWalletExists, WalletResponse } from '../state.js';

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
    name: 'balance',
    description: 'Get wallet balances including onchain, offchain, and USD value',
    schema: z.object({
      command: z.literal('balance')
    }),
    handler: withWalletCheck(handleCommand)
  }
];

// Export all tools
export const allTools = tools;
