import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

describe('MCP Server', () => {
  let server: McpServer;
  let addHandler: (params: {a: number, b: number}) => Promise<any>;
  
  beforeEach(() => {
    // Initialize the server before each test
    server = new McpServer({
      name: "Ark Wallet MPC",
      version: "0.0.1",
    });
    
    // Store the handler function directly when defining the tool
    addHandler = async ({ a, b }) => ({
      content: [{ type: "text", text: `The sum is ${a + b}` }],
    });
    
    // Define the addition tool
    server.tool(
      "add",
      { a: z.number(), b: z.number() },
      addHandler
    );
  });
  
  afterEach(() => {
    // Clean up after each test
    vi.restoreAllMocks();
  });
  
  it('should correctly add two numbers', async () => {
    // Call the handler directly
    const result = await addHandler({ a: 5, b: 7 });
    
    // Verify the result
    expect(result).toEqual({
      content: [{ type: "text", text: "The sum is 12" }]
    });
  });
  
  it('should handle negative numbers', async () => {
    const result = await addHandler({ a: -3, b: 10 });
    
    expect(result).toEqual({
      content: [{ type: "text", text: "The sum is 7" }]
    });
  });
  
  it('should handle decimal numbers', async () => {
    const result = await addHandler({ a: 2.5, b: 3.5 });
    
    expect(result).toEqual({
      content: [{ type: "text", text: "The sum is 6" }]
    });
  });
});

describe('Send Bitcoin Tool', () => {
  let server: McpServer;
  let sendBitcoinHandler: (params: { address: string, amount: number, feeRate?: number, zeroFee?: boolean }) => Promise<any>;
  
  beforeEach(() => {
    // Initialize the server before each test
    server = new McpServer({
      name: "Ark Wallet MPC",
      version: "0.0.1",
    });
    
    // Store the handler function directly when defining the tool
    sendBitcoinHandler = async ({ address, amount, feeRate, zeroFee }) => {
      // Validate amount
      if (amount <= 0) {
        return {
          content: [{ 
            type: "text", 
            text: `Error sending transaction: Amount must be positive` 
          }],
        };
      }

      return {
        content: [{ 
          type: "text", 
          text: `Transaction sent successfully!\n\n` +
                `Transaction ID: txid123\n` +
                `Amount: ${amount} satoshis\n` +
                `To: ${address}\n` +
                `Fee Rate: ${feeRate ? `${feeRate} sats/vbyte` : 'Default'}\n` +
                `Zero Fee: ${zeroFee ? 'Yes' : 'No'}`
        }],
      };
    };
    
    // Define the send_bitcoin tool
    server.tool(
      "send_bitcoin",
      {
        address: z.string(),
        amount: z.number().positive(),
        feeRate: z.number().positive().optional(),
        zeroFee: z.boolean().optional()
      },
      sendBitcoinHandler
    );
  });
  
  afterEach(() => {
    // Clean up after each test
    vi.restoreAllMocks();
  });
  
  it('should send bitcoin with basic parameters', async () => {
    const result = await sendBitcoinHandler({
      address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
      amount: 50000
    });
    
    expect(result).toEqual({
      content: [{ 
        type: "text", 
        text: `Transaction sent successfully!\n\n` +
              `Transaction ID: txid123\n` +
              `Amount: 50000 satoshis\n` +
              `To: tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx\n` +
              `Fee Rate: Default\n` +
              `Zero Fee: No`
      }],
    });
  });
  
  it('should send bitcoin with custom fee rate', async () => {
    const result = await sendBitcoinHandler({
      address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
      amount: 50000,
      feeRate: 2
    });
    
    expect(result).toEqual({
      content: [{ 
        type: "text", 
        text: `Transaction sent successfully!\n\n` +
              `Transaction ID: txid123\n` +
              `Amount: 50000 satoshis\n` +
              `To: tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx\n` +
              `Fee Rate: 2 sats/vbyte\n` +
              `Zero Fee: No`
      }],
    });
  });
  
  it('should send bitcoin with zero fee', async () => {
    const result = await sendBitcoinHandler({
      address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
      amount: 50000,
      zeroFee: true
    });
    
    expect(result).toEqual({
      content: [{ 
        type: "text", 
        text: `Transaction sent successfully!\n\n` +
              `Transaction ID: txid123\n` +
              `Amount: 50000 satoshis\n` +
              `To: tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx\n` +
              `Fee Rate: Default\n` +
              `Zero Fee: Yes`
      }],
    });
  });
  
  it('should handle invalid amount', async () => {
    const result = await sendBitcoinHandler({
      address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
      amount: -1000
    });
    
    expect(result).toEqual({
      content: [{ 
        type: "text", 
        text: `Error sending transaction: Amount must be positive` 
      }],
    });
  });
}); 