import { onReady } from '../../utils/Lighter/onReady.js';
import { resolveSymbol } from '../../utils/Lighter/resolveSymbol.js';
import { getBars, subscribeBars, unsubscribeBars } from '../../utils/Lighter/getBars.js';
import { searchSymbols } from '../../utils/Lighter/searchSymbols.js';

const LighterDatafeed = {
    onReady,
    resolveSymbol,
    getBars,
    subscribeBars,
    unsubscribeBars,
    searchSymbols,
};

export default LighterDatafeed;
