// Symbol search functionality for TradingView chart
export const searchSymbols = (
  userInput,
  exchange,
  symbolType,
  onResultReadyCallback,
  onErrorCallback
) => {
  // Common trading pairs that can be searched
  const symbols = [
    { symbol: 'BTC', full_name: 'BTC/USDT', description: 'Bitcoin', type: 'crypto', exchange: 'Binance' },
    { symbol: 'ETH', full_name: 'ETH/USDT', description: 'Ethereum', type: 'crypto', exchange: 'Binance' },
    { symbol: 'USDT', full_name: 'USDT/WETH', description: 'Tether', type: 'crypto', exchange: 'Uniswap' },
    { symbol: 'USDC', full_name: 'USDC/USDT', description: 'USD Coin', type: 'crypto', exchange: 'Binance' },
    { symbol: 'BNB', full_name: 'BNB/USDT', description: 'Binance Coin', type: 'crypto', exchange: 'Binance' },
    { symbol: 'SOL', full_name: 'SOL/USDT', description: 'Solana', type: 'crypto', exchange: 'Binance' },
    { symbol: 'ADA', full_name: 'ADA/USDT', description: 'Cardano', type: 'crypto', exchange: 'Binance' },
    { symbol: 'XRP', full_name: 'XRP/USDT', description: 'Ripple', type: 'crypto', exchange: 'Binance' },
    { symbol: 'DOGE', full_name: 'DOGE/USDT', description: 'Dogecoin', type: 'crypto', exchange: 'Binance' },
    { symbol: 'AVAX', full_name: 'AVAX/USDT', description: 'Avalanche', type: 'crypto', exchange: 'Binance' },
  ];

  // Filter symbols based on user input
  const filteredSymbols = symbols.filter(item => 
    item.symbol.toLowerCase().includes(userInput.toLowerCase()) ||
    item.full_name.toLowerCase().includes(userInput.toLowerCase()) ||
    item.description.toLowerCase().includes(userInput.toLowerCase())
  );

  onResultReadyCallback(filteredSymbols);
};