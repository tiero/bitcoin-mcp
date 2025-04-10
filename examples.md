# Bitcoin MCP Examples

This document provides examples of how to interact with the Bitcoin MCP tools through Claude.

## Basic Wallet Operations

### Setting Up Your Wallet

**You:** I need to set up a Bitcoin wallet.

**Claude:** Let me help you create one.

_Claude uses the `setup_wallet` tool with the following parameters:_

- network: "mutinynet" (default)

**Claude:** Bitcoin wallet successfully initialized on mutinynet!

### Getting Your Wallet Address

**You:** What's my Bitcoin address?

**Claude:** Let me check your Bitcoin wallet addresses.

_Claude uses the `get_address` tool_

**Claude:** Here are your Bitcoin wallet addresses:

- On-chain address: bc1qxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
- Ark address: 03xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

### Checking Your Wallet Balance

**You:** Show me my wallet balances.

**Claude:** Let me check your Bitcoin wallet balance.

_Claude uses the `get_balance` tool_

**Claude:** Here's your current wallet balance:

- Total: 0.15 BTC
- On-chain: 0.1 BTC
- Off-chain: 0.05 BTC

This is testnet Bitcoin on the Mutinynet network, which isn't real Bitcoin that can be exchanged for actual currency.

## Wallet Operations

### Sending Bitcoin on-chain

**You:** Send 0.001 BTC to bc1qyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy

**Claude:** I'll help you send that Bitcoin. Consider it done!

_Claude uses the `send_bitcoin` tool with the following parameters:_

- address: bc1qyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
- amount: 0.001

**Claude:** Bitcoin sent successfully! You can check your updated balance with the get_balance tool.

### Sending Bitcoin off-chain to an Ark address

**You:** Send 0.001 BTC to tark1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

**Claude:** I'll help you send that Bitcoin. Consider it done!

_Claude uses the `send_bitcoin` tool with the following parameters:_

- address: tark1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
- amount: 0.001

**Claude:** Bitcoin sent using the Ark 0x... successfully! You can check your updated balance with the get_balance tool.

## Tips for Effective Use

1. **Network Selection** - The wallet is configured to use mutinynet by default with these settings:

   - Network: mutinynet
   - Esplora URL: https://mutinynet.com/api
   - Ark Server URL: https://mutinynet.arkade.sh

2. **Available Tools**

   - `setup_wallet`: Create or restore a Bitcoin wallet
   - `get_address`: Get your Bitcoin wallet addresses
   - `get_balance`: Check your wallet balance
   - `send_bitcoin`: Send Bitcoin to an address
   - `get_wallet_status`: Check wallet status and initialization

3. **Security Best Practices**

   - Always verify addresses before sending
   - Use appropriate fee rates
   - Back up your wallet seed phrase
   - Keep your Ark Server public key secure
   - Use mutinynet for development and testing

4. **Testing**

   - Test transactions with small amounts first
   - Verify transaction details before sending

5. **Error Handling**
   - If you see "Wallet is not initialized", use `setup_wallet` first
   - Always check your balance before sending
   - Verify network status if transactions are slow
