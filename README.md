<img src="https://raw.githubusercontent.com/TradeWithOsmo/osmo-web/main/public/Logos/icon.png" alt="Osmo" width="64" />

# Osmo Web

AI-powered perpetual DEX aggregator — trade any perp, on any exchange, from one prompt.

![Base](https://img.shields.io/badge/Base-0052FF?style=flat-square&logo=ethereum&logoColor=white)
![React 19](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![TradingView](https://img.shields.io/badge/TradingView-131722?style=flat-square&logo=tradingview&logoColor=white)

---

## Demo

| Trade Terminal | Trade Agent | Extended Features |
|:---:|:---:|:---:|
| [![Trade Terminal](https://img.youtube.com/vi/MDkxFkQ4UQM/mqdefault.jpg)](https://youtu.be/MDkxFkQ4UQM?si=AhA39uW_Z4aDyFEy) | [![Trade Agent](https://img.youtube.com/vi/8OY-eTo8L_s/mqdefault.jpg)](https://youtu.be/8OY-eTo8L_s?si=zXhcHnQjuvOQmW4d) | [![Extended Features](https://img.youtube.com/vi/BrGtN-OK0tQ/mqdefault.jpg)](https://youtu.be/BrGtN-OK0tQ?si=O7F9PadfcP4FHwxC) |
| [▶ Watch](https://youtu.be/MDkxFkQ4UQM?si=AhA39uW_Z4aDyFEy) | [▶ Watch](https://youtu.be/8OY-eTo8L_s?si=zXhcHnQjuvOQmW4d) | [▶ Watch](https://youtu.be/BrGtN-OK0tQ?si=O7F9PadfcP4FHwxC) |

---

## Stack

- React 19 + TypeScript
- Vite
- Zustand + React Query
- Privy (embedded wallet)
- wagmi + viem (on-chain interactions)
- TradingView Advanced Charts (`src/charting`)
- Playwright + Storybook

## Prerequisites

- Node.js 20+
- npm 10+

## Setup

```bash
npm install
cp .env.example .env
cp .env.local.example .env.local  # optional local overrides
```

> **TradingView Charting Library** — proprietary license required.
> Apply at https://www.tradingview.com/charting-library/ and place files in:
> - `src/charting/charting_library/`
> - `public/charting_library/`
> - `src/charting/commands/`
>
> These folders are gitignored. Only `.gitkeep` files are committed.

## Run

```bash
npm run dev
```

Default local URL: `http://localhost:5173`

`localhost` is a secure context — Privy embedded wallet works in dev without HTTPS.

## Scripts

```bash
npm run dev          # development server
npm run build        # production build
npm run preview      # preview production build
npm run lint         # ESLint
npm run test:e2e     # Playwright e2e tests
npm run storybook    # Storybook component explorer
```

## Environment Variables

Copy `.env.example` to `.env`. See `.env.example` for the full reference.

Key variables:

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API URL |
| `VITE_PRIVY_APP_ID` | Privy app ID |
| `VITE_TRADING_EXCHANGE` | `onchain` or `simulation` |
| `VITE_CHAIN_ID` | `84532` (Base Sepolia) |
| `VITE_CONTRACT_*` | Contract addresses — copy from `osmo-contracts/.env` |

For local API URL overrides, use `.env.local` (see `.env.local.example`).

## Project Structure

```
src/
├── pages/          # Trade, Portfolio, Arena, Leaderboard, Usage, Faucet
├── components/     # UI modules (order form, chart, orderbook, positions)
├── api/            # API clients (markets, portfolio, agent, onchain)
├── charting/       # TradingView datafeeds, utils (charting_library + commands gitignored)
├── contracts/abis/ # ABI files
├── store/          # Zustand stores
└── hooks/          # useWallet, useNavigation, etc.
```

## On-Chain Order Flow

1. User deposits USDC → `TradingVault`
2. User creates session key → `SessionKeyManager` (allows backend to sign on their behalf)
3. User places order → backend `/api/orders/place`
4. Backend signs + submits tx → `OrderRouter`
5. `OrderRouter` routes to exchange adapter (Ostium, Hyperliquid via LZ, etc.)
6. For Hyperliquid: LayerZero message Base Sepolia → Arb Sepolia receiver

## Runtime Notes

- Requires backend API + websocket running. Set `VITE_API_URL` in `.env.local` to point to your backend.
- For symbol selector/orderbook consistency, ensure backend websocket connectors are healthy.
- TradingView assets must be placed manually in the gitignored folders (see Setup above).
