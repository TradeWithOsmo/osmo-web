/**
 * MarketIcon — Universal market icon component
 *
 * Automatically routes to the correct icon renderer based on asset category:
 *   Forex / Stock / Index / Commodities  →  RWAIcon  (dual-flag for forex, local SVG + fallback chain for others)
 *   Crypto (or unknown)                  →  TokenIcon (web3icons, cryptofont, coincap, etc.)
 *
 * Pass `category` from MarketData when available for best results.
 * Falls back to symbol-pattern detection (forex pairs) when category is absent.
 */

import React from 'react';
import TokenIcon from './TokenIcon';
import RWAIcon from './RWAIcon';

interface MarketIconProps {
    symbol: string;
    size?: number;
    className?: string;
    /** MarketData.category — e.g. "Crypto", "Forex", "Stock", "Index", "Commodities" */
    category?: string;
}

const RWA_CATEGORIES = new Set([
    'forex', 'stock', 'stocks', 'index', 'indices',
    'commodities', 'commodity', 'metals', 'energy', 'rwa',
]);

// Known fiat currencies for symbol-based forex detection
const FIAT_CURRENCIES = new Set([
    'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'NZD', 'CAD', 'CHF', 'MXN',
    'SGD', 'HKD', 'NOK', 'SEK', 'DKK', 'TRY', 'ZAR', 'BRL', 'CNY',
    'INR', 'KRW', 'TWD', 'HUF', 'CZK', 'PLN', 'THB', 'IDR', 'MYR',
    'PHP', 'RUB', 'UAH', 'COP', 'CLP', 'PEN', 'ARS', 'VND',
]);

function isForexSymbol(symbol: string): boolean {
    const parts = symbol.split('-');
    if (parts.length === 2 && parts[0].length >= 3 && parts[1].length >= 3) {
        const b = parts[0].slice(0, 3).toUpperCase();
        const q = parts[1].slice(0, 3).toUpperCase();
        return FIAT_CURRENCIES.has(b) && FIAT_CURRENCIES.has(q);
    }
    const clean = symbol.replace('-', '').toUpperCase();
    if (clean.length === 6) {
        return FIAT_CURRENCIES.has(clean.slice(0, 3)) && FIAT_CURRENCIES.has(clean.slice(3));
    }
    return false;
}

const MarketIcon: React.FC<MarketIconProps> = ({ symbol, size = 24, className, category }) => {
    const cat = (category || '').toLowerCase();
    const useRWA = RWA_CATEGORIES.has(cat) || (!category && isForexSymbol(symbol));

    return useRWA
        ? <RWAIcon symbol={symbol} size={size} className={className} />
        : <TokenIcon symbol={symbol} size={size} className={className} />;
};

export default MarketIcon;
