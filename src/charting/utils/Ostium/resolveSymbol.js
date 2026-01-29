export const resolveSymbol = (
    symbolName,
    onSymbolResolvedCallback,
    onResolveErrorCallback,
    _extension
) => {
    console.log('[Ostium resolveSymbol]: Method call', symbolName);

    if (!symbolName) {
        onResolveErrorCallback('Invalid symbol name');
        return;
    }

    // Use the full name (e.g. EUR/USD) as both name and ticker to prevent mapping loops
    const displayName = symbolName.includes('-') ? symbolName.replace('-', '/') : symbolName;
    const ticker = displayName;

    // Determine asset type based on parts
    const base = displayName.includes('/') ? displayName.split('/')[0] : displayName;
    let assetType = 'forex';
    let pricescale = 100000; // 5 decimals default

    if (['XAU', 'XAG', 'WTI', 'BRN', 'NG'].includes(base)) {
        assetType = 'commodities';
        pricescale = base === 'XAG' ? 10000 : 1000;
    } else if (['SPX', 'NDX', 'DJI'].includes(base)) {
        assetType = 'indices';
        pricescale = 100;
    } else if (displayName.includes('JPY')) {
        pricescale = 1000;
    }

    const symbolInfo = {
        ticker: ticker,
        name: displayName,
        description: displayName,
        type: 'crypto', // Using 'crypto' type bypasses strict stock session logic
        session: '24x7',
        timezone: 'Etc/UTC',
        exchange: 'Ostium',
        minmov: 1,
        pricescale: pricescale,
        has_intraday: true,
        has_no_volume: true,
        supported_resolutions: ['1', '5', '15', '30', '60', '1D'],
        data_status: 'streaming',
    };

    console.log('[Ostium resolveSymbol]: Symbol resolved:', symbolInfo);

    setTimeout(() => {
        onSymbolResolvedCallback(symbolInfo);
    }, 0);
};
