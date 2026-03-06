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

### On-Chain Contract Addresses (Base Sepolia)

Source of truth: `osmo-contracts/.env`

```env
VITE_CONTRACT_TRADING_VAULT=0x7D909A44b5eb12cEf16ce4D824e259bC07E2927D
VITE_CONTRACT_ORDER_ROUTER=0x411985C7f9C64c66A2C2390AbAC7AD9a718da60e
VITE_CONTRACT_POSITION_MANAGER=0xBE46bDB894325cf26A50AecFC0CED7a3c58271a0
VITE_CONTRACT_SESSION_KEY_MANAGER=0xc2853D45DA39B36b31cf12D92b6fe2e643c12DD8
VITE_CONTRACT_OSTIUM_ADAPTER=0x1994548412e7ad2f131976a88004AeD9D5D555D1
VITE_CONTRACT_USDC=0x4C1a0b8039eA88Ebf814DF46d4f1f50FFa88A0E8
VITE_CONTRACT_FAUCET=0xA3B85a44dC1c8d1ea187F46A7eaC8631dD9D452B
VITE_CONTRACT_AI_VAULT=0x5aBb786D8fa77D8Cc7c689d78E871dbD57039ad4
VITE_CONTRACT_ARENA_CHOOSE_SIDE=0x65525E80d6B32529bad529bd40b6Ed23F49dBC9b
VITE_CONTRACT_ARENA_POINTS=0xCdcBaC5D346d987dBb30Ef7E152f91Cadf52e4c6
VITE_CONTRACT_REFERRAL_REGISTRY=0x02c67133365a81157cF674A7B362c6808A03AB3C
VITE_CONTRACT_FEE_MANAGER=0x0762211f62F6C1b73dd6f3186bEC4b407D984719
VITE_CONTRACT_SECURITY_MODULE=0x0F31A6905507161a4c9cDC0FfD47439c0f916523
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
