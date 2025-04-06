import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  initializeWallet,
  loadKeyFromDisk,
  saveKeyToDisk,
  generateNewKey,
} from '../src/lib/wallet.js';
import fs from 'fs';
import path from 'path';

// Mock fs module
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    writeFileSync: vi.fn(),
    readFileSync: vi.fn(),
    mkdirSync: vi.fn(),
  },
}));

// Mock path module
vi.mock('path', () => ({
  default: {
    join: vi.fn().mockImplementation((...args) => args.join('/')),
  },
}));

describe('Wallet Functions', () => {
  // Original console methods
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  beforeEach(() => {
    // Reset all mocks before each test
    vi.resetAllMocks();

    // Mock console methods to prevent output during tests
    console.log = vi.fn();
    console.error = vi.fn();
  });

  afterEach(() => {
    // Clean up after each test
    vi.restoreAllMocks();

    // Restore original console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe('generateNewKey', () => {
    it('should generate a 64 character hex string', () => {
      const key = generateNewKey();

      // Should be a string
      expect(typeof key).toBe('string');

      // Should be 64 characters (32 bytes in hex)
      expect(key.length).toBe(64);

      // Should be a valid hex string
      expect(/^[0-9a-f]+$/i.test(key)).toBe(true);
    });
  });

  describe('saveKeyToDisk', () => {
    it('should write the key data to the file system', () => {
      const mockKeyData = {
        privateKeyHex:
          '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        createdAt: 1648671600000,
      };

      saveKeyToDisk(mockKeyData);

      // Should call writeFileSync with the correct parameters
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        JSON.stringify(mockKeyData, null, 2),
        'utf-8'
      );
    });
  });

  describe('loadKeyFromDisk', () => {
    it('should return null if the key file does not exist', () => {
      // Mock that the file does not exist
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = loadKeyFromDisk();

      // Should return null
      expect(result).toBeNull();
    });

    it('should return key data if the file exists and is valid', () => {
      // Mock that the file exists
      vi.mocked(fs.existsSync).mockReturnValue(true);

      // Mock the file content
      const mockKeyData = {
        privateKeyHex:
          '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        createdAt: 1648671600000,
      };

      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockKeyData));

      const result = loadKeyFromDisk();

      // Should return the key data
      expect(result).toEqual(mockKeyData);
    });

    it('should return null if the file exists but is invalid', () => {
      // Mock that the file exists
      vi.mocked(fs.existsSync).mockReturnValue(true);

      // Mock an invalid file content
      vi.mocked(fs.readFileSync).mockReturnValue('invalid json');

      const result = loadKeyFromDisk();

      // Should return null
      expect(result).toBeNull();

      // Check that console.error was called with an error
      expect(console.error).toHaveBeenCalled();
    });
  });
});
