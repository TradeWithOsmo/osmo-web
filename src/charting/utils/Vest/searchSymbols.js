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
        const vestMarkets = (data.markets || []).filter(m => m.source.toLowerCase() === 'vest');

        const query = userInput.toLowerCase();
        const filtered = vestMarkets
            .filter(m => m.symbol.toLowerCase().includes(query))
            .map(m => ({
                symbol: m.symbol,
                full_name: `${m.symbol} (Vest)`,
                description: `${m.from}/${m.to}`,
                exchange: 'Vest',
                type: 'crypto',
            }));

        onResultReadyCallback(filtered);
    } catch (err) {
        console.error('[Vest searchSymbols]: Error:', err);
        onErrorCallback(err);
    }
};
