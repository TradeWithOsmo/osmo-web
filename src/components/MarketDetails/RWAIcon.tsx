import React, { useEffect } from 'react';
import { TradeFlagIcon } from 'global-trade-react-icon';
import { useIconStore } from '../../store/useIconStore';

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

// ── Local asset map (stocks, indices, and commodities not in package) ──────────
const LOCAL_ASSETS: Record<string, string> = {
    // Commodities not in package
    'CL': cl, 'HG': hg,
    // Stocks
    'AAPL': aapl, 'AMD': amd, 'AMZN': amzn, 'BMNR': bmnr, 'COST': cost,
    'CRCL': crcl, 'CVX': cvx, 'GLXY': glxy, 'GOOG': goog, 'HOOD': hood,
    'META': meta, 'MSFT': msft, 'MSTR': mstr, 'NFLX': nflx, 'NVDA': nvda,
    'ORCL': orcl, 'PLTR': pltr, 'RIVN': rivn, 'XOM': xom, 'COIN': coin,
    'TSLA': tsla, 'SBET': sbet,
    // Indices (base and compound forms)
    'DAX': dax, 'DJI': dji, 'FTSE': ftse, 'HSI': hsi, 'NDX': ndx, 'NIK': nik, 'SPX': spx,
    'DAXEUR': dax, 'DJIUSD': dji, 'FTSEGBP': ftse, 'HSIHKD': hsi, 'NDXUSD': ndx, 'NIKJPY': nik, 'SPXUSD': spx,
};

// Forex currency code → ISO 3166-1 alpha-3 country code (used by global-trade-react-icon)
const CURRENCY_TO_ALPHA3: Record<string, string> = {
    USD: 'USA', EUR: 'EUR', GBP: 'GBR', JPY: 'JPN', AUD: 'AUS',
    NZD: 'NZL', CAD: 'CAN', CHF: 'CHE', MXN: 'MEX', SGD: 'SGP',
    HKD: 'HKG', NOK: 'NOR', SEK: 'SWE', DKK: 'DNK', TRY: 'TUR',
    ZAR: 'ZAF', BRL: 'BRA', CNY: 'CHN', INR: 'IND', KRW: 'KOR',
    TWD: 'TWN', HUF: 'HUN', CZK: 'CZE', PLN: 'POL', THB: 'THA',
    IDR: 'IDN', MYR: 'MYS', PHP: 'PHL', RUB: 'RUS', UAH: 'UKR',
    COP: 'COL', CLP: 'CHL', PEN: 'PER', ARS: 'ARG', VND: 'VNM',
};

// ── Consistent color per symbol ───────────────────────────────────────────────
const symbolColor = (sym: string): string => {
    const colors = ['#7B5EA7', '#4A90D9', '#E07B54', '#5CB85C', '#D9534F', '#F0AD4E', '#5BC0DE', '#9B59B6'];
    let hash = 0;
    for (let i = 0; i < sym.length; i++) hash = sym.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
};

// ── Single currency flag circle using global-trade-react-icon ─────────────────
const CurrencyFlag: React.FC<{ ccy: string; size: number; style?: React.CSSProperties }> = ({ ccy, size, style }) => {
    const code = CURRENCY_TO_ALPHA3[ccy] ?? ccy;
    const overflow = Math.round(size * 0.15);
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%',
            overflow: 'hidden', flexShrink: 0, ...style,
        }}>
            <TradeFlagIcon
                icon={code}
                style={{
                    width: size + overflow * 2,
                    height: size + overflow * 2,
                    marginLeft: -overflow,
                    marginTop: -overflow,
                    display: 'block',
                }}
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

// ── Package icon (metals / commodities via global-trade-react-icon) ───────────
const PackageIcon: React.FC<{ code: string; size: number; className?: string }> = ({ code, size, className }) => (
    <div className={className} style={{
        width: size, height: size, borderRadius: '50%',
        overflow: 'hidden', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px solid rgba(255,255,255,0.05)',
    }}>
        <TradeFlagIcon icon={code} style={{ width: size, height: size, display: 'block' }} />
    </div>
);

// ── Letter fallback ────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────

interface RWAIconProps {
    symbol: string;
    size?: number;
    className?: string;
}

const RWAIcon: React.FC<RWAIconProps> = ({ symbol, size = 24, className }) => {
    const { getIcon, requestIcons } = useIconStore();
    const sym = symbol.toUpperCase();

    useEffect(() => {
        requestIcons([sym]);
    }, [sym]);

    const icon = getIcon(sym);

    // Not yet resolved — show letter fallback while loading
    if (!icon) {
        return <LetterFallback sym={sym} size={size} className={className} />;
    }

    if (icon.type === 'forex') {
        return <ForexIcon baseCcy={icon.base!} quoteCcy={icon.quote!} size={size} className={className} />;
    }

    if (icon.type === 'package') {
        return <PackageIcon code={icon.code!} size={size} className={className} />;
    }

    if (icon.type === 'local') {
        const localSrc = LOCAL_ASSETS[icon.key!.toUpperCase()];
        if (localSrc) {
            return (
                <img
                    src={localSrc}
                    alt={symbol}
                    width={size}
                    height={size}
                    className={className}
                    style={{ borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.05)' }}
                />
            );
        }
    }

    if (icon.url) {
        return (
            <img
                src={icon.url}
                alt={symbol}
                width={size}
                height={size}
                className={className}
                style={{ borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.05)' }}
            />
        );
    }

    return <LetterFallback sym={sym} size={size} className={className} />;
};

export default RWAIcon;
