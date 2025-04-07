# Bitcoin MCP

A Model Context Protocol (MCP) server that provides Bitcoin tools for AI applications like Claude Desktop and Cursor, allowing them to interact with the Bitcoin Network and manage wallet operations.

## Overview

The Bitcoin MCP server extends any MCP client's capabilities by providing tools to do anything with Bitcoin:

- Create and restore Bitcoin wallets
- Send Bitcoin transactions
- Retrieve Bitcoin wallet balances (onchain and offchain) with fiat conversion
- Real-time Bitcoin price conversion
- Cache-optimized price fetching via blockchain.info
- Strongly typed wallet operations
- Comprehensive error handling and fallbacks
- Schema validation with Zod
- Integration with @arklabs/wallet-sdk

## Available Tools

### `setup_wallet`

Create or restore a Bitcoin wallet:

```typescript
{
  action: "create" | "restore",
  privateKey?: string,
  network?: "bitcoin" | "testnet" | "signet" | "mutinynet",
  arkServerUrl?: string,
  esploraUrl?: string
}
```

### `get_wallet_status`

Get the current wallet status and initialization state.

### `get_addresses`

Get all wallet addresses.

### `get_balance`

Get wallet balance with optional fiat conversion.

### `send_bitcoin`

Send Bitcoin to an address:

```typescript
{
  address: string,
  amount: number, // in satoshis
  feeRate?: number // optional fee rate
}
```

## Development

This project uses:

- [pnpm](https://pnpm.io/) - Package manager
- [Vite](https://vitejs.dev/) - Build system
- [Vitest](https://vitest.dev/) - Testing framework
- [TypeScript](https://www.typescriptlang.org/) - Language
- [Zod](https://zod.dev/) - Schema validation

### Getting Started

1. Install dependencies:

```bash
pnpm install
```

2. Run tests:

```bash
pnpm test
```

3. Build the project:

```bash
pnpm build
```

## Contributing

Please follow our development guidelines:

1. **Minimal Dependencies**: Only add dependencies that provide 10x improvement
2. **Single Responsibility**: Focus on one feature/fix at a time
3. **Code Consistency**: Use Prettier and ESLint
4. **Testing**: Write unit tests for core logic
5. **TypeScript**: Use strong typing, avoid `any`
6. **Git Workflow**: Use feature branches and clear commit messages

## License

MIT License
