import { z } from 'zod';

// Tool schemas
export const setupWalletSchema = z.object({
  action: z.enum(["create", "restore"]),
  privateKey: z.string().optional(),
  network: z.enum(["mutinynet", "mainnet", "testnet"]).default("mutinynet"),
  arkServerUrl: z.string().url().optional(),
  esploraUrl: z.string().url().optional()
});

export const getWalletStatusSchema = z.object({});
export const getAddressesSchema = z.object({});
export const getBalanceSchema = z.object({});

export const sendBitcoinSchema = z.object({
  address: z.string(),
  amount: z.number().positive(),
  feeRate: z.number().positive().optional()
});
