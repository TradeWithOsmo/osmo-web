import { onReady } from '../../utils/Vest/onReady.js';
import { resolveSymbol } from '../../utils/Vest/resolveSymbol.js';
import { getBars, subscribeBars, unsubscribeBars } from '../../utils/Vest/getBars.js';
import { searchSymbols } from '../../utils/Vest/searchSymbols.js';

const VestDatafeed = {
    onReady,
    resolveSymbol,
    getBars,
    subscribeBars,
    unsubscribeBars,
    searchSymbols,
};

export default VestDatafeed;
