import { z } from 'zod';

// Network type
export const NetworkSchema = z.enum(['bitcoin', 'testnet', 'signet', 'mutinynet']);

// Address schemas
export const BitcoinAddressSchema = z.object({
  type: z.literal('bitcoin'),
  network: NetworkSchema,
  address: z.string(),
});
export type BitcoinAddress = z.infer<typeof BitcoinAddressSchema>;

export const ArkAddressSchema = z.object({
  type: z.literal('ark'),
  network: NetworkSchema,
  address: z.string(),
});
export type ArkAddress = z.infer<typeof ArkAddressSchema>;

export type WalletAddresses = {
  bitcoin: BitcoinAddress;
  ark?: ArkAddress;
};

// Balance schemas
export const BalanceResponseSchema = z.object({
  total: z.number(),
  bitcoin: z.object({
    address: BitcoinAddressSchema,
    balance: z.number(),
  }),
  ark: z.object({
    address: ArkAddressSchema,
    balance: z.number(),
  }).optional(),
  fiat: z.object({
    usd: z.number(),
    timestamp: z.number(),
  }).optional(),
});

// Tool schemas
export const setupWalletSchema = z.object({
  action: z.enum(['create', 'restore']),
  privateKey: z.string().optional(),
  network: NetworkSchema.default('mutinynet'),
  arkServerUrl: z.string().url().optional(),
  esploraUrl: z.string().url().optional(),
});

export const getWalletStatusSchema = z.object({
  params: z.object({}),
});

export const getAddressesSchema = z.object({
  params: z.object({}),
});

export const getBalanceSchema = z.object({
  params: z.object({
    fiat: z.enum(['USD', 'EUR', 'GBP']).optional(),
  }).optional(),
});

export const sendBitcoinSchema = z.object({
  address: z.string(),
  amount: z.number().positive(),
  feeRate: z.number().positive().optional(),
});

// Payment schema
export const UnifiedPaymentSchema = z.object({
  address: z.string().min(1, 'Address cannot be empty'),
  amount: z.number().int().positive(),
  feeRate: z.number().positive().optional(),
});

export type Payment = z.infer<typeof UnifiedPaymentSchema>;
