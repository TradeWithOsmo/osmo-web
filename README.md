# OSMO Web Frontend

Frontend app for trading, portfolio, symbol selector, orderbook/trades, leaderboard, and charting.

Repository: https://github.com/TradeWithOsmo/osmo-web

## Stack

- React 19 + TypeScript
- Vite
- Zustand + React Query
- TradingView integration (`src/charting`)
- Playwright + Storybook

## Prerequisites

- Node.js 20+
- npm 10+

## Setup

```bash
npm install
cp .env.local.example .env.local  # if you have this template
```

If no template exists, create `.env.local` manually.

Common frontend env vars:

- `VITE_API_URL` (backend base URL, default local: `http://localhost:8000`)
- `VITE_PRIVY_APP_ID`
- `VITE_TRADING_EXCHANGE` (`simulation` or `onchain`)
- `VITE_ARENA_END_ISO`
- TradingView tuning:
  - `VITE_TV_COMMAND_POLL_MS`
  - `VITE_TV_INITIAL_SYNC_MS`
  - `VITE_TV_SET_RESOLUTION_TIMEOUT_MS`

On-chain contract env vars (used when onchain mode is enabled):

- `VITE_CONTRACT_TRADING_VAULT`
- `VITE_CONTRACT_ORDER_ROUTER`
- `VITE_CONTRACT_POSITION_MANAGER`
- `VITE_CONTRACT_SESSION_KEY_MANAGER`
- `VITE_CONTRACT_OSTIUM_ADAPTER`
- `VITE_CONTRACT_USDC`
- `VITE_CONTRACT_FAUCET`
- `VITE_CONTRACT_AI_VAULT`
- `VITE_CONTRACT_ARENA_CHOOSE_SIDE`
- `VITE_CONTRACT_ARENA_POINTS`

## Run

```bash
npm run dev
```

Default local URL: `http://localhost:5173`

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

## Project Structure

- `src/pages/`: app pages (Trade, Portfolio, Arena, Leaderboard, Usage, Faucet)
- `src/components/`: UI modules (order form, selector, chart, orderbook, positions)
- `src/api/`: API clients (markets, portfolio, leaderboard, agent, onchain)
- `src/charting/`: TradingView datafeeds/utils/commands
- `src/contracts/abis/`: ABI files used by frontend
- `src/store/`: Zustand stores

## Runtime Notes

- Frontend expects backend API + websocket running (typically from `backend/websocket`).
- For symbol selector/orderbook consistency, ensure backend websocket connectors are healthy.
- TradingView assets are expected in:
  - `public/charting_library/`
  - `src/charting/charting_library/`
