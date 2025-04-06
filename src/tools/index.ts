import { handleCommand } from './commands';
import { z } from 'zod';

// Define the tools with their schemas and handlers
export const tools = [
  {
    name: 'balance',
    description: 'Get wallet balances including onchain, offchain, and USD value',
    schema: z.object({
      command: z.literal('balance')
    }),
    handler: handleCommand
  }
];

// Export all tools
export const allTools = tools;
