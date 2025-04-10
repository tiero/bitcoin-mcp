# Bitcoin MCP

![Bitcoin MCP Demo](bitcoin-mcp-video-compressed.gif)

A Model Context Protocol (MCP) server that provides Bitcoin tools for AI applications like Claude Desktop and Cursor, allowing them to interact with the Bitcoin Network and manage wallet operations.

## Overview

The Bitcoin MCP server extends any MCP client's capabilities by providing tools to do anything with Bitcoin:

- Create and restore Bitcoin and Ark wallets
- Send Bitcoin and Ark transactions
- Retrieve Bitcoin and Ark wallet balances
- Real-time Bitcoin price conversion
- Cache-optimized price fetching via blockchain.info
- Strongly typed wallet operations
- Comprehensive error handling and fallbacks
- Schema validation with Zod
- Integration with `@arklabs/wallet-sdk`

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

## License

MIT License
