import { onReady } from '../../utils/Avantis/onReady.js';
import { resolveSymbol } from '../../utils/Avantis/resolveSymbol.js';
import { getBars, subscribeBars, unsubscribeBars } from '../../utils/Avantis/getBars.js';
import { searchSymbols } from '../../utils/Avantis/searchSymbols.js';

const AvantisDatafeed = {
    onReady,
    resolveSymbol,
    getBars,
    subscribeBars,
    unsubscribeBars,
    searchSymbols,
};

export default AvantisDatafeed;
