import React, { useState, useEffect, useRef } from 'react';
import { useIconStore } from '../../store/useIconStore';

// Commodity Imports
import cl from '../../assets/logonew/comuditas/cl.svg';
import hg from '../../assets/logonew/comuditas/hg.svg';
import xag from '../../assets/logonew/comuditas/xag.svg';
import xau from '../../assets/logonew/comuditas/xau.svg';
import xpd from '../../assets/logonew/comuditas/xpd.svg';
import xpt from '../../assets/logonew/comuditas/xpt.svg';

// Stock Imports
import aapl from '../../assets/logonew/stock/aapl.svg';
import amd from '../../assets/logonew/stock/amd.svg';
import amzn from '../../assets/logonew/stock/amzn.svg';
import bmnr from '../../assets/logonew/stock/bmnr.svg';
import cost from '../../assets/logonew/stock/cost.svg';
import crcl from '../../assets/logonew/stock/crcl.svg';
import cvx from '../../assets/logonew/stock/cvx.svg';
import glxy from '../../assets/logonew/stock/glxy.svg';
import goog from '../../assets/logonew/stock/goog.svg';
import hood from '../../assets/logonew/stock/hood.svg';
import meta from '../../assets/logonew/stock/meta.svg';
import msft from '../../assets/logonew/stock/msft.svg';
import mstr from '../../assets/logonew/stock/mstr.svg';
import nflx from '../../assets/logonew/stock/nflx.svg';
import nvda from '../../assets/logonew/stock/nvda.svg';
import orcl from '../../assets/logonew/stock/orcl.svg';
import pltr from '../../assets/logonew/stock/pltr.svg';
import rivn from '../../assets/logonew/stock/rivn.svg';
import xom from '../../assets/logonew/stock/xom.svg';
import coin from '../../assets/logonew/stock/coin.svg';
import tsla from '../../assets/logonew/stock/tsla.svg';
import sbet from '../../assets/logonew/stock/sbet.svg';

// Index Imports
import dax from '../../assets/logonew/index/dax.svg';
import dji from '../../assets/logonew/index/dji.svg';
import ftse from '../../assets/logonew/index/ftse.svg';
import hsi from '../../assets/logonew/index/hsi.svg';
import ndx from '../../assets/logonew/index/ndx.svg';
import nik from '../../assets/logonew/index/nik.svg';
import spx from '../../assets/logonew/index/spx.svg';

// ── Local asset map (stocks, commodities, indices only — forex uses dual-flag) ─
const LOCAL_ASSETS: Record<string, string> = {
    // Commodities
    'XAU': xau, 'XAG': xag, 'CL': cl, 'HG': hg, 'XPD': xpd, 'XPT': xpt,
    // Stocks
    'AAPL': aapl, 'AMD': amd, 'AMZN': amzn, 'BMNR': bmnr, 'COST': cost,
    'CRCL': crcl, 'CVX': cvx, 'GLXY': glxy, 'GOOG': goog, 'HOOD': hood,
    'META': meta, 'MSFT': msft, 'MSTR': mstr, 'NFLX': nflx, 'NVDA': nvda,
    'ORCL': orcl, 'PLTR': pltr, 'RIVN': rivn, 'XOM': xom, 'COIN': coin,
    'TSLA': tsla, 'SBET': sbet,
    // Indices
    'DAX': dax, 'DJI': dji, 'FTSE': ftse, 'HSI': hsi, 'NDX': ndx, 'NIK': nik, 'SPX': spx,
    'DAXEUR': dax, 'DJIUSD': dji, 'FTSEGBP': ftse, 'HSIHKD': hsi, 'NDXUSD': ndx, 'NIKJPY': nik, 'SPXUSD': spx,
};

// ── Forex detection ────────────────────────────────────────────────────────────
const FIAT_CURRENCIES = new Set([
    'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'NZD', 'CAD', 'CHF', 'MXN',
    'SGD', 'HKD', 'NOK', 'SEK', 'DKK', 'TRY', 'ZAR', 'BRL', 'CNY',
    'INR', 'KRW', 'TWD', 'HUF', 'CZK', 'PLN', 'THB', 'IDR', 'MYR',
    'PHP', 'RUB', 'UAH', 'COP', 'CLP', 'PEN', 'ARS', 'VND',
]);

