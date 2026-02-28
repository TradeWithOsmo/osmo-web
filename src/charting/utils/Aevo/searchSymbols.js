export const searchSymbols = async (
    userInput,
    exchange,
    symbolType,
    onResultReadyCallback,
    onErrorCallback
) => {
    try {
        const API_ORIGIN = (import.meta.env.VITE_API_URL || window.location.origin).replace(/\/$/, '');
        const response = await fetch(`${API_ORIGIN}/api/markets`);
        if (!response.ok) throw new Error('Failed to fetch markets');

        const data = await response.json();
        // Filter specifically for Aevo markets
        const aevoMarkets = (data.markets || []).filter(m => m.source.toLowerCase() === 'aevo');

        const query = userInput.toLowerCase();
        const filtered = aevoMarkets
            .filter(m => m.symbol.toLowerCase().includes(query))
            .map(m => ({
                symbol: m.symbol,
                full_name: `${m.symbol} (Aevo)`,
                description: `${m.from}/${m.to}`,
                exchange: 'Aevo',
                type: 'crypto',
            }));

        onResultReadyCallback(filtered);
    } catch (err) {
        console.error('[Aevo searchSymbols]: Error:', err);
        onErrorCallback(err);
    }
};
