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

    onSymbolResolvedCallback({
        ticker: symbolName,
        name: displayName,
        description: `${displayName} (Vest)`,
        type: 'crypto',
        session: '24x7',
        timezone: 'Etc/UTC',
        exchange: 'Vest',
        minmov: 1,
        pricescale: 100,
        has_intraday: true,
        has_no_volume: false,
        supported_resolutions: ['1', '5', '15', '30', '60', '240', '1D', '1W', '1M'],
        data_status: 'streaming',
        listed_exchange: 'Vest',
        format: 'price',
    });
};
