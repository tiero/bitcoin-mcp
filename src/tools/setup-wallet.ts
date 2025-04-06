import { z } from 'zod';
import { initializeWallet, generateNewKey, saveKeyToDisk, loadKeyFromDisk, type KeyData } from '../lib/wallet.js';
import { Tool, ToolResponse } from './types.js';

// Schema
export const schema = z.object({
  action: z.enum(["create", "restore"]),
  privateKey: z.string().optional(),
  network: z.enum(["mutinynet", "bitcoin", "testnet", "signet"]).default("mutinynet"),
  arkServerUrl: z.string().url().optional(),
  esploraUrl: z.string().url().optional()
});

// Handler
const handler: Tool['handler'] = async ({ params }) => {
  const { action, privateKey, network, arkServerUrl, esploraUrl } = params as z.infer<typeof schema>;

  try {
    // Generate or use provided key
    const keyData: KeyData = action === 'create' 
      ? { privateKeyHex: await generateNewKey(), createdAt: Date.now() }
      : { privateKeyHex: privateKey!, createdAt: Date.now() };

    // Save key to disk
    await saveKeyToDisk(keyData);

    // Initialize wallet with network
    await initializeWallet(network);

    return {
      content: [{ 
        type: "text", 
        text: `Wallet successfully ${action === 'create' ? 'created' : 'restored'} on ${network} network.`
      }]
    };
  } catch (error) {
    return {
      content: [{ 
        type: "text", 
        text: error instanceof Error ? error.message : 'Failed to setup wallet'
      }],
      isError: true
    };
  }
};

// Tool definition
export const tool: Tool = {
  name: 'setup_wallet',
  schema,
  handler
};
