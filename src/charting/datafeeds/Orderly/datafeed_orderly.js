import { onReady } from '../../utils/Orderly/onReady.js';
import { resolveSymbol } from '../../utils/Orderly/resolveSymbol.js';
import { getBars, subscribeBars, unsubscribeBars } from '../../utils/Orderly/getBars.js';
import { searchSymbols } from '../../utils/Orderly/searchSymbols.js';

const OrderlyDatafeed = {
    onReady,
    resolveSymbol,
    getBars,
    subscribeBars,
    unsubscribeBars,
    searchSymbols,
};

export default OrderlyDatafeed;
