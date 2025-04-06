import { z } from 'zod';
import { InMemoryKey, Wallet } from '@arklabs/wallet-sdk';
import fs from 'fs';
import readline from 'readline';
import { randomBytes } from 'crypto';
import { ensureDataDirectory } from './state.js';
import { DATA_DIR, KEY_PATH } from './constants.js';

// Ensure data directory exists
ensureDataDirectory();

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
    output: process.stdout,
  });
}

// Function to generate a new random private key
export function generateNewKey(): string {
  return randomBytes(32).toString('hex');
}

// Function to save key data to disk
export function saveKeyToDisk(keyData: KeyData): void {
  try {
    // Validate key data before saving
    const validatedData = KeyDataSchema.parse(keyData);
    const jsonString = JSON.stringify(validatedData, null, 2);
    fs.writeFileSync(KEY_PATH, jsonString, 'utf-8');
  } catch (error) {
    console.error('Error saving key:', error);
    throw new Error(
      `Failed to save key: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// Function to load key data from disk
export function loadKeyFromDisk(): KeyData | null {
  if (!fs.existsSync(KEY_PATH)) {
    return null;
  }

  try {
    const data = fs.readFileSync(KEY_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    // Validate the loaded data against our schema
    const validatedData = KeyDataSchema.parse(parsed);
    return validatedData;
  } catch (error) {
    console.error('Error loading key:', error);
    // If the file exists but is invalid, delete it to prevent future errors
    try {
      fs.unlinkSync(KEY_PATH);
    } catch (unlinkError) {
      console.error('Error deleting invalid key file:', unlinkError);
    }
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
      createdAt: Date.now(),
    };

    saveKeyToDisk(keyData);
  }

  const identity = InMemoryKey.fromHex(keyData.privateKeyHex);

  const wallet = await Wallet.create({
    network: network as any,
    identity,
    esploraUrl: 'https://mutinynet.com/api',
    arkServerUrl: 'https://mutinynet.arkade.sh',
    arkServerPublicKey:
      'fa73c6e4876ffb2dfc961d763cca9abc73d4b88efcb8f5e7ff92dc55e9aa553d',
  });

  return wallet;
}

// Export the KeyData type for use in other modules
export type { KeyData };
