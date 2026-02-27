// Symbol search functionality for TradingView chart

export const searchSymbols = async (
  userInput,
  exchange,
  symbolType,
  onResultReadyCallback,
  onErrorCallback
) => {
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
    if (raw.endsWith('-LIGHTER')) return `${raw.slice(0, -8)}-${defaultQuote}`;
    if (raw.endsWith('-PERP')) return `${raw.slice(0, -5)}-${defaultQuote}`;
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

  try {
    const API_ORIGIN = 'http://82.153.226.91:8000';
    // Fetch canonical symbols from backend
    const response = await fetch(`${API_ORIGIN}/api/markets/symbols?canonical_only=true`);
    if (!response.ok) {
      throw new Error(`Failed to fetch symbols: HTTP ${response.status}`);
    }

    // The endpoint returns { count, generated_at, symbols: [...] }
    const data = await response.json();
    const symbolsData = data.symbols || [];

    // Match TradingView search expected format
    const symbols = symbolsData.map(s => ({
      symbol: normalizePairSymbol(s.chainlinkSymbol || s.tradingSymbol || `${s.baseSymbol || ''}-USD`),
      full_name: `${normalizePairSymbol(s.chainlinkSymbol || s.tradingSymbol || `${s.baseSymbol || ''}-USD`)} (${s.exchange})`,
      description: normalizePairSymbol(s.chainlinkSymbol || s.tradingSymbol || `${s.baseSymbol || ''}-USD`),
      type: s.category || 'Crypto',
      exchange: s.exchange || 'Osmosis',
    }));

    // Filter based on user input, exchange (if provided), and type (if provided)
    const query = userInput.toLowerCase();
    const filteredSymbols = symbols.filter(item => {
      const matchText = (
        item.symbol.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.exchange.toLowerCase().includes(query)
      );

      const matchExchange = !exchange || exchange === '' || item.exchange === exchange;
      const matchType = !symbolType || symbolType === '' || item.type.toLowerCase() === symbolType.toLowerCase();

      return matchText && matchExchange && matchType;
    });

    onResultReadyCallback(filteredSymbols);
  } catch (error) {
    console.error('[searchSymbols]: Error fetching symbols:', error);
    onErrorCallback(error);
  }
};
