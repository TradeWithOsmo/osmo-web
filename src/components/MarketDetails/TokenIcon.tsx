import React, { useEffect } from 'react';
import { useIconStore } from '../../store/useIconStore';

interface TokenIconProps {
    symbol: string;
    size?: number;
    className?: string;
}

// ── Shared circle wrapper ─────────────────────────────────────────────────────
const iconCircle: React.CSSProperties = {
    borderRadius: '50%',
    overflow: 'hidden',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.06)',
};

// ── Consistent color per symbol ───────────────────────────────────────────────
const symbolColor = (sym: string): string => {
    const colors = ['#7B5EA7', '#4A90D9', '#E07B54', '#5CB85C', '#D9534F', '#F0AD4E', '#5BC0DE', '#9B59B6'];
    let hash = 0;
    for (let i = 0; i < sym.length; i++) hash = sym.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
};

// ─────────────────────────────────────────────────────────────────────────────

const TokenIcon: React.FC<TokenIconProps> = ({ symbol, size = 24, className }) => {
    const { getIcon, requestIcons } = useIconStore();
    const baseSymbol = symbol.split('-')[0].toUpperCase();

    useEffect(() => {
        requestIcons([baseSymbol]);
    }, [baseSymbol]);

    const icon = getIcon(baseSymbol);
    const abbr = baseSymbol.slice(0, 3);
    const fontSize = size <= 20 ? size * 0.42 : size * 0.36;

    if (icon?.url) {
        return (
            <div className={className} style={{ ...iconCircle, width: size, height: size }}>
                <img src={icon.url} alt={baseSymbol} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
        );
    }

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
};

export default TokenIcon;
