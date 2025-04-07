import { z } from 'zod';
import { Tool } from './types.js';
import { initializeWallet } from '../lib/wallet.js';
import { getWalletState } from '../lib/state.js';
import { UnifiedPaymentSchema } from './schemas.js';

export type Payment = z.infer<typeof UnifiedPaymentSchema>;

export const sendBitcoin: Tool = {
  name: 'send_bitcoin',
  description: 'Send Bitcoin or Ark to a specified address',
  schema: UnifiedPaymentSchema,
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
      const payment = UnifiedPaymentSchema.parse(params);

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

      return {
        content: [
          {
            type: 'text',
            text: `Successfully sent ${payment.amount} satoshis to address:\n` +
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
