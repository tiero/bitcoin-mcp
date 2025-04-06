import { z } from 'zod';

// Tool schemas
export const setupWalletSchema = z.object({
  action: z.enum(["create", "restore"]),
  privateKey: z.string().optional(),
  network: z.enum(["mutinynet", "bitcoin", "testnet", "signet"]).default("mutinynet"),
  arkServerUrl: z.string().url().optional(),
  esploraUrl: z.string().url().optional()
});

export const getWalletStatusSchema = {
  params: z.object({})
};

export const getAddressesSchema = {
  params: z.object({})
};

export const getBalanceSchema = {
  params: z.object({})
};

export const sendBitcoinSchema = z.object({
  address: z.string(),
  amount: z.number().positive(),
  feeRate: z.number().positive().optional()
});
