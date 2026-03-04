import { onReady } from '../../utils/Paradex/onReady.js';
import { resolveSymbol } from '../../utils/Paradex/resolveSymbol.js';
import { getBars, subscribeBars, unsubscribeBars } from '../../utils/Paradex/getBars.js';
import { searchSymbols } from '../../utils/Paradex/searchSymbols.js';

const ParadexDatafeed = {
    onReady,
    resolveSymbol,
    getBars,
    subscribeBars,
    unsubscribeBars,
    searchSymbols,
};

export default ParadexDatafeed;
