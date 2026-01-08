import { onReady } from '../utils/onReady.js';
import { resolveSymbol } from '../utils/resolveSymbol.js';
import { getBars, subscribeBars, unsubscribeBars } from '../utils/getBars.js';
import { searchSymbols } from '../utils/searchSymbols.js';

const Datafeed = {
  onReady,
  resolveSymbol,
  getBars,
  subscribeBars, 
  unsubscribeBars,
  searchSymbols,
};

export default Datafeed;
