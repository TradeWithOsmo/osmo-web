
const symbolConfigs = {
  'BTC': {
    ticker: 'BTC',
    name: 'BTC/USDT',
    session: "24x7",
    timezone: "Etc/UTC",
    minmov: 1,
    pricescale: 100,
    has_intraday: true,
    intraday_multipliers: ["1", "5", "15", "30", "60"],
    has_empty_bars: false,
    has_weekly_and_monthly: true,
    supported_resolutions: ["1", "5", "15", "30", "60", "1D", "1W", "1M"],
    volume_precision: 2,
    data_status: "streaming",
  },
  'ETH': {
    ticker: 'ETH',
    name: 'ETH/USDT',
    session: "24x7",
    timezone: "Etc/UTC",
    minmov: 1,
    pricescale: 1000,
    has_intraday: true,
    intraday_multipliers: ["1", "5", "15", "30", "60"],
    has_empty_bars: false,
    has_weekly_and_monthly: true,
    supported_resolutions: ["1", "5", "15", "30", "60", "1D", "1W", "1M"],
    volume_precision: 2,
    data_status: "streaming",
  },
  'USDT': {
    ticker: 'USDT',
    name: 'USDT/WETH',
    session: "24x7",
    timezone: "Etc/UTC",
    minmov: 1,
    pricescale: 1000,
    has_intraday: true,
    intraday_multipliers: ["1", "5", "15", "30", "60"],
    has_empty_bars: false,
    has_weekly_and_monthly: false,
    supported_resolutions: ["1", "5", "15", "30", "60", "1D", "1W", "1M"],
    volume_precision: 1,
    data_status: "streaming",
  },
  'default': {
    ticker: 'USDT',
    name: 'USDT/WETH',
    session: "24x7",
    timezone: "Etc/UTC",
    minmov: 1,
    pricescale: 1000,
    has_intraday: true,
    intraday_multipliers: ["1", "5", "15", "30", "60"],
    has_empty_bars: false,
    has_weekly_and_monthly: false,
    supported_resolutions: ["1", "5", "15", "30", "60", "1D", "1W", "1M"],
    volume_precision: 1,
    data_status: "streaming",
  }
};

export const resolveSymbol = (
  symbolName,
  onSymbolResolvedCallback,
  onResolveErrorCallback,
  _extension
) => {
  console.log('Resolving symbol:', symbolName);

  // Extract base symbol from symbolName (e.g., "BTC/USDT" -> "BTC")
  const baseSymbol = symbolName ? symbolName.split('/')[0].toUpperCase() : 'USDT';

  const symbolInfo = symbolConfigs[baseSymbol] || symbolConfigs['default'];

  if (!symbolInfo) {
    console.error('Symbol not found:', symbolName);
    onResolveErrorCallback('Symbol not found');
  } else {
    console.log('Symbol resolved:', symbolInfo);
    setTimeout(() => {
      onSymbolResolvedCallback(symbolInfo);
    }, 100);
  }
};
