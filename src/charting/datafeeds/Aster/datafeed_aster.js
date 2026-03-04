import { onReady } from '../../utils/Aster/onReady.js';
import { resolveSymbol } from '../../utils/Aster/resolveSymbol.js';
import { getBars, subscribeBars, unsubscribeBars } from '../../utils/Aster/getBars.js';
import { searchSymbols } from '../../utils/Aster/searchSymbols.js';

const AsterDatafeed = {
    onReady,
    resolveSymbol,
    getBars,
    subscribeBars,
    unsubscribeBars,
    searchSymbols,
};

export default AsterDatafeed;
