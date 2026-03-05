import { onReady } from '../../utils/Ostium/onReady.js';
import { resolveSymbol } from '../../utils/Ostium/resolveSymbol.js';
import { getBars, subscribeBars, unsubscribeBars } from '../../utils/Ostium/getBars.js';
import { searchSymbols } from '../../utils/Ostium/searchSymbols.js';

const OstiumDatafeed = {
    onReady,
    resolveSymbol,
    getBars,
    subscribeBars,
    unsubscribeBars,
    searchSymbols,
};

export default OstiumDatafeed;
