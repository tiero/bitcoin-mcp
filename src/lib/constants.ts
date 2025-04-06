import path from 'path';

// Define the data directory for storing wallet data
export const DATA_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.ark-wallet-mcp');

// Define paths for wallet files
export const WALLET_STATE_PATH = path.join(DATA_DIR, 'wallet-state.json');
export const KEY_PATH = path.join(DATA_DIR, 'bitcoin-ark-wallet-key.json');