// currency code → ISO 3166-1 alpha-2 country code (for flagcdn fallback)
const CURRENCY_TO_COUNTRY: Record<string, string> = {
    USD: 'us', EUR: 'eu', GBP: 'gb', JPY: 'jp', AUD: 'au', NZD: 'nz',
    CAD: 'ca', CHF: 'ch', MXN: 'mx', SGD: 'sg', HKD: 'hk', NOK: 'no',
    SEK: 'se', DKK: 'dk', TRY: 'tr', ZAR: 'za', BRL: 'br', CNY: 'cn',
    INR: 'in', KRW: 'kr', TWD: 'tw', HUF: 'hu', CZK: 'cz', PLN: 'pl',
    THB: 'th', IDR: 'id', MYR: 'my', PHP: 'ph', RUB: 'ru', UAH: 'ua',
    COP: 'co', CLP: 'cl', PEN: 'pe', ARS: 'ar', VND: 'vn',
};

interface ForexPair { baseCcy: string; quoteCcy: string }

function detectForex(parts: string[], fullTicker: string): ForexPair | null {
    if (parts.length === 2 && parts[0].length === 3 && parts[1].length === 3) {
        const b = parts[0].toUpperCase();
        const q = parts[1].toUpperCase();
        if (FIAT_CURRENCIES.has(b) && FIAT_CURRENCIES.has(q)) return { baseCcy: b, quoteCcy: q };
    }
    if (fullTicker.length === 6) {
        const b = fullTicker.slice(0, 3);
        const q = fullTicker.slice(3, 6);
        if (FIAT_CURRENCIES.has(b) && FIAT_CURRENCIES.has(q)) return { baseCcy: b, quoteCcy: q };
    }
    return null;
}

// ── Currency flag sources ─────────────────────────────────────────────────────
function getFlagSources(ccy: string): string[] {
    const c = ccy.toLowerCase();
    const cc = CURRENCY_TO_COUNTRY[ccy];
    return [
        `https://raw.githubusercontent.com/Lissy93/currency-flags/master/assets/flags_png_circle/${c}.png`,
        ...(cc ? [`https://flagcdn.com/w40/${cc}.png`] : []),
        `https://wise.com/public-resources/assets/flags/rectangle/${c}.png`,
    ];
}

// ── Currency flag sub-component (single flag circle with fallback) ─────────────
const CurrencyFlag: React.FC<{ ccy: string; size: number; style?: React.CSSProperties }> = ({ ccy, size, style }) => {
    const sources = getFlagSources(ccy);
    const [idx, setIdx] = useState(0);
    const [failed, setFailed] = useState(false);

    useEffect(() => { setIdx(0); setFailed(false); }, [ccy]);

    if (failed) {
        return (
            <div style={{
                width: size, height: size, borderRadius: '50%',
                background: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: size * 0.36, fontWeight: 700, color: '#fff',
                ...style,
            }}>
                {ccy.slice(0, 2)}
            </div>
        );
    }
    return (
        <img
            src={sources[idx]}
            width={size} height={size}
            onError={() => {
                if (idx + 1 < sources.length) setIdx(idx + 1);
                else setFailed(true);
            }}
            style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', ...style }}
        />
    );
};

// ── Dual-flag forex icon ───────────────────────────────────────────────────────
const ForexIcon: React.FC<{ baseCcy: string; quoteCcy: string; size: number; className?: string }> = ({
    baseCcy, quoteCcy, size, className,
}) => {
    const flagSize = Math.round(size * 0.68);
    return (
        <div className={className} style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
            {/* Quote currency — behind, top-right */}
            <CurrencyFlag ccy={quoteCcy} size={flagSize} style={{
                position: 'absolute', top: 0, right: 0,
                border: '1px solid rgba(255,255,255,0.15)',
                zIndex: 0,
            }} />
            {/* Base currency — front, bottom-left */}
            <CurrencyFlag ccy={baseCcy} size={flagSize} style={{
                position: 'absolute', bottom: 0, left: 0,
                border: '1.5px solid rgba(20,20,20,0.6)',
                zIndex: 1,
            }} />
        </div>
    );
};

