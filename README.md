# OSMO Web Frontend

Frontend app for trading, portfolio, symbol selector, orderbook/trades, leaderboard, and charting.

Repository: https://github.com/TradeWithOsmo/osmo-web

## Stack

- React 19 + TypeScript
- Vite
- Zustand + React Query
- Privy (embedded wallet)
- wagmi + viem (on-chain interactions)
- TradingView integration (`src/charting`)
- Playwright + Storybook

## Prerequisites

- Node.js 20+
- npm 10+

## Setup

```bash
npm install
cp .env.example .env  # or copy from osmo-contracts/.env for contract addresses
```

## Run

```bash
npm run dev
```

Default local URL: `http://localhost:5173`

Note: `localhost` is a secure context — Privy embedded wallet works in dev without HTTPS.

## Scripts

```bash
npm run dev
npm run start
npm run build
npm run preview
npm run lint
npm run test:e2e
npm run storybook
npm run build-storybook
```

## Environment Variables

Create `.env` in the project root. Full reference:

### API & Auth

```env
VITE_API_URL=http://76.13.219.146:8000
VITE_PRIVY_APP_ID=<privy_app_id>
```

### Trading Mode

```env
# onchain: submits real transactions via OrderRouter (requires session key)
# simulation: bypasses on-chain, uses backend ledger only
VITE_TRADING_EXCHANGE=onchain
```

### Wallet / Network

```env
VITE_WALLET_CONNECT_PROJECT_ID=<wc_project_id>
VITE_RAINBOWKIT_WALLETCONNECT_PROJECT_ID=<rainbowkit_wc_project_id>
VITE_BASE_RPC_URL=<base_sepolia_rpc_url>
VITE_CHAIN_ID=84532
VITE_NETWORK_NAME=base_sepolia
VITE_BLOCK_EXPLORER_URL=https://sepolia.basescan.org
```

### AI / Gemini

```env
VITE_GEMINI_API_KEY=<gemini_api_key>
VITE_GEMINI_MODEL=gemini-1.5-flash
```

### On-Chain Contract Addresses

Source of truth: `osmo-contracts/.env` (populated after deployment).

```env
VITE_CONTRACT_TRADING_VAULT=<deployed_address>
VITE_CONTRACT_ORDER_ROUTER=<deployed_address>
VITE_CONTRACT_POSITION_MANAGER=<deployed_address>
VITE_CONTRACT_SESSION_KEY_MANAGER=<deployed_address>
VITE_CONTRACT_OSTIUM_ADAPTER=<deployed_address>
VITE_CONTRACT_USDC=<deployed_address>
VITE_CONTRACT_FAUCET=<deployed_address>
VITE_CONTRACT_AI_VAULT=<deployed_address>
VITE_CONTRACT_ARENA_CHOOSE_SIDE=<deployed_address>
VITE_CONTRACT_ARENA_POINTS=<deployed_address>
VITE_CONTRACT_REFERRAL_REGISTRY=<deployed_address>
VITE_CONTRACT_FEE_MANAGER=<deployed_address>
VITE_CONTRACT_SECURITY_MODULE=<deployed_address>
```

### Arena

```env
VITE_ARENA_END_ISO=2026-02-20T00:00:00Z
```

### Optional TradingView Tuning

```env
VITE_TV_COMMAND_POLL_MS=
VITE_TV_INITIAL_SYNC_MS=
VITE_TV_SET_RESOLUTION_TIMEOUT_MS=
```

## Project Structure

- `src/pages/`: app pages (Trade, Portfolio, Arena, Leaderboard, Usage, Faucet)
- `src/components/`: UI modules (order form, selector, chart, orderbook, positions)
- `src/api/`: API clients (markets, portfolio, leaderboard, agent, onchain)
- `src/charting/`: TradingView datafeeds/utils/commands
- `src/contracts/abis/`: ABI files used by frontend
- `src/store/`: Zustand stores
- `src/hooks/`: custom hooks (useWallet, useNavigation, etc.)

## On-Chain Order Flow

1. User deposits USDC into TradingVault
2. User sets up a session key (SessionKeyManager) — allows backend to sign on their behalf
3. User places order via OrderForm → calls backend `/api/orders/place`
4. Backend signs + submits tx to OrderRouter using session key
5. OrderRouter routes to correct adapter (Ostium, Hyperliquid via LZ, etc.)
6. For Hyperliquid: LZ message sent Base Sepolia → Arb Sepolia receiver

## Runtime Notes

- Frontend expects backend API + websocket running (typically `http://76.13.219.146:8000` for staging).
- For symbol selector/orderbook consistency, ensure backend websocket connectors are healthy.
- TradingView assets are expected in:
  - `public/charting_library/`
  - `src/charting/charting_library/`
