export const resolveSymbol = (
  symbolName,
  onSymbolResolvedCallback,
  onResolveErrorCallback,
  _extension
) => {
  console.log('[resolveSymbol]: Method call', symbolName);

  if (!symbolName) {
    onResolveErrorCallback('Invalid symbol name');
    return;
  }

  // Generate dynamic config based on symbol name
  // Standardizing format: ticker (e.g., BTC) and full name (e.g., BTC/USDT)
  const ticker = symbolName.includes('/') ? symbolName.split('/')[0] : symbolName.split('-')[0];
  const displayName = symbolName.includes('-') ? symbolName.replace('-', '/') : symbolName;

  // Determine price scale based on asset (rough heuristic)
  let pricescale = 100; // default 2 decimals
  if (ticker === 'ETH' || ticker === 'SOL') pricescale = 1000;
  if (['ADA', 'XRP', 'DOGE', 'TRX'].includes(ticker)) pricescale = 10000;

  // For most other assets, 4-6 decimals is safer
  if (pricescale === 100 && ticker !== 'BTC') {
    pricescale = 100000;
  }

  const symbolInfo = {
    ticker: ticker,
    name: displayName,
    description: `${ticker}`,
    type: 'crypto',
    session: '24x7',
    timezone: 'Etc/UTC',
    exchange: 'Osmosis',
    minmov: 1,
    pricescale: pricescale,
    has_intraday: true,
    has_no_volume: false,
    has_weekly_and_monthly: true,
    supported_resolutions: ['1', '5', '15', '30', '60', '240', '1D', '1W', '1M'],
    volume_precision: 2,
    data_status: 'streaming',
    format: 'price',
    listed_exchange: 'Osmosis',
  };

  console.log('[resolveSymbol]: Symbol resolved dynamically:', symbolInfo);

  // Use setTimeout to simulate async behavior as expected by the library
  setTimeout(() => {
    onSymbolResolvedCallback(symbolInfo);
  }, 0);
};