// ── Permanent icon URL cache ──────────────────────────────────────────────────
const ICON_CACHE_KEY = 'osmo_rwa_icon_cache_v1';

const iconCache: Record<string, string> = (() => {
    try { return JSON.parse(localStorage.getItem(ICON_CACHE_KEY) || '{}'); }
    catch { return {}; }
})();

function cacheIcon(sym: string, url: string) {
    iconCache[sym] = url;
    try { localStorage.setItem(ICON_CACHE_KEY, JSON.stringify(iconCache)); } catch { }
}

// ── Consistent color per symbol ───────────────────────────────────────────────
const symbolColor = (sym: string): string => {
    const colors = ['#7B5EA7', '#4A90D9', '#E07B54', '#5CB85C', '#D9534F', '#F0AD4E', '#5BC0DE', '#9B59B6'];
    let hash = 0;
    for (let i = 0; i < sym.length; i++) hash = sym.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
};

// ── Special commodity gradient fallbacks ─────────────────────────────────────
const COMMODITY_GRADIENTS: Record<string, { gradient: string; textColor: string }> = {
    XAU:    { gradient: 'linear-gradient(135deg, #FFD700, #B8860B)', textColor: '#000' },
    GOLD:   { gradient: 'linear-gradient(135deg, #FFD700, #B8860B)', textColor: '#000' },
    XAG:    { gradient: 'linear-gradient(135deg, #C0C0C0, #808080)', textColor: '#000' },
    SILVER: { gradient: 'linear-gradient(135deg, #C0C0C0, #808080)', textColor: '#000' },
    CL:     { gradient: 'linear-gradient(135deg, #444, #111)', textColor: '#fff' },
    BRENT:  { gradient: 'linear-gradient(135deg, #444, #111)', textColor: '#fff' },
    OIL:    { gradient: 'linear-gradient(135deg, #444, #111)', textColor: '#fff' },
    WTI:    { gradient: 'linear-gradient(135deg, #444, #111)', textColor: '#fff' },
    HG:     { gradient: 'linear-gradient(135deg, #B87333, #8B4513)', textColor: '#fff' },
    XPD:    { gradient: 'linear-gradient(135deg, #E0E0E0, #9E9E9E)', textColor: '#000' },
    XPT:    { gradient: 'linear-gradient(135deg, #E8E8E8, #AAAAAA)', textColor: '#000' },
};

// ── Fallback image sources for non-forex symbols ──────────────────────────────
function getSources(base: string, fullTicker: string): string[] {
    const list: string[] = [];

    // 1. Local bundled SVG
    if (LOCAL_ASSETS[fullTicker]) list.push(LOCAL_ASSETS[fullTicker]);
    else if (LOCAL_ASSETS[base]) list.push(LOCAL_ASSETS[base]);

    const b = base.toLowerCase();

    // 2. nvstly/icons — large stock icon collection (ALL CAPS tickers)
    list.push(`https://raw.githubusercontent.com/nvstly/icons/main/ticker_icons/${base}.png`);

    // 3. n3tn1nja/StockTickerIcons — stock logos
    list.push(`https://raw.githubusercontent.com/n3tn1nja/StockTickerIcons/main/icons/${base}.png`);

    // 4. Parqet — broad stock/ETF coverage (US + EU)
    list.push(`https://assets.parqet.com/logos/symbol/${base}`);

    // 5. Financial Modeling Prep — stock images
    list.push(`https://financialmodelingprep.com/image-stock/${base}.png`);

    // 6. Clearbit — company domain logo (works when ticker matches company .com)
    list.push(`https://logo.clearbit.com/${b}.com`);

    // 7. DiceBear initials — universal SVG text fallback (always succeeds)
    list.push(`https://api.dicebear.com/7.x/initials/svg?seed=${base}&backgroundColor=3A2530&fontSize=45`);

    return [...new Set(list)];
}

