import { onReady } from '../../utils/dYdX/onReady.js';
import { resolveSymbol } from '../../utils/dYdX/resolveSymbol.js';
import { getBars, subscribeBars, unsubscribeBars } from '../../utils/dYdX/getBars.js';
import { searchSymbols } from '../../utils/dYdX/searchSymbols.js';

const dYdXDatafeed = {
    onReady,
    resolveSymbol,
    getBars,
    subscribeBars,
    unsubscribeBars,
    searchSymbols,
};

export default dYdXDatafeed;
