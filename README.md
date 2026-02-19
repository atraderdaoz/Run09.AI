# Web3 Music Pilot (GitHub Pages + BSC Testnet)

Minimal full-stack pilot with:
- Vite frontend (no backend)
- Hardhat smart contract on BSC Testnet
- Native tBNB license payments
- In-browser Irys uploads (cover + audio + metadata.json)

## Features
1. Artist/User/Merchant subscription program (`role + tier + expiry`)
2. Per-track POL license purchase (ERC-721 license token)
3. Arweave upload flow through Irys in browser, then on-chain track registration
4. Download gated by `(has license) OR (active User subscription)`
5. Commercial status indicator from active Merchant subscription
6. Optional CPM reporting stored on-chain by owner/oracle and readable from UI

## Project structure
- `contracts/MusicPilotPlatform.sol`
- `scripts/deploy.js`
- `hardhat.config.js`
- `src/main.js`, `src/platform.js`, `src/irys.js`, `src/metadata.js`, `src/style.css`
- `.github/workflows/deploy.yml`

## Setup
```bash
npm i
cp .env.example .env
```

Update `.env` values:
- `PRIVATE_KEY`: funded BSC testnet account
- `BSC_TESTNET_RPC_URL`: BSC testnet RPC
- `VITE_PLATFORM_ADDRESS`: set after contract deployment

## Compile
```bash
npm run compile
```

## Deploy to BSC Testnet
```bash
npm run deploy:bscTestnet
```

If `PRIVATE_KEY` is missing, deploy script exits gracefully and prints instructions.

## Run app locally
```bash
npm run dev
```

## Build static app
```bash
npm run build
```

## GitHub Pages deployment
1. Ensure `vite.config.js` uses `base: "/<REPO_NAME>/"` (this repo is `Run09.AI`, so base is `/Run09.AI/`).
2. Deploy contract and copy address.
3. In GitHub repo settings → **Secrets and variables → Actions**, add secret:
   - `VITE_PLATFORM_ADDRESS` = deployed contract address
4. Push to default branch (workflow in `.github/workflows/deploy.yml` runs build + Pages deploy).
5. In GitHub repo settings → **Pages**, source should be **GitHub Actions**.

## Notes
- Owner account controls subscription assignment and CPM oracle config.
- Artists must have active Artist subscription to register tracks.
- UI expects MetaMask and BSC Testnet.
