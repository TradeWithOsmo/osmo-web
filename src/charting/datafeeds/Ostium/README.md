# Ostium Custom Datafeed Documentation

## Overview
This directory contains the custom TradingView datafeed implementation for **Ostium RWA (Real World Assets)** trading, separated from Hyperliquid for easier debugging and maintenance.

## Directory Structure

```
v1-web/src/charting/
├── datafeeds/
│   └── Ostium/
│       └── datafeed_ostium.js       # Main datafeed entry point
└── utils/
    └── Ostium/
        ├── getBars.js               # Historical & real-time candles
        ├── onReady.js               # Datafeed configuration
        ├── resolveSymbol.js         # Symbol metadata resolver
        └── searchSymbols.js         # Symbol search functionality
```

## Files Description

### 1. `datafeed_ostium.js`
Main entry point that exports the complete datafeed object for TradingView integration.

**Usage:**
```javascript
import OstiumDatafeed from './charting/datafeeds/Ostium/datafeed_ostium.js';

widget = new TradingView.widget({
  datafeed: OstiumDatafeed,
  // ... other options
});
```

### 2. `getBars.js`
Handles historical candle data fetching and real-time price subscriptions.

**Key Features:**
- Fetches candles from backend API with `exchange=ostium` parameter
- WebSocket subscription for real-time updates via `/ws/ostium/{symbol}`
- Supports bar aggregation for TradingView chart rendering

**Example Request:**
```
GET http://localhost:8000/api/candles/EUR-USD?exchange=ostium&limit=300
```

**Response Format:**
```json
[
  {
    "t": 1769179740000,     // timestamp (milliseconds)
    "o": 1.17463,           // open price
    "h": 1.17463,           // high price
    "l": 1.1746,            // low price
    "c": 1.1746,            // close price
    "i": "1m"               // interval
  }
]
```

### 3. `onReady.js`
Defines datafeed configuration and supported features.

**Supported Asset Types:**
- Forex (EUR/USD, GBP/USD, etc.)
- Commodities (XAU/USD, WTI/USD, etc.)
- Indices (SPX/USD, NDX/USD, etc.)
- Stocks (AAPL/USD, MSFT/USD, etc.)
- Crypto (BTC/USD, ETH/USD, etc.)

**Supported Resolutions:**
`['1', '5', '15', '30', '60', '240', '1D', '1W', '1M']`

### 4. `resolveSymbol.js`
Resolves symbol metadata including asset type, price scale, and trading session.

**Asset Type Detection:**
- **Forex:** 4-5 decimal places (10000 pricescale), JPY pairs use 2 decimals
- **Commodities:** 2 decimal places (100 pricescale)
- **Indices:** 2 decimal places (100 pricescale)
- **Stocks:** 2 decimal places (100 pricescale)
- **Crypto:** BTC=2dp, ETH=3dp, others=4dp

### 5. `searchSymbols.js`
Provides symbol search functionality for the chart's search box.

**Available Symbols:**
- **7 Forex pairs:** EUR-USD, GBP-USD, USD-JPY, AUD-USD, USD-CAD, USD-CHF, NZD-USD
- **5 Commodities:** XAU-USD (Gold), XAG-USD (Silver), WTI-USD, BRN-USD, NG-USD
- **4 Indices:** SPX-USD, NDX-USD, DJI-USD, VIX-USD
- **5 Stocks:** AAPL-USD, MSFT-USD, GOOGL-USD, TSLA-USD, AMZN-USD

## Backend Integration

### API Endpoints

#### 1. Get Historical Candles
```bash
GET /api/candles/{symbol}?exchange=ostium&limit={count}
```

**Parameters:**
- `symbol` (required): Trading pair (e.g., EUR-USD)
- `exchange` (optional): Set to "ostium" to force Ostium data source
- `limit` (optional): Number of candles to return (default: 100)

**Example:**
```bash
curl "http://localhost:8000/api/candles/EUR-USD?exchange=ostium&limit=5"
```

#### 2. WebSocket Real-Time Prices
```
ws://localhost:8000/ws/ostium/{symbol}
```

**Message Format:**
```json
{
  "type": "price_update",
  "data": {
    "symbol": "EUR-USD",
    "price": 1.1746,
    "timestamp": 1769179740000,
    "source": "ostium",
    "change_24h": 0.0012,
    "change_percent_24h": 0.10,
    "high_24h": 1.1750,
    "low_24h": 1.1730
  }
}
```

## Testing

### Backend Test
```bash
# Test candles endpoint
powershell -Command "(Invoke-RestMethod -Uri 'http://localhost:8000/api/candles/EUR-USD?exchange=ostium&limit=5')"
```

**Expected Response:**
```
t : 1769179740000
o : 1.17463
h : 1.17463
l : 1.1746
c : 1.1746
i : 1m
```

### Frontend Test
1. Open Trade page
2. Select "Ostium" from market category dropdown
3. Select any RWA asset (e.g., EUR-USD, XAU-USD)
4. Chart should load with Ostium data

## Debugging

### Enable Console Logs
All functions include detailed console logging:
- `[Ostium getBars]`: Historical data fetch
- `[Ostium subscribeBars]`: WebSocket subscription
- `[Ostium onReady]`: Configuration load
- `[Ostium resolveSymbol]`: Symbol resolution
- `[Ostium searchSymbols]`: Search results

### Common Issues

**1. No Data Available**
- Check if Ostium backend is polling prices
- Verify symbol exists in `latest_prices` global state
- Check backend logs: `docker logs -f osmo-backend`

**2. WebSocket Connection Failed**
- Ensure `/ws/ostium/` endpoint exists in backend
- Check CORS settings
- Verify symbol format (should be EUR-USD, not EUR/USD)

**3. Price Scale Incorrect**
- Review `resolveSymbol.js` pricescale logic
- JPY pairs should use 100 (2 decimals)
- Most forex pairs should use 10000 (4 decimals)

## Backend Components

### Required Modules
- `Ostium/api_client.py` - HTTP client for Ostium API
- `Ostium/candles.py` - In-memory candle generator
- `Ostium/normalizer.py` - Price data normalization
- `Ostium/poller.py` - Periodic price polling
- `Ostium/price_history.py` - 24h high/low tracking

### Data Flow
```
Ostium API (metadata-backend.ostium.io)
    ↓ (polling every 5s)
OstiumPoller
    ↓
handle_ostium_message()
    ↓
CandleGenerator.update_price()
    ↓
latest_prices (global state)
    ↓
WebSocket broadcast (/ws/ostium/{symbol})
    ↓
Frontend TradingView Chart
```

## Future Enhancements
- [ ] Add volume data when available from Ostium
- [ ] Support for higher timeframes (5m, 15m, 1h, 1D)
- [ ] Implement proper trading hours for RWA assets
- [ ] Add order book integration
- [ ] Historical candle persistence in database
- [ ] Support for more exotic asset classes

## Related Files
- Frontend Integration: `v1-web/src/pages/Trade.tsx`
- Market Dropdown: `v1-web/src/components/MarketDetail/index.tsx`
- Backend Main: `backend/websocket/main.py`
- Ostium Backend: `backend/websocket/Ostium/`

---

**Last Updated:** 2026-01-23
**Version:** 1.0.0
