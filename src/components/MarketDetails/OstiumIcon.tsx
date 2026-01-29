import React, { useState, useEffect } from 'react';

// Forex Imports
import audusd from '../../assets/logonew/forex/audusd.svg';
import eurusd from '../../assets/logonew/forex/eurusd.svg';
import gbpusd from '../../assets/logonew/forex/gbpusd.svg';
import nzdusd from '../../assets/logonew/forex/nzdusd.svg';
import usacad from '../../assets/logonew/forex/usacad.svg';
import usdchf from '../../assets/logonew/forex/usdchf.svg';
import usdjpy from '../../assets/logonew/forex/usdjpy.svg';
import usdmxn from '../../assets/logonew/forex/usdmxn.svg';

// Comuditas Imports
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

const LOCAL_ASSETS: Record<string, string> = {
    // Forex
    'AUDUSD': audusd, 'EURUSD': eurusd, 'GBPUSD': gbpusd, 'NZDUSD': nzdusd,
    'USDCAD': usacad, 'USDCHF': usdchf, 'USDJPY': usdjpy, 'USDMXN': usdmxn,
    // Comuditas
    'XAU': xau, 'XAG': xag, 'CL': cl, 'HG': hg, 'XPD': xpd, 'XPT': xpt,
    // Stocks
    'AAPL': aapl, 'AMD': amd, 'AMZN': amzn, 'BMNR': bmnr, 'COST': cost,
    'CRCL': crcl, 'CVX': cvx, 'GLXY': glxy, 'GOOG': goog, 'HOOD': hood,
    'META': meta, 'MSFT': msft, 'MSTR': mstr, 'NFLX': nflx, 'NVDA': nvda,
    'ORCL': orcl, 'PLTR': pltr, 'RIVN': rivn, 'XOM': xom, 'COIN': coin,
    'TSLA': tsla, 'SBET': sbet,
    // Indices
    'DAX': dax, 'DJI': dji, 'FTSE': ftse, 'HSI': hsi, 'NDX': ndx, 'NIK': nik, 'SPX': spx,
    // Support symbols with full ticker name too
    'DAXEUR': dax, 'DJIUSD': dji, 'FTSEGBP': ftse, 'HSIHKD': hsi, 'NDXUSD': ndx, 'NIKJPY': nik, 'SPXUSD': spx
};

interface OstiumIconProps {
    symbol: string;
    size?: number;
    className?: string;
}

const OstiumIcon: React.FC<OstiumIconProps> = ({ symbol, size = 24, className }) => {
    const parts = symbol.split('-');
    const base = parts[0].toUpperCase();
    const fullTicker = symbol.replace('-', '').toUpperCase();

    const getSources = (): string[] => {
        const list: string[] = [];
        if (LOCAL_ASSETS[fullTicker]) list.push(LOCAL_ASSETS[fullTicker]);
        else if (LOCAL_ASSETS[base]) list.push(LOCAL_ASSETS[base]);

        const baseLower = base.toLowerCase();
        list.push(`https://raw.githubusercontent.com/Lissy93/currency-flags/master/assets/flags_png_circle/${baseLower}.png`);
        list.push(`https://wise.com/public-resources/assets/flags/rectangle/${baseLower}.png`);
        list.push(`https://api.dicebear.com/7.x/initials/svg?seed=${base}&backgroundColor=3A2530&fontSize=45`);
        return list;
    };

    const initialSources = getSources();
    const [attempt, setAttempt] = useState(0);
    const [src, setSrc] = useState(initialSources[0]);

    const isGold = base === 'XAU' || base === 'GOLD';
    const isSilver = base === 'XAG' || base === 'SILVER';
    const isOil = base === 'BRENT' || base === 'OIL' || base === 'WTI' || base === 'CL';

    useEffect(() => {
        const freshSources = getSources();
        setSrc(freshSources[0]);
        setAttempt(0);
    }, [symbol]);

    const handleError = () => {
        if (attempt + 1 < initialSources.length) {
            setSrc(initialSources[attempt + 1]);
            setAttempt(prev => prev + 1);
        }
    };

    if (attempt >= 2 && (isGold || isSilver || isOil)) {
        let gradient = 'linear-gradient(135deg, #FFD700, #B8860B)';
        if (isSilver) gradient = 'linear-gradient(135deg, #C0C0C0, #808080)';
        if (isOil) gradient = 'linear-gradient(135deg, #333, #000)';
        return (
            <div className={className} style={{ width: size, height: size, borderRadius: '50%', background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.4, fontWeight: 'bold', color: isOil ? '#fff' : '#000', border: '1px solid rgba(255,255,255,0.1)' }}>
                {base.charAt(0)}
            </div>
        );
    }

    return (
        <img src={src} alt={symbol} width={size} height={size} className={className} onError={handleError} style={{ borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.05)' }} />
    );
};

export default OstiumIcon;
