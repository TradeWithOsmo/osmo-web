export const searchSymbols = async (
    userInput,
    exchange,
    symbolType,
    onResultReadyCallback,
    onErrorCallback
) => {
    try {
        const API_ORIGIN = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:8000';
        const response = await fetch(`${API_ORIGIN}/api/markets`);
        if (!response.ok) throw new Error('Failed to fetch markets');

        const data = await response.json();
        // Filter specifically for Aster markets
        const asterMarkets = data.filter(m => m.source.toLowerCase() === 'aster');

        const query = userInput.toLowerCase();
        const filtered = asterMarkets
            .filter(m => m.symbol.toLowerCase().includes(query))
            .map(m => ({
                symbol: m.symbol,
                full_name: `${m.symbol} (Aster)`,
                description: `${m.from}/${m.to}`,
                exchange: 'Aster',
                type: 'crypto',
            }));

        onResultReadyCallback(filtered);
    } catch (err) {
        console.error('[Aster searchSymbols]: Error:', err);
        onErrorCallback(err);
    }
};
