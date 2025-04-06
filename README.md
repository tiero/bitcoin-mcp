# Bitcoin MCP

A Model Context Protocol (MCP) server that provides Bitcoin tools for AI applications like Claude Desktop and Cursor, allowing them to interact with the Bitcoin Network and manage wallet operations.

## Overview

The Bitcoin MCP server extends any MCP client's capabilities by providing tools to do anything with Bitcoin:

- Retrieve Bitcoin wallet balances (onchain and offchain)
- Real-time Bitcoin price conversion
- Cache-optimized price fetching via blockchain.info
- Strongly typed wallet operations
- Comprehensive error handling and fallbacks
- Schema validation with Zod
- Integration with @arklabs/wallet-sdk

## Development

This project uses:
- [pnpm](https://pnpm.io/) - Package manager
- [Vite](https://vitejs.dev/) - Build system
- [Vitest](https://vitest.dev/) - Testing framework
- [TypeScript](https://www.typescriptlang.org/) - Language
- [Zod](https://zod.dev/) - Schema validation

## Roadmap

### Phase 1: Core Balance Implementation
- [x] Setup project structure and tooling
- [x] Implement Bitcoin price fetching strategy
  - Primary source: blockchain.info/ticker
  - 1-minute cache duration
  - Fallback mechanism
- [ ] Balance calculation
  - Onchain balance integration
  - Offchain balance integration
  - Fiat conversion with timestamps
- [ ] Schema validation with Zod
- [ ] Comprehensive test coverage

### Phase 2: SDK Integration
- [ ] Import core functionality from '@arklabs/wallet-sdk'
- [ ] Implement strongly typed interfaces
- [ ] Add wallet operation patterns
- [ ] Integration tests

### Phase 3: Error Handling & Reliability
- [ ] Implement error logging system
- [ ] Add fallback mechanisms
- [ ] Enhance debugging messages
- [ ] Performance monitoring
- [ ] Cache optimization

### Phase 4: Documentation & Maintenance
- [ ] API documentation
- [ ] Usage examples
- [ ] Contributing guidelines
- [ ] Performance benchmarks
- [ ] Security guidelines

## Contributing

Please follow our development guidelines:

1. **Minimal Dependencies**: Only add dependencies that provide 10x improvement
2. **Single Responsibility**: Focus on one feature/fix at a time
3. **Code Consistency**: Use Prettier and ESLint
4. **Testing**: Write unit tests for core logic
5. **TypeScript**: Use strong typing, avoid `any`
6. **Git Workflow**: Use feature branches and clear commit messages
