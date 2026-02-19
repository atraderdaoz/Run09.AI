# Web3 Music Pilot (GitHub Pages + BSC Testnet)

GitHub Pages pilot for a Web3 music platform with a Vite frontend (no backend) and a Hardhat smart contract on BSC Testnet.

Live Pages target:
- https://atraderdaoz.github.io/Run09.AI/

## Features
1. Artist/User/Merchant subscriptions (`role + tier + expiry`)
2. POL per-track license purchase as ERC-721 using native tBNB
3. In-browser Irys upload flow for cover, audio, and `metadata.json`, then on-chain track registration
4. Download gating: user must hold track license OR have active User subscription
5. Commercial status visible from active Merchant subscription
6. Optional CPM reports stored on-chain and viewable/postable in UI

## Files
- `contracts/MusicPilotPlatform.sol`
- `scripts/deploy.js`
- `hardhat.config.js`
- `src/main.js`, `src/platform.js`, `src/irys.js`, `src/metadata.js`, `src/style.css`
- `.github/workflows/deploy.yml`
- `vite.config.js`, `.env.example`, `README.md`, `package.json`

## Setup
```bash
npm i
cp .env.example .env
```

Populate `.env`:
- `BSC_TESTNET_RPC_URL` (BSC testnet RPC)
- `PRIVATE_KEY` (testnet deployer key)
- `VITE_PLATFORM_ADDRESS` (set after deploy)

## Compile contract
```bash
npm run compile
```

## Deploy contract (BSC Testnet)
```bash
npm run deploy:bscTestnet
```

Copy the deployed address into:
- local `.env` as `VITE_PLATFORM_ADDRESS`
- GitHub Actions secret `VITE_PLATFORM_ADDRESS`

## Run frontend locally
```bash
npm run dev
```

## Build frontend
```bash
npm run build
```

## GitHub Pages configuration
1. Keep Vite base as `"/Run09.AI/"` in `vite.config.js`.
2. Add repository secret `VITE_PLATFORM_ADDRESS`.
3. Push to `main` branch to trigger `.github/workflows/deploy.yml`.
4. In GitHub repo settings → **Pages**, set Source to **GitHub Actions**.

## Notes
- Only contract owner can set subscriptions and oracle.
- Artist subscription is required for `registerTrack`.
- UI expects MetaMask connected to BSC Testnet.

## Fallback build address injection
When running the fallback build (`node scripts/build.js`), `VITE_PLATFORM_ADDRESS` is injected into `dist/index.html` by replacing `__VITE_PLATFORM_ADDRESS__`.

For GitHub Actions, keep passing `VITE_PLATFORM_ADDRESS` in the workflow env as already configured.

## Troubleshooting blank screen
- If the page is blank, open browser DevTools and check for startup errors in `src/main.js`.
- Ensure `VITE_PLATFORM_ADDRESS` is set (or injected in fallback build) to avoid missing contract config at runtime.
- Verify you are loading from the repo subpath URL: `https://atraderdaoz.github.io/Run09.AI/`.


## Repository scope
This repository intentionally tracks only the Web3 Music Pilot implementation assets and deployment files.