// ─────────────────────────────────────────────────────────────────────────────

interface RWAIconProps {
    symbol: string;
    size?: number;
    className?: string;
}

const RWAIcon: React.FC<RWAIconProps> = ({ symbol, size = 24, className }) => {
    const { getIcon, requestIcons } = useIconStore();
    const parts = symbol.split('-');
    const base = parts[0].toUpperCase();
    const fullTicker = symbol.replace('-', '').toUpperCase();
    const forexInfo = detectForex(parts, fullTicker);

    // ── All hooks MUST be called unconditionally (Rules of Hooks) ─────────────
    const cacheKey = fullTicker;
    // Backend-resolved URL is the most reliable primary source
    const backendIcon = !forexInfo ? getIcon(cacheKey) || getIcon(base) : undefined;
    const backendUrl = backendIcon?.url ?? null;
    const cachedUrl = backendUrl ?? (!forexInfo ? iconCache[cacheKey] || iconCache[base] : undefined) ?? undefined;

    const [attempt, setAttempt] = useState(0);
    const [src, setSrc] = useState<string>(() =>
        forexInfo ? '' : (cachedUrl ?? getSources(base, fullTicker)[0] ?? '')
    );
    const [allFailed, setAllFailed] = useState(false);
    const usingCache = useRef(!forexInfo && !!cachedUrl);

    // Request backend resolution for non-forex symbols
    useEffect(() => {
        if (!forexInfo && !backendIcon) requestIcons([cacheKey]);
    }, [cacheKey]);

    useEffect(() => {
        if (forexInfo) return;
        const cached = backendUrl ?? iconCache[cacheKey] ?? iconCache[base];
        if (cached) {
            setSrc(cached);
            setAttempt(0);
            setAllFailed(false);
            usingCache.current = true;
        } else {
            setSrc(getSources(base, fullTicker)[0] ?? '');
            setAttempt(0);
            setAllFailed(false);
            usingCache.current = false;
        }
    }, [symbol, backendUrl]);

    // ── Forex: render after hooks ─────────────────────────────────────────────
    if (forexInfo) {
        return <ForexIcon baseCcy={forexInfo.baseCcy} quoteCcy={forexInfo.quoteCcy} size={size} className={className} />;
    }

    const handleLoad = () => {
        if (!usingCache.current && src) {
            cacheIcon(cacheKey, src);
            usingCache.current = true;
        }
    };

    const handleError = () => {
        if (usingCache.current) {
            delete iconCache[cacheKey];
            try { localStorage.setItem(ICON_CACHE_KEY, JSON.stringify(iconCache)); } catch { }
            usingCache.current = false;
            setSrc(getSources(base, fullTicker)[0] ?? '');
            setAttempt(0);
            return;
        }
        const sources = getSources(base, fullTicker);
        const next = attempt + 1;
        if (next < sources.length) {
            setSrc(sources[next]);
            setAttempt(next);
        } else {
            setAllFailed(true);
        }
    };

    if (allFailed || !src) {
        const commodity = COMMODITY_GRADIENTS[base];
        if (commodity) {
            return (
                <div className={className} style={{
                    width: size, height: size, borderRadius: '50%',
                    background: commodity.gradient,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: size * 0.4, fontWeight: 'bold', color: commodity.textColor,
                    border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0,
                }}>
                    {base.charAt(0)}
                </div>
            );
        }
        const abbr = base.slice(0, 3);
        const fontSize = size <= 20 ? size * 0.42 : size * 0.36;
        return (
            <div className={className} style={{
                width: size, height: size, borderRadius: '50%',
                background: symbolColor(base),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize, fontWeight: 700, color: '#fff',
                flexShrink: 0, userSelect: 'none',
            }}>
                {abbr}
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={symbol}
            width={size}
            height={size}
            className={className}
            onLoad={handleLoad}
            onError={handleError}
            style={{ borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.05)' }}
        />
    );
};

export default RWAIcon;
