# Solana Token Mint

> Free, open-source tool to create and mint SPL tokens on Solana blockchain with IPFS metadata support.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Website](https://img.shields.io/badge/Website-solanatokenmint.xyz-blue)](https://solanatokenmint.xyz)
[![GitHub](https://img.shields.io/badge/GitHub-Open%20Source-green)](https://github.com/coderwithgpt/solana-token-mint-xyz)

## ✨ Features

- 🚀 **Fast & Simple** - Create SPL tokens in seconds with an intuitive interface
- 🔒 **Secure** - Your keys, your tokens. All transactions are signed locally
- 🌐 **IPFS Metadata** - Decentralized metadata storage via Pinata
- 📝 **Full Metadata Support** - Name, symbol, description, image, and social links
- 🔧 **Token Management** - Update metadata and revoke authorities for existing tokens
- 🎨 **Modern UI** - Clean, professional interface built with React and TailwindCSS
- 🔓 **Open Source** - Fully open-source, transparent, and community-driven

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- A Solana wallet (Phantom, Solflare, etc.)
- Pinata API JWT token ([Get one here](https://app.pinata.cloud/developers/api-keys))

### Installation

```bash
# Clone the repository
git clone https://github.com/coderwithgpt/solana-token-mint-xyz.git
cd solana-token-mint-xyz

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Visit `http://localhost:5173` to use the application.

## 📖 Usage

### Creating a New Token

1. **Connect Wallet** - Click "Select Wallet" and connect your Solana wallet
2. **Configure Pinata** - Enter your Pinata JWT token (saved locally)
3. **Upload Image** - Upload your token image (PNG, JPG, GIF up to 5MB)
4. **Fill Details**:
   - Token Name (e.g., "My Awesome Token")
   - Symbol (e.g., "MAT")
   - Decimals (default: 9)
   - Total Supply (use quick buttons: 100M or 1B)
   - Description (optional)
   - Social Links (optional): Website, Twitter, Telegram, Discord
5. **Optional**: Choose to revoke Mint Authority and/or Freeze Authority
6. **Create Token** - Sign the transaction and your token will be created!

### Managing Existing Tokens

#### Update Metadata

1. Switch to "Manage Existing" tab
2. Enter the token mint address
3. The system will automatically fetch:
   - Current Update Authority
   - Mutable status
   - Current name and symbol
4. Upload new image or enter image URL manually
5. Update name, symbol, description, and social links
6. Click "Update Metadata" and sign the transaction

#### Revoke Authorities

1. Switch to "Manage Existing" tab → "Revoke Authorities"
2. Enter the token mint address
3. View current Mint Authority and Freeze Authority status
4. Select which authorities to revoke (irreversible!)
5. Click "Revoke Selected Authorities" and sign the transaction

## 🏗️ Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Blockchain**: 
  - `@solana/web3.js` - Solana blockchain interaction
  - `@solana/spl-token` - SPL token operations
  - `@solana/wallet-adapter-react` - Wallet integration
- **IPFS**: Pinata API
- **Icons**: Lucide React

## 📁 Project Structure

```
spl-launch/
├── src/
│   ├── components/
│   │   ├── CreateTokenTab.tsx    # Token creation form
│   │   ├── ManageTokenTab.tsx     # Token management (update/revoke)
│   │   ├── TokenForm.tsx          # Main form container with tabs
│   │   ├── Header.tsx             # App header with network selector
│   │   └── ImageUpload.tsx        # Image upload component
│   ├── contexts/
│   │   └── WalletContextProvider.tsx  # Solana wallet context
│   ├── utils/
│   │   ├── solana.ts              # Solana blockchain utilities
│   │   └── ipfs.ts                # IPFS/Pinata utilities
│   ├── App.tsx                     # Main app component
│   └── main.tsx                    # Entry point
├── public/
│   ├── favicon.ico                 # Site favicon
│   └── logo.png                    # App logo
└── package.json
```

## 🔐 Security Notes

- **Private Keys**: Never share your wallet private keys. All signing happens locally in your wallet.
- **Pinata JWT**: Your Pinata JWT is stored locally in browser localStorage. Never commit it to version control.
- **Network**: By default, the app connects to Solana Devnet. Switch to Mainnet only when ready.
- **Revoke Authorities**: Revoking Mint/Freeze authorities is **irreversible**. Make sure you understand the implications.

## 🌐 Networks

The application supports all Solana networks:
- **Devnet** (default) - For testing
- **Testnet** - For testing
- **Mainnet** - Production network

Switch networks using the dropdown in the header.

## 📝 Token Metadata Format

The generated metadata follows the Metaplex Token Metadata standard:

```json
{
  "name": "Token Name",
  "symbol": "SYMBOL",
  "description": "Token description",
  "image": "https://ipfs.io/ipfs/...",
  "extensions": {
    "website": "https://yourproject.com",
    "twitter": "https://x.com/yourhandle",
    "telegram": "https://t.me/yourgroup",
    "discord": "https://discord.gg/xxx"
  }
}
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built for [LayerZero](https://layerzero.network) cross-chain integration
- Powered by [Solana](https://solana.com)
- IPFS storage via [Pinata](https://pinata.cloud)

## 🔗 Links

- **Website**: [solanatokenmint.xyz](https://solanatokenmint.xyz)
- **GitHub**: [github.com/coderwithgpt/solana-token-mint-xyz](https://github.com/coderwithgpt/solana-token-mint-xyz)
- **Solana Docs**: [docs.solana.com](https://docs.solana.com)
- **Metaplex Docs**: [docs.metaplex.com](https://docs.metaplex.com)

---

Made with ❤️ for the Solana community

