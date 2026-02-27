export const searchSymbols = async (
    userInput,
    exchange,
    symbolType,
    onResultReadyCallback,
    onErrorCallback
) => {
    try {
        const API_ORIGIN = 'http://82.153.226.91:8000';
        const response = await fetch(`${API_ORIGIN}/api/markets`);
        if (!response.ok) throw new Error('Failed to fetch markets');

        const data = await response.json();
        // Filter specifically for Orderly markets
        const orderlyMarkets = (data.markets || []).filter(m => m.source.toLowerCase() === 'orderly');

        const query = userInput.toLowerCase();
        const filtered = orderlyMarkets
            .filter(m => m.symbol.toLowerCase().includes(query))
            .map(m => ({
                symbol: m.symbol,
                full_name: `${m.symbol} (Orderly)`,
                description: `${m.from}/${m.to}`,
                exchange: 'Orderly',
                type: 'crypto',
            }));

        onResultReadyCallback(filtered);
    } catch (err) {
        console.error('[Orderly searchSymbols]: Error:', err);
        onErrorCallback(err);
    }
};
