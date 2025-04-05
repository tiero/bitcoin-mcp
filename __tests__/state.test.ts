import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ensureDataDirectory, getWalletState, saveWalletState } from '../src/state';
import fs from 'fs';
import path from 'path';

// Mock fs module
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    writeFileSync: vi.fn(),
    readFileSync: vi.fn(),
    mkdirSync: vi.fn()
  }
}));

// Mock path module
vi.mock('path', () => ({
  default: {
    join: vi.fn().mockImplementation((...args) => args.join('/'))
  }
}));

describe('State Management', () => {
  // Store original console methods
  const originalConsoleError = console.error;
  
  beforeEach(() => {
    // Reset all mocks before each test
    vi.resetAllMocks();
    
    // Mock process.env
    process.env.HOME = '/mock/home';
    
    // Mock console.error
    console.error = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Restore original console.error
    console.error = originalConsoleError;
  });

  describe('ensureDataDirectory', () => {
    it('should create directory if it does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      
      ensureDataDirectory();
      
      expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
    });

    it('should not create directory if it already exists', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      
      ensureDataDirectory();
      
      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });
  });

  describe('getWalletState', () => {
    it('should return default state if file does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      
      const state = getWalletState();
      
      expect(state).toEqual({
        initialized: false,
        network: 'mutinynet',
        createdAt: expect.any(Number)
      });
    });

    it('should return saved state if file exists', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      
      const mockState = {
        initialized: true,
        network: 'testnet',
        createdAt: 1234567890,
        lastAccessed: 1234567890
      };
      
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockState));
      
      const state = getWalletState();
      
      expect(state).toEqual(mockState);
    });

    it('should return default state if file exists but is invalid', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('invalid json');
      
      const state = getWalletState();
      
      expect(state).toEqual({
        initialized: false,
        network: 'mutinynet',
        createdAt: expect.any(Number)
      });
      
      // Verify that error was logged
      expect(console.error).toHaveBeenCalledWith(
        'Error loading wallet state:',
        expect.any(SyntaxError)
      );
    });
  });

  describe('saveWalletState', () => {
    it('should write state to file', () => {
      const mockState = {
        initialized: true,
        network: 'testnet',
        createdAt: 1234567890,
        lastAccessed: 1234567890
      };
      
      saveWalletState(mockState);
      
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        JSON.stringify(mockState, null, 2)
      );
    });
  });
});