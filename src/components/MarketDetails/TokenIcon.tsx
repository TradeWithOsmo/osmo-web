import React, { useState, useEffect, useRef } from 'react';
import { useTokenListStore } from '../../store/useTokenListStore';
import { useIconStore } from '../../store/useIconStore';

interface TokenIconProps {
    symbol: string;
    size?: number;
    className?: string;
}

// ── Permanent icon URL cache (localStorage) ───────────────────────────────────
const ICON_CACHE_KEY = 'osmo_icon_cache_v1';

const iconCache: Record<string, string> = (() => {
    try {
        return JSON.parse(localStorage.getItem(ICON_CACHE_KEY) || '{}');
    } catch {
        return {};
    }
})();

function cacheIcon(sym: string, url: string) {
    iconCache[sym] = url;
    try {
        localStorage.setItem(ICON_CACHE_KEY, JSON.stringify(iconCache));
    } catch { /* quota exceeded, skip */ }
}

// ── Consistent color per symbol ───────────────────────────────────────────────
const symbolColor = (sym: string): string => {
    const colors = ['#7B5EA7', '#4A90D9', '#E07B54', '#5CB85C', '#D9534F', '#F0AD4E', '#5BC0DE', '#9B59B6'];
    let hash = 0;
    for (let i = 0; i < sym.length; i++) hash = sym.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
};

// ── Fallback CDN/repo sources (tried in order on error) ──────────────────────
function getSources(sym: string, tokenMap: Record<string, string>): string[] {
    const s = sym.toLowerCase();
    const list: string[] = [];

    // 1. web3icons — 2500+ curated token SVGs (uppercase tickers)
    list.push(`https://raw.githubusercontent.com/0xa3k5/web3icons/main/raw-svgs/tokens/${sym}.svg`);
    list.push(`https://cdn.jsdelivr.net/gh/0xa3k5/web3icons@main/raw-svgs/tokens/${sym}.svg`);

    // 2. Cryptofonts — 1200+ SVG icons (lowercase tickers)
    list.push(`https://raw.githubusercontent.com/Cryptofonts/cryptofont/master/SVG/${s}.svg`);
    list.push(`https://cdn.jsdelivr.net/gh/Cryptofonts/cryptofont@master/SVG/${s}.svg`);

    // 3. Verified token list (Uniswap + CoinGecko + Coinpaprika via store)
    if (tokenMap[sym]) list.push(tokenMap[sym]);

    // 4. CoinCap CDN
    list.push(`https://assets.coincap.io/assets/icons/${s}@2x.png`);

    // 5. Coinpaprika static CDN
    list.push(`https://static.coinpaprika.com/coin/${s}-${s}/logo.png`);

    // 6. AtomicLabs via jsDelivr (~800 coins)
    list.push(`https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@master/128/color/${s}.png`);

    // 7. AtomicLabs raw GitHub
    list.push(`https://raw.githubusercontent.com/atomiclabs/cryptocurrency-icons/master/128/color/${s}.png`);

    // 8. ErikThiart repo (3000+ coins)
    list.push(`https://raw.githubusercontent.com/ErikThiart/cryptocurrency-icons/master/16/${s}.png`);

    // 9. Coinwink crypto-logos repo
    list.push(`https://raw.githubusercontent.com/coinwink/crypto-logos/master/coins/32x32/${s}.png`);

    // 10. Trustwallet assets
    list.push(`https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/info/${s}/logo.png`);

    return [...new Set(list)]; // deduplicate
}

// ─────────────────────────────────────────────────────────────────────────────

const TokenIcon: React.FC<TokenIconProps> = ({ symbol, size = 24, className }) => {
    const { tokenMap } = useTokenListStore();
    const { getIcon, requestIcons } = useIconStore();
    const baseSymbol = symbol.split('-')[0].toUpperCase();

    // Backend-resolved URL (most reliable — no probing needed)
    const backendIcon = getIcon(baseSymbol);
    const backendUrl = backendIcon?.url ?? null;

    // Request backend resolution on first render of this symbol
    useEffect(() => {
        if (!backendIcon) requestIcons([baseSymbol]);
    }, [baseSymbol]);

    // localStorage cache as secondary persistent source
    const cachedUrl = backendUrl ?? iconCache[baseSymbol] ?? null;

    const [attempt, setAttempt] = useState(0);
    const [src, setSrc] = useState<string>(() =>
        cachedUrl ?? getSources(baseSymbol, tokenMap)[0] ?? ''
    );
    const [allFailed, setAllFailed] = useState(false);
    const usingCache = useRef(!!cachedUrl);

    useEffect(() => {
        const cached = backendUrl ?? iconCache[baseSymbol];
        if (cached) {
            setSrc(cached);
            setAttempt(0);
            setAllFailed(false);
            usingCache.current = true;
        } else {
            const sources = getSources(baseSymbol, tokenMap);
            setSrc(sources[0] ?? '');
            setAttempt(0);
            setAllFailed(false);
            usingCache.current = false;
        }
    }, [baseSymbol, tokenMap, backendUrl]);

    const handleLoad = () => {
        // Save the first URL that worked to permanent cache
        if (!usingCache.current && src) {
            cacheIcon(baseSymbol, src);
            usingCache.current = true;
        }
    };

    const handleError = () => {
        if (usingCache.current) {
            // Cached URL broken (asset removed) — clear cache and retry from sources
            delete iconCache[baseSymbol];
            try { localStorage.setItem(ICON_CACHE_KEY, JSON.stringify(iconCache)); } catch { }
            usingCache.current = false;
            const sources = getSources(baseSymbol, tokenMap);
            setSrc(sources[0] ?? '');
            setAttempt(0);
            return;
        }
        const sources = getSources(baseSymbol, tokenMap);
        const next = attempt + 1;
        if (next < sources.length) {
            setSrc(sources[next]);
            setAttempt(next);
        } else {
            setAllFailed(true);
        }
    };

    if (allFailed || !src) {
        const abbr = baseSymbol.slice(0, 3);
        const fontSize = size <= 20 ? size * 0.42 : size * 0.36;
        return (
            <div
                className={className}
                style={{
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    background: symbolColor(baseSymbol),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize,
                    fontWeight: 700,
                    color: '#fff',
                    flexShrink: 0,
                    userSelect: 'none',
                }}
            >
                {abbr}
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={baseSymbol}
            width={size}
            height={size}
            className={className}
            onLoad={handleLoad}
            onError={handleError}
            style={{ borderRadius: '50%', objectFit: 'cover' }}
        />
    );
};

export default TokenIcon;
