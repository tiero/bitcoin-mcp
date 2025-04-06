# Bitcoin MCP

A Model Context Protocol (MCP) server that provides Bitcoin tools for AI applications like Claude Desktop and Cursor, allowing them to interact with the Bitcoin Network and manage wallet operations.

## Overview

The Bitcoin MCP server extends any MCP client's capabilities by providing tools to do anything with Bitcoin:

- Create and restore Bitcoin wallets
- Send Bitcoin transactions
- Retrieve Bitcoin wallet balances (onchain and offchain)
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
  network?: "mutinynet" | "mainnet" | "testnet",
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

## Project Structure

```
src/
├── lib/         # Core library code
│   ├── state.ts   # Wallet state management
│   ├── types.ts   # Shared type definitions
│   └── wallet.ts  # Wallet operations
├── tools/       # MCP tool implementations
│   ├── balance.ts   # Balance functionality
│   ├── commands.ts  # Tool definitions
│   ├── schemas.ts   # Zod schemas
│   └── wallet.ts    # Wallet tools
└── index.ts     # Server entry point
```

## Roadmap

### Phase 1: Core Functionality

- [x] Setup project structure and tooling
- [x] Implement Bitcoin price fetching strategy
- [x] Balance calculation and wallet operations
- [x] Schema validation with Zod
- [x] Comprehensive test coverage

### Phase 2: Enhanced Features

- [ ] Lightning Network support
- [ ] Multi-wallet management
- [ ] Advanced transaction options
- [ ] UTXO management
- [ ] Fee estimation

### Phase 3: Security & Performance

- [ ] Security audit
- [ ] Performance optimization
- [ ] Rate limiting
- [ ] Enhanced error handling
- [ ] Monitoring and logging

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
