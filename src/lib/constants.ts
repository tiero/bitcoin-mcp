import path from 'path';

// Define the data directory for storing wallet data
export const DATA_DIR = path.join(
  process.env.HOME || process.env.USERPROFILE || '.',
  '.bitcoin-mcp'
);

// Define paths for wallet files
export const WALLET_STATE_PATH = path.join(DATA_DIR, 'wallet-state.json');
export const KEY_PATH = path.join(DATA_DIR, 'wallet-key.json');
