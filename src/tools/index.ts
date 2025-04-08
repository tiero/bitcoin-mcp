import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { checkWalletExists } from '../lib/state.js';
import { Tool, ToolHandler } from './types.js';

// Import all tools
import { tool as setupWalletTool } from './setup-wallet.js';
import { tool as getBalanceTool } from './get-balance.js';
import { tool as sendBitcoinTool } from './send-bitcoin.js';
import { tool as getAddressTool } from './get-address.js';

// Wrap handler with wallet check
const withWalletCheck = (handler: ToolHandler): ToolHandler => {
  return async (extra) => {
    const walletCheck = checkWalletExists();
    if (!walletCheck.success) {
      return {
        content: [
          {
            type: 'text',
            text: 'Wallet is not initialized. Please set up a wallet first.',
          },
        ],
        tools: [
          {
            name: 'setup_wallet',
            description: 'Create or restore a Bitcoin wallet',
          },
        ],
        resources: [
          {
            uri: 'bitcoin://wallet/status',
            description: 'Check wallet status',
          },
        ],
      };
    }

    try {
      return await handler(extra);
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: error instanceof Error ? error.message : 'Unknown error',
          },
        ],
      };
    }
  };
};

// All available tools
const tools: Tool[] = [
  setupWalletTool,
  getBalanceTool,
  sendBitcoinTool,
  getAddressTool,
];

export const registerTools = (server: McpServer): void => {
  for (const tool of tools) {
    server.tool(tool.name, async (extra: any) => {
      const handler =
        tool.name === 'setup_wallet'
          ? tool.handler
          : withWalletCheck(tool.handler);

      try {
        // If schema exists and params are provided, validate them
        if (tool.schema && extra.params !== undefined) {
          const validatedParams = tool.schema.parse(extra.params);
          return await handler({ params: validatedParams });
        }

        // If no schema or no params, just pass through
        return await handler({ params: {} });
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: error instanceof Error ? error.message : 'Unknown error',
            },
          ],
          isError: true,
        };
      }
    });
  }
};
