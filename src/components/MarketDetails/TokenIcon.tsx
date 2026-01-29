import React, { useState, useEffect } from 'react';
import { useTokenListStore } from '../../store/useTokenListStore';

interface TokenIconProps {
    symbol: string;
    size?: number;
    className?: string;
}

const TokenIcon: React.FC<TokenIconProps> = ({ symbol, size = 24, className }) => {
    const { tokenMap } = useTokenListStore();
    const baseSymbol = symbol.split('-')[0].toUpperCase();

    // Define all fallback sources in order of preference
    const getSources = (sym: string): string[] => {
        const list: string[] = [];

        // 0. Hardcoded High-Quality Standard Overrides
        if (sym === 'BTC') list.push('https://assets.coincap.io/assets/icons/btc@2x.png');
        if (sym === 'ETH') list.push('https://assets.coincap.io/assets/icons/eth@2x.png');

        // 1. Verified Token List (logoURI)
        if (tokenMap[sym]) list.push(tokenMap[sym]);

        // 2. Mainstream CDNs
        list.push(`https://assets.coincap.io/assets/icons/${sym.toLowerCase()}@2x.png`);
        list.push(`https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/${sym.toLowerCase()}.png`);

        // 3. Generative / Identicon Sources (User suggested)
        list.push(`https://robohash.org/${sym}.png`);
        list.push(`https://robohash.org/${sym}?set=set2`);
        list.push(`https://robohash.org/${sym}?set=set3`);
        list.push(`https://api.dicebear.com/7.x/shapes/svg?seed=${sym}`);
        list.push(`https://api.dicebear.com/7.x/identicon/svg?seed=${sym}`);
        list.push(`https://api.dicebear.com/7.x/pixel-art/svg?seed=${sym}`);
        list.push(`https://source.boringavatars.com/beam/120/${sym}`);
        list.push(`https://source.boringavatars.com/marble/120/${sym}`);
        list.push(`https://api.multiavatar.com/${sym}.svg`);
        list.push(`https://identicon-api.herokuapp.com/${sym}/128?format=png`);

        // 4. Final Fallback (Text-based)
        list.push(`https://ui-avatars.com/api/?name=${sym}&background=2C2C2C&color=FFE1F2&rounded=true&bold=true&format=svg`);

        return list;
    };

    const currentSources = getSources(baseSymbol);
    const [attempt, setAttempt] = useState(0);
    const [src, setSrc] = useState(currentSources[0]);

    // Reset when symbol changes
    useEffect(() => {
        const freshSources = getSources(baseSymbol);
        setSrc(freshSources[0]);
        setAttempt(0);
    }, [baseSymbol, tokenMap]);

    const handleError = () => {
        const sourcesList = getSources(baseSymbol);
        if (attempt + 1 < sourcesList.length) {
            setSrc(sourcesList[attempt + 1]);
            setAttempt(prev => prev + 1);
        }
    };

    return (
        <img
            src={src}
            alt={baseSymbol}
            width={size}
            height={size}
            className={className}
            onError={handleError}
            style={{ borderRadius: '50%', objectFit: 'cover' }}
        />
    );
};

export default TokenIcon;
