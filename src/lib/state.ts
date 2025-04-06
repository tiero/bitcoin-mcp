import fs from 'fs';
import { DATA_DIR, WALLET_STATE_PATH } from './constants.js';

export function ensureDataDirectory(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getWalletState(): WalletState {
  if (fs.existsSync(WALLET_STATE_PATH)) {
    try {
      const data = fs.readFileSync(WALLET_STATE_PATH, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading wallet state:', error);
    }
  }

  return {
    initialized: false,
    network: 'mutinynet',
    createdAt: Date.now(),
  };
}

export function saveWalletState(state: WalletState): void {
  fs.writeFileSync(WALLET_STATE_PATH, JSON.stringify(state, null, 2));
}

export interface WalletState {
  initialized: boolean;
  network: string;
  createdAt: number;
  lastAccessed?: number;
}

export interface WalletResponse {
  success: boolean;
  data?: any;
  error?: string;
  needsWallet?: boolean;
  options?: {
    create: string;
    import: string;
  };
}

export function checkWalletExists(): WalletResponse {
  const state = getWalletState();

  if (!state.initialized) {
    return {
      success: false,
      needsWallet: true,
      error: 'Wallet not initialized',
      options: {
        create: 'Create a new wallet',
        import: 'Import existing wallet',
      },
    };
  }

  return { success: true };
}
