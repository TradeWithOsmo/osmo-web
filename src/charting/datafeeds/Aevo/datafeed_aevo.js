import { onReady } from '../../utils/Aevo/onReady.js';
import { resolveSymbol } from '../../utils/Aevo/resolveSymbol.js';
import { getBars, subscribeBars, unsubscribeBars } from '../../utils/Aevo/getBars.js';
import { searchSymbols } from '../../utils/Aevo/searchSymbols.js';

const AevoDatafeed = {
    onReady,
    resolveSymbol,
    getBars,
    subscribeBars,
    unsubscribeBars,
    searchSymbols,
};

export default AevoDatafeed;
