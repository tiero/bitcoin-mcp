import { z } from "zod";
import { InMemoryKey, Wallet } from '@arklabs/wallet-sdk';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { randomBytes } from 'crypto';
import { ensureDataDirectory } from './state.js';

// Define the data directory for storing keys
const DATA_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.ark-wallet-mcp');

// Ensure data directory exists
ensureDataDirectory();

const KEY_PATH = path.join(DATA_DIR, 'bitcoin-ark-wallet-key.json');

// Schema for stored key data
const KeyDataSchema = z.object({
  privateKeyHex: z.string(),
  createdAt: z.number(),
});

type KeyData = z.infer<typeof KeyDataSchema>;

// Function to create a readline interface for user input
function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

// Function to generate a new random private key
export function generateNewKey(): string {
  return randomBytes(32).toString('hex');
}

// Function to save key data to disk
export function saveKeyToDisk(keyData: KeyData): void {
  fs.writeFileSync(KEY_PATH, JSON.stringify(keyData, null, 2));
  console.log(`Key saved to ${KEY_PATH}`);
}

// Function to load key data from disk
export function loadKeyFromDisk(): KeyData | null {
  if (!fs.existsSync(KEY_PATH)) {
    return null;
  }
  
  try {
    const data = fs.readFileSync(KEY_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    return KeyDataSchema.parse(parsed);
  } catch (error) {
    console.error('Error loading key:', error);
    return null;
  }
}

// Function to initialize wallet
export async function initializeWallet(
  network: string = 'mutinynet'
): Promise<Wallet> {
  let keyData = loadKeyFromDisk();
  
  if (!keyData) {
    // Use directly without prompting
    const newPrivateKey = generateNewKey();
    keyData = {
      privateKeyHex: newPrivateKey,
      createdAt: Date.now()
    };
    
    saveKeyToDisk(keyData);
  }
  
  const identity = InMemoryKey.fromHex(keyData.privateKeyHex);

  
  const wallet = await Wallet.create({
    network: network as any,
    identity,
    esploraUrl: 'https://mutinynet.com/api',
    arkServerUrl: 'https://mutinynet.arkade.sh',
    arkServerPublicKey: 'fa73c6e4876ffb2dfc961d763cca9abc73d4b88efcb8f5e7ff92dc55e9aa553d'
  });

  return wallet;
}

// Export the KeyData type for use in other modules
export type { KeyData };