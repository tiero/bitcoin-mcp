import { z } from 'zod';
import { Tool, ToolResponse } from './types.js';
import { InMemoryKey, Wallet } from '@arklabs/wallet-sdk';
import { loadKeyFromDisk } from '../lib/wallet.js';

// Schema
export const schema = z.object({
  address: z.string(),
  amount: z.number().positive(),
  feeRate: z.number().positive().optional()
});

// Handler
const handler: Tool['handler'] = async ({ params }) => {
  try {
    const { address, amount, feeRate } = params as z.infer<typeof schema>;
    
    const keyData = loadKeyFromDisk();
    if (!keyData) {
      throw new Error('No wallet key found');
    }
    
    const identity = InMemoryKey.fromHex(keyData.privateKeyHex);
    const wallet = await Wallet.create({
      network: 'mutinynet',
      identity
    });
    
    const txid = await wallet.sendBitcoin({
      address,
      amount,
      feeRate
    });

    return {
      content: [
        {
          type: "text",
          text: "Transaction sent successfully!"
        },
        {
          type: "text",
          text: `Transaction ID: ${txid}`
        }
      ]
    };
  } catch (error) {
    return {
      content: [{ 
        type: "text", 
        text: error instanceof Error ? error.message : 'Failed to send bitcoin'
      }],
      isError: true
    };
  }
};

// Tool definition
export const tool: Tool = {
  name: 'send_bitcoin',
  schema,
  handler
};
