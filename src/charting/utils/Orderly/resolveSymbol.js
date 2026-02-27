export const resolveSymbol = (
    symbolName,
    onSymbolResolvedCallback,
    onResolveErrorCallback,
    _extension
) => {
    console.log('[Orderly resolveSymbol]: Resolving', symbolName);

    if (!symbolName) {
        onResolveErrorCallback('Invalid symbol name');
        return;
    }

    // Standardize naming: ASTER symbols often come as BASEUSDT or BASE-USD
    const displayName = symbolName.replace('/', '-');
    const base = displayName.split('-')[0];

    // Most ASTER pairs are 2-4 decimals on their perp
    const symbolInfo = {
        ticker: symbolName,
        name: displayName,
        description: `${displayName} (Orderly)`,
        type: 'crypto',
        session: '24x7',
        timezone: 'Etc/UTC',
        exchange: 'Orderly',
        minmov: 1,
        pricescale: 100, // Default to 2 decimals, will be updated by feeds
        has_intraday: true,
        has_no_volume: false,
        supported_resolutions: ['1', '5', '15', '30', '60', '240', '1D', '1W', '1M'],
        data_status: 'streaming',
        listed_exchange: 'Orderly',
        format: 'price',
    };

    if (['ETH', 'SOL', 'ENSO'].includes(base)) {
        symbolInfo.pricescale = 100;
    } else if (['BTC'].includes(base)) {
        symbolInfo.pricescale = 10;
    }

    onSymbolResolvedCallback(symbolInfo);
};
