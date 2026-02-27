const normalizeToken = (value) =>
  String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[\/_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const normalizePairSymbol = (value, defaultQuote = 'USD') => {
  const raw = normalizeToken(value);
  if (!raw) return '';
  const compact = raw.replace(/-/g, '');

  if (raw.endsWith('-LIGHTER')) {
    return `${raw.slice(0, -8)}-${defaultQuote}`;
  }
  if (raw.endsWith('-PERP')) {
    return `${raw.slice(0, -5)}-${defaultQuote}`;
  }
  if (raw.includes('-')) {
    const [base, quote] = raw.split('-');
    if (base && quote) return `${base}-${quote}`;
  }

  for (const quote of ['USDC', 'USDT', 'USD']) {
    if (compact.endsWith(quote) && compact.length > quote.length) {
      return `${compact.slice(0, -quote.length)}-${quote}`;
    }
  }

  return `${raw}-${defaultQuote}`;
};

const buildSymbolCandidates = (value) => {
  const normalized = normalizePairSymbol(value);
  const raw = normalizeToken(value);
  const compact = raw.replace(/-/g, '');
  return Array.from(new Set([normalized, raw, compact].filter(Boolean)));
};

const pairFromEntry = (entry, fallback) => {
  if (entry?.chainlinkSymbol) {
    return normalizePairSymbol(entry.chainlinkSymbol);
  }
  if (entry?.from || entry?.to) {
    return normalizePairSymbol(`${entry.from || ''}-${entry.to || 'USD'}`);
  }
  if (entry?.tradingSymbol) {
    return normalizePairSymbol(entry.tradingSymbol);
  }
  return normalizePairSymbol(fallback);
};

export const resolveSymbol = async (
  symbolName,
  onSymbolResolvedCallback,
  onResolveErrorCallback,
  _extension
) => {
  console.log('[resolveSymbol]: Fetching resolution for', symbolName);

  if (!symbolName) {
    onResolveErrorCallback('Invalid symbol name');
    return;
  }

  try {
    const API_ORIGIN = 'http://82.153.226.91:8000';
    const candidates = buildSymbolCandidates(symbolName);
    let data;
    for (const candidate of candidates) {
      const safeSymbol = encodeURIComponent(candidate);
      try {
        const response = await fetch(`${API_ORIGIN}/api/markets/symbols/${safeSymbol}`);
        if (response.ok) {
          data = await response.json();
          break;
        }
      } catch (apiErr) {
        console.warn('[resolveSymbol]: Registry API error, trying next candidate:', candidate, apiErr);
      }
    }

    // Check if symbol data exists
    if (!data || !data.entries || data.entries.length === 0) {
      console.log(`[resolveSymbol]: Symbol '${symbolName}' not found in registry. Using default/fallback metadata.`);
      // Default fallback for any symbol (assumes Crypto / HL)
      const pair = normalizePairSymbol(symbolName);
      const ticker = pair || normalizePairSymbol(`${symbolName}-USD`);
      const fallbackInfo = {
        ticker,
        name: ticker,
        description: ticker,
        type: 'Crypto',
        session: '24x7',
        timezone: 'Etc/UTC',
        exchange: 'Hyperliquid',
        minmov: 1,
        pricescale: 100,
        has_intraday: true,
        has_no_volume: false,
        has_weekly_and_monthly: true,
        supported_resolutions: ['1', '5', '15', '30', '60', '240', '1D', '1W', '1M'],
        volume_precision: 2,
        data_status: 'streaming',
        format: 'price',
        listed_exchange: 'Hyperliquid',
      };
      onSymbolResolvedCallback(fallbackInfo);
      return;
    }

    // Check if symbol data exists
    if (!data.entries || data.entries.length === 0) {
      throw new Error('No matching symbol metadata found');
    }

    // Use the exact match or first item
    const match = data.entries.find(m => m.canonical) || data.entries[0];

    const ticker = pairFromEntry(match, symbolName);
    const category = match.category || 'Crypto';
    const base = ticker.split('-')[0] || ticker;

    // Determine precision heuristically or eventually from backend 
    let pricescale = 10000;
    if (category.toLowerCase() === 'forex') {
      pricescale = 100000; // 5 decimal places mostly
    } else if (category.toLowerCase() === 'commodities' || category.toLowerCase() === 'index') {
      pricescale = 100; // 2 decimal places
    } else {
      // Crypto logic:
      if (['ETH', 'SOL'].includes(base)) pricescale = 100; // 2 decimals
      if (base === 'BTC') pricescale = 10;
      if (['PEPE', 'SHIB', 'BONK'].includes(base)) pricescale = 100000000;
      if (['DOGE', 'ADA', 'XRP', 'TRX'].includes(base)) pricescale = 10000;
    }

    const symbolInfo = {
      ticker,
      name: ticker,
      description: match.chainlinkSymbol || ticker,
      type: category,
      session: category.toLowerCase() === 'crypto' ? '24x7' : '0900-1600:12345',
      timezone: 'Etc/UTC',
      exchange: match.exchange || 'hyperliquid',
      minmov: 1,
      pricescale,
      has_intraday: true,
      has_no_volume: false, // crypto typically has volume
      has_weekly_and_monthly: true,
      supported_resolutions: ['1', '5', '15', '30', '60', '240', '1D', '1W', '1M'],
      volume_precision: 2,
      data_status: 'streaming',
      format: 'price',
      listed_exchange: match.exchange || 'hyperliquid',
    };

    console.log('[resolveSymbol]: Symbol resolved securely:', symbolInfo);
    onSymbolResolvedCallback(symbolInfo);
  } catch (err) {
    console.error(`[resolveSymbol]: Error resolving ${symbolName}:`, err);
    onResolveErrorCallback(err.message || 'Error resolving symbol');
  }
};
