import React, { useEffect } from 'react';
import { useIconStore } from '../../store/useIconStore';

const _API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

// Stock Imports (local SVGs — not in global-trade-react-icon)
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

// Commodity imports not in package (CL=WTI crude, HG=copper)
import cl from '../../assets/logonew/comuditas/cl.svg';
import hg from '../../assets/logonew/comuditas/hg.svg';

// Index Imports (not in package)
import dax from '../../assets/logonew/index/dax.svg';
import dji from '../../assets/logonew/index/dji.svg';
import ftse from '../../assets/logonew/index/ftse.svg';
import hsi from '../../assets/logonew/index/hsi.svg';
import ndx from '../../assets/logonew/index/ndx.svg';
import nik from '../../assets/logonew/index/nik.svg';
import spx from '../../assets/logonew/index/spx.svg';

// ── Local asset map ────────────────────────────────────────────────────────────
const LOCAL_ASSETS: Record<string, string> = {
    'CL': cl, 'HG': hg,
    'AAPL': aapl, 'AMD': amd, 'AMZN': amzn, 'BMNR': bmnr, 'COST': cost,
    'CRCL': crcl, 'CVX': cvx, 'GLXY': glxy, 'GOOG': goog, 'HOOD': hood,
    'META': meta, 'MSFT': msft, 'MSTR': mstr, 'NFLX': nflx, 'NVDA': nvda,
    'ORCL': orcl, 'PLTR': pltr, 'RIVN': rivn, 'XOM': xom, 'COIN': coin,
    'TSLA': tsla, 'SBET': sbet,
    'DAX': dax, 'DJI': dji, 'FTSE': ftse, 'HSI': hsi, 'NDX': ndx, 'NIK': nik, 'SPX': spx,
    'DAXEUR': dax, 'DJIUSD': dji, 'FTSEGBP': ftse, 'HSIHKD': hsi,
    'NDXUSD': ndx, 'NIKJPY': nik, 'SPXUSD': spx,
};

// ── Forex fiat currencies ──────────────────────────────────────────────────────
const FIAT_CURRENCIES = new Set([
    'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'NZD', 'CAD', 'CHF', 'MXN',
    'SGD', 'HKD', 'NOK', 'SEK', 'DKK', 'TRY', 'ZAR', 'BRL', 'CNY',
    'INR', 'KRW', 'TWD', 'HUF', 'CZK', 'PLN', 'THB', 'IDR', 'MYR',
    'PHP', 'RUB', 'UAH', 'COP', 'CLP', 'PEN', 'ARS', 'VND',
]);

const CURRENCY_TO_ALPHA3: Record<string, string> = {
    USD: 'USA', EUR: 'EUR', GBP: 'GBR', JPY: 'JPN', AUD: 'AUS',
    NZD: 'NZL', CAD: 'CAN', CHF: 'CHE', MXN: 'MEX', SGD: 'SGP',
    HKD: 'HKG', NOK: 'NOR', SEK: 'SWE', DKK: 'DNK', TRY: 'TUR',
    ZAR: 'ZAF', BRL: 'BRA', CNY: 'CHN', INR: 'IND', KRW: 'KOR',
    TWD: 'TWN', HUF: 'HUN', CZK: 'CZE', PLN: 'POL', THB: 'THA',
    IDR: 'IDN', MYR: 'MYS', PHP: 'PHL', RUB: 'RUS', UAH: 'UKR',
    COL: 'co', CHL: 'cl', PER: 'pe', ARG: 'ar', VND: 'VNM',
};

const ALPHA3_TO_ALPHA2: Record<string, string> = {
    USA: 'us', GBR: 'gb', EUR: 'eu', JPN: 'jp', AUS: 'au', NZL: 'nz',
    CAN: 'ca', CHE: 'ch', MEX: 'mx', SGP: 'sg', HKG: 'hk', NOR: 'no',
    SWE: 'se', DNK: 'dk', TUR: 'tr', ZAF: 'za', BRA: 'br', CHN: 'cn',
    IND: 'in', KOR: 'kr', TWN: 'tw', HUN: 'hu', CZE: 'cz', POL: 'pl',
    THA: 'th', IDN: 'id', MYS: 'my', PHL: 'ph', RUS: 'ru', UKR: 'ua',
    COL: 'co', CHL: 'cl', PER: 'pe', ARG: 'ar', VNM: 'vn',
};

interface LocalForex { kind: 'forex'; base: string; quote: string }
interface LocalAsset { kind: 'local'; src: string }
type LocalResult = LocalForex | LocalAsset | null;

function classifyLocal(symbol: string): LocalResult {
    const parts = symbol.split('-');
    const base = parts[0].toUpperCase();
    const quote = parts[1]?.toUpperCase();
    const full = symbol.replace('-', '').toUpperCase();

    if (quote && FIAT_CURRENCIES.has(base) && FIAT_CURRENCIES.has(quote)) {
        return { kind: 'forex', base, quote };
    }
    if (!quote && full.length === 6) {
        const b = full.slice(0, 3), q = full.slice(3);
        if (FIAT_CURRENCIES.has(b) && FIAT_CURRENCIES.has(q)) return { kind: 'forex', base: b, quote: q };
    }

    const localSrc = LOCAL_ASSETS[full] ?? LOCAL_ASSETS[base];
    if (localSrc) return { kind: 'local', src: localSrc };

    return null;
}

