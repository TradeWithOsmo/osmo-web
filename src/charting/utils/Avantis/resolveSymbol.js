export const resolveSymbol = (
    symbolName,
    onSymbolResolvedCallback,
    onResolveErrorCallback,
    _extension
) => {
    if (!symbolName) {
        onResolveErrorCallback('Invalid symbol name');
        return;
    }

    const displayName = symbolName.replace('/', '-');
    const base = displayName.split('-')[0];

    const symbolInfo = {
        ticker: symbolName,
        name: displayName,
        description: `${displayName} (Avantis)`,
        type: 'crypto',
        session: '24x7',
        timezone: 'Etc/UTC',
        exchange: 'Avantis',
        minmov: 1,
        pricescale: 100,
        has_intraday: true,
        has_no_volume: false,
        supported_resolutions: ['1', '5', '15', '30', '60', '240', '1D', '1W', '1M'],
        data_status: 'streaming',
        listed_exchange: 'Avantis',
        format: 'price',
    };

    if (['ETH', 'SOL', 'ENSO'].includes(base)) {
        symbolInfo.pricescale = 100;
    } else if (['BTC'].includes(base)) {
        symbolInfo.pricescale = 10;
    } else {
        symbolInfo.pricescale = 10000;
    }

    onSymbolResolvedCallback(symbolInfo);
};
