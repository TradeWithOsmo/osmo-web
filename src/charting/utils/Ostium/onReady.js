const configurationData = {
    supported_resolutions: ['1', '5', '15', '30', '60', '240', '1D', '1W', '1M'],
    exchanges: [
        {
            value: 'ostium',
            name: 'Ostium',
            desc: 'RWA Trading Platform'
        }
    ],
    symbols_types: [
        {
            name: 'Forex',
            value: 'forex'
        },
        {
            name: 'Commodities',
            value: 'commodities'
        },
        {
            name: 'Indices',
            value: 'indices'
        },
        {
            name: 'Stocks',
            value: 'stocks'
        },
        {
            name: 'Crypto',
            value: 'crypto'
        }
    ],
    supports_marks: false,
    supports_timescale_marks: false,
    supports_time: true,
    currency_codes: ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF']
};

export const onReady = (callback) => {
    console.log('[Ostium onReady]: Method call');
    setTimeout(() => callback(configurationData), 0);
};
