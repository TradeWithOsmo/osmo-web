// Symbol search functionality for Ostium RWA assets
export const searchSymbols = (
    userInput,
    exchange,
    symbolType,
    onResultReadyCallback,
    onErrorCallback
) => {
    // Ostium RWA trading pairs
    const symbols = [
        // Forex
        { symbol: 'EUR-USD', full_name: 'EUR/USD', description: 'Euro / US Dollar', type: 'forex', exchange: 'Ostium' },
        { symbol: 'GBP-USD', full_name: 'GBP/USD', description: 'British Pound / US Dollar', type: 'forex', exchange: 'Ostium' },
        { symbol: 'USD-JPY', full_name: 'USD/JPY', description: 'US Dollar / Japanese Yen', type: 'forex', exchange: 'Ostium' },
        { symbol: 'AUD-USD', full_name: 'AUD/USD', description: 'Australian Dollar / US Dollar', type: 'forex', exchange: 'Ostium' },
        { symbol: 'USD-CAD', full_name: 'USD/CAD', description: 'US Dollar / Canadian Dollar', type: 'forex', exchange: 'Ostium' },
        { symbol: 'USD-CHF', full_name: 'USD/CHF', description: 'US Dollar / Swiss Franc', type: 'forex', exchange: 'Ostium' },
        { symbol: 'NZD-USD', full_name: 'NZD/USD', description: 'New Zealand Dollar / US Dollar', type: 'forex', exchange: 'Ostium' },

        // Commodities
        { symbol: 'XAU-USD', full_name: 'XAU/USD', description: 'Gold / US Dollar', type: 'commodities', exchange: 'Ostium' },
        { symbol: 'XAG-USD', full_name: 'XAG/USD', description: 'Silver / US Dollar', type: 'commodities', exchange: 'Ostium' },
        { symbol: 'WTI-USD', full_name: 'WTI/USD', description: 'WTI Crude Oil', type: 'commodities', exchange: 'Ostium' },
        { symbol: 'BRN-USD', full_name: 'BRN/USD', description: 'Brent Crude Oil', type: 'commodities', exchange: 'Ostium' },
        { symbol: 'NG-USD', full_name: 'NG/USD', description: 'Natural Gas', type: 'commodities', exchange: 'Ostium' },

        // Indices
        { symbol: 'SPX-USD', full_name: 'SPX/USD', description: 'S&P 500 Index', type: 'indices', exchange: 'Ostium' },
        { symbol: 'NDX-USD', full_name: 'NDX/USD', description: 'NASDAQ 100 Index', type: 'indices', exchange: 'Ostium' },
        { symbol: 'DJI-USD', full_name: 'DJI/USD', description: 'Dow Jones Industrial Average', type: 'indices', exchange: 'Ostium' },
        { symbol: 'VIX-USD', full_name: 'VIX/USD', description: 'CBOE Volatility Index', type: 'indices', exchange: 'Ostium' },

        // Stocks (examples)
        { symbol: 'AAPL-USD', full_name: 'AAPL/USD', description: 'Apple Inc.', type: 'stocks', exchange: 'Ostium' },
        { symbol: 'MSFT-USD', full_name: 'MSFT/USD', description: 'Microsoft Corporation', type: 'stocks', exchange: 'Ostium' },
        { symbol: 'GOOGL-USD', full_name: 'GOOGL/USD', description: 'Alphabet Inc.', type: 'stocks', exchange: 'Ostium' },
        { symbol: 'TSLA-USD', full_name: 'TSLA/USD', description: 'Tesla Inc.', type: 'stocks', exchange: 'Ostium' },
        { symbol: 'AMZN-USD', full_name: 'AMZN/USD', description: 'Amazon.com Inc.', type: 'stocks', exchange: 'Ostium' },
    ];

    // Filter symbols based on user input
    const filteredSymbols = symbols.filter(item =>
        item.symbol.toLowerCase().includes(userInput.toLowerCase()) ||
        item.full_name.toLowerCase().includes(userInput.toLowerCase()) ||
        item.description.toLowerCase().includes(userInput.toLowerCase())
    );

    console.log(`[Ostium searchSymbols]: Found ${filteredSymbols.length} matches for "${userInput}"`);
    onResultReadyCallback(filteredSymbols);
};
