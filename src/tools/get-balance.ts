import { z } from 'zod';
import { getBalance, type BalanceResponse } from './balance.js';
import { Tool, ToolResponse } from './types.js';
import { InMemoryKey, Wallet } from '@arklabs/wallet-sdk';
import { loadKeyFromDisk } from '../lib/wallet.js';

// Schema
export const schema = z.object({
  fiat: z.enum(["USD", "EUR", "GBP"]).optional(),
}).optional();

// Handler
const handler: Tool['handler'] = async ({ params }) => {
  try {
    const options = params as z.infer<typeof schema>;
    const keyData = loadKeyFromDisk();
    if (!keyData) {
      throw new Error('No wallet key found');
    }
    
    const identity = InMemoryKey.fromHex(keyData.privateKeyHex);
    const wallet = await Wallet.create({
      network: 'mutinynet',
      identity
    });
    
    const balance = await getBalance(wallet);

    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify({
          onchain: balance.onchain,
          offchain: balance.offchain,
          total: balance.total,
          ...(balance.fiat && {
            fiat: {
              currency: "USD",
              rate: balance.fiat.usd,
              value: balance.total * balance.fiat.usd,
              timestamp: balance.fiat.timestamp
            }
          })
        }, null, 2)
      }]
    };
  } catch (error) {
    return {
      content: [{ 
        type: "text", 
        text: error instanceof Error ? error.message : 'Failed to get balance'
      }],
      isError: true
    };
  }
};

// Tool definition
export const tool: Tool = {
  name: 'get_balance',
  schema,
  handler
};