// ── Consistent color per symbol ────────────────────────────────────────────────
const symbolColor = (sym: string): string => {
    const colors = ['#7B5EA7', '#4A90D9', '#E07B54', '#5CB85C', '#D9534F', '#F0AD4E', '#5BC0DE', '#9B59B6'];
    let hash = 0;
    for (let i = 0; i < sym.length; i++) hash = sym.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
};

// ── Shared circle wrapper ──────────────────────────────────────────────────────
const iconCircle: React.CSSProperties = {
    borderRadius: '50%',
    overflow: 'hidden',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.06)',
};

// ── Skeleton placeholder (replaces immediate LetterFallback while loading) ─────
const IconSkeleton: React.FC<{ size: number; className?: string }> = ({ size, className }) => (
    <div
        className={className}
        style={{
            width: size,
            height: size,
            borderRadius: '50%',
            flexShrink: 0,
            background: 'rgba(255,255,255,0.08)',
            animation: 'rwa-skeleton-pulse 1.4s ease-in-out infinite',
        }}
    />
);

// ── Single currency flag circle ────────────────────────────────────────────────
const CurrencyFlag: React.FC<{ ccy: string; size: number; style?: React.CSSProperties }> = ({ ccy, size, style }) => {
    const alpha3 = CURRENCY_TO_ALPHA3[ccy] ?? ccy;
    const alpha2 = ALPHA3_TO_ALPHA2[alpha3] ?? alpha3.slice(0, 2).toLowerCase();
    return (
        <div style={{ ...iconCircle, width: size, height: size, ...style }}>
            <img
                src={`${_API_URL}/icons/country-flags/svg/${alpha2}.svg`}
                alt={ccy}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={(e) => { (e.target as HTMLImageElement).src = `https://flagcdn.com/w40/${alpha2}.png`; }}
            />
        </div>
    );
};

// ── Dual-flag forex icon ───────────────────────────────────────────────────────
const ForexIcon: React.FC<{ baseCcy: string; quoteCcy: string; size: number; className?: string }> = ({
    baseCcy, quoteCcy, size, className,
}) => {
    const flagSize = Math.round(size * 0.68);
    return (
        <div className={className} style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
            <CurrencyFlag ccy={quoteCcy} size={flagSize} style={{
                position: 'absolute', top: 0, right: 0,
                border: '1px solid rgba(255,255,255,0.15)', zIndex: 0,
            }} />
            <CurrencyFlag ccy={baseCcy} size={flagSize} style={{
                position: 'absolute', bottom: 0, left: 0,
                border: '1.5px solid rgba(20,20,20,0.6)', zIndex: 1,
            }} />
        </div>
    );
};

// ── Letter fallback (only shown when icon is confirmed missing) ────────────────
const LetterFallback: React.FC<{ sym: string; size: number; className?: string }> = ({ sym, size, className }) => {
    const abbr = sym.replace('-', '').slice(0, 3);
    const fontSize = size <= 20 ? size * 0.42 : size * 0.36;
    return (
        <div className={className} style={{
            width: size, height: size, borderRadius: '50%',
            background: symbolColor(sym),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize, fontWeight: 700, color: '#fff',
            flexShrink: 0, userSelect: 'none',
        }}>
            {abbr}
        </div>
    );
};

// ── Main component ─────────────────────────────────────────────────────────────

interface RWAIconProps {
    symbol: string;
    size?: number;
    className?: string;
}

const RWAIcon: React.FC<RWAIconProps> = ({ symbol, size = 24, className }) => {
    const { getIcon, requestIcons } = useIconStore();
    const sym = symbol.toUpperCase();

    // Local fast-path: forex, local SVG — renders instantly, no backend wait
    const local = classifyLocal(symbol);

    // Request backend for symbols that need probing
    useEffect(() => {
        if (!local) requestIcons([sym]);
    }, [sym]);

    // ── Forex: dual-flag ───────────────────────────────────────────────────────
    if (local?.kind === 'forex') {
        return <ForexIcon baseCcy={local.base} quoteCcy={local.quote} size={size} className={className} />;
    }

    // ── Bundled local SVG ──────────────────────────────────────────────────────
    if (local?.kind === 'local') {
        return (
            <div className={className} style={{ ...iconCircle, width: size, height: size }}>
                <img src={local.src} alt={symbol} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
        );
    }

    // ── Backend result ─────────────────────────────────────────────────────────
    const icon = getIcon(sym);

    // undefined = still loading → show skeleton, NOT letter fallback
    // This is the key fix: previously undefined fell through to LetterFallback
    if (icon === undefined) {
        return <IconSkeleton size={size} className={className} />;
    }

    // { url: "..." } = icon found
    if (icon?.url) {
        return (
            <div className={className} style={{ ...iconCircle, width: size, height: size }}>
                <img
                    src={icon.url}
                    alt={symbol}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    onError={(e) => {
                        // If URL is broken, remove from store so LetterFallback shows
                        (e.target as HTMLImageElement).style.display = 'none';
                    }}
                />
            </div>
        );
    }

    // { url: null } = confirmed no icon → show letter fallback
    return <LetterFallback sym={sym} size={size} className={className} />;
};

export default RWAIcon;

// ── Keyframe for skeleton pulse (inject once) ──────────────────────────────────
// Add this to your global CSS instead if preferred:
// @keyframes rwa-skeleton-pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
if (typeof document !== 'undefined') {
    const styleId = 'rwa-icon-skeleton-style';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `@keyframes rwa-skeleton-pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }`;
        document.head.appendChild(style);
    }
}