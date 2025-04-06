import { z } from 'zod';
import { BalanceResponseSchema } from './balance';
import { Wallet } from '@arklabs/wallet-sdk';
import { getBalance } from './balance';

// Command schemas
export const CommandSchema = z.discriminatedUnion('command', [
  z.object({
    command: z.literal('balance'),
    response: BalanceResponseSchema
  }),
  // Add other commands here
]);

// Command handlers
export async function handleCommand(command: unknown, wallet: Wallet) {
  const parsedCommand = CommandSchema.parse(command);

  switch (parsedCommand.command) {
    case 'balance':
      return await getBalance(wallet);
    default:
      throw new Error(`Unknown command: ${parsedCommand.command}`);
  }
}
