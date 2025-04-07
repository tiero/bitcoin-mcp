import { z } from 'zod';
import { Tool } from './types.js';
import { initializeWallet } from '../lib/wallet.js';
import { getWalletState } from '../lib/state.js';

// Payment schemas
const BitcoinPaymentSchema = z.object({
  type: z.literal('bitcoin'),
  address: z.string().min(1, 'Address cannot be empty'),
  amount: z.number().int().positive(),
  feeRate: z.number().positive().optional(),
});

const ArkPaymentSchema = z.object({
  type: z.literal('ark'),
  address: z.string().min(1, 'Address cannot be empty'),
  amount: z.number().int().positive(),
  feeRate: z.number().positive().optional(),
});

export const PaymentSchema = z.discriminatedUnion('type', [
  BitcoinPaymentSchema,
  ArkPaymentSchema,
]);

export type Payment = z.infer<typeof PaymentSchema>;

export const sendBitcoin: Tool = {
  name: 'send_bitcoin',
  description: 'Send Bitcoin to a Bitcoin or Ark address',
  schema: PaymentSchema,
  handler: async ({ params }) => {
    try {
      const walletState = getWalletState();
      if (!walletState.initialized) {
        return {
          content: [
            {
              type: 'text',
              text: "I see you haven't set up a wallet yet. Would you like me to help you create one with the setup_wallet tool?",
            },
          ],
          tools: [{ name: 'setup_wallet', description: 'Create or restore a Bitcoin wallet' }],
        };
      }

      const wallet = await initializeWallet();
      const payment = PaymentSchema.parse(params);

      // Get current balance first
      const balance = await wallet.getBalance();
      const total = balance.onchain.total + (balance.offchain?.total || 0);

      if (total < payment.amount) {
        return {
          content: [
            {
              type: 'text',
              text: `Insufficient balance. You have ${total} satoshis, but trying to send ${payment.amount} satoshis.`,
            },
          ],
          isError: true,
        };
      }

      // Send bitcoin (amount in satoshis)
      const txid = await wallet.sendBitcoin({
        address: payment.address,
        amount: payment.amount,
        feeRate: payment.feeRate,
      });

      const protocolType = payment.type === 'bitcoin' ? 'Bitcoin' : 'Ark';
      
      return {
        content: [
          {
            type: 'text',
            text: `Successfully sent ${payment.amount} satoshis to ${protocolType} address:\n` +
                  `${payment.address}\n\n` +
                  `Transaction ID: ${txid}`,
          },
        ],
        resources: [
          {
            uri: `bitcoin://tx/${txid}`,
            description: 'Transaction details',
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error sending Bitcoin: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
};

export { sendBitcoin as tool };
