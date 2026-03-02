import React, { useState, useRef, useEffect, useMemo } from 'react';
import styles from './Footer.module.css';
import { useMarketStore } from '../../store/useMarketStore';
import { targetChain } from '../../wagmiConfig';

import GlobalChat from './GlobalChat';

import connectedIcon from '../../assets/Footer/Conected.png';
import notStableIcon from '../../assets/Footer/not stable.png';
import notConnectedIcon from '../../assets/Footer/not conected.png';
import discordIcon from '../../assets/Footer/DiscordLogo.png';
import telegramIcon from '../../assets/Footer/TelegramLogo.png';
import xIcon from '../../assets/Footer/XLogo.png';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

type ServiceStatus = 'connected' | 'connecting' | 'disconnected';

interface HealthData {
    hyperliquid?: { connected: boolean };
    ostium?: { connected: boolean };
    database?: { connected: boolean };
    redis?: { connected?: boolean; status?: string };
}

interface PriceCount {
    success: number;
    failed: number;
    lastPrice: number | undefined;
}

const ALL_CONNECTORS = [
    { id: 'hyperliquid', label: 'Hyperliquid' },
    { id: 'ostium',      label: 'Ostium' },
    { id: 'avantis',    label: 'Avantis' },
    { id: 'aster',      label: 'Aster' },
    { id: 'lighter',    label: 'Lighter' },
    { id: 'vest',       label: 'Vest' },
    { id: 'aevo',       label: 'Aevo' },
    { id: 'dydx',       label: 'dYdX' },
    { id: 'paradex',    label: 'Paradex' },
    { id: 'orderly',    label: 'Orderly' },
];

const MARKET_EXCHANGES = [
    { id: 'hyperliquid', label: 'Hyperliquid', hasOrderbook: true,  hasTrades: true  },
    { id: 'vest',        label: 'Vest',        hasOrderbook: true,  hasTrades: true  },
    { id: 'aster',       label: 'Aster',       hasOrderbook: true,  hasTrades: true  },
    { id: 'avantis',     label: 'Avantis',     hasOrderbook: false, hasTrades: true  },
    { id: 'ostium',      label: 'Ostium',      hasOrderbook: false, hasTrades: false },
    { id: 'orderly',     label: 'Orderly',     hasOrderbook: true,  hasTrades: true  },
    { id: 'paradex',     label: 'Paradex',     hasOrderbook: true,  hasTrades: true  },
    { id: 'aevo',        label: 'Aevo',        hasOrderbook: true,  hasTrades: true  },
    { id: 'dydx',        label: 'dYdX',        hasOrderbook: true,  hasTrades: true  },
];

const BAR_COUNT = 10;

const StatusBars: React.FC<{ status: ServiceStatus }> = ({ status }) => {
    const filledCount = status === 'connected' ? BAR_COUNT : status === 'connecting' ? 5 : 2;
    const color    = status === 'connected' ? '#4CAF50' : status === 'connecting' ? '#FFC107' : '#F44336';
    const dimColor = status === 'connected'  ? 'rgba(76,175,80,0.12)'
                   : status === 'connecting' ? 'rgba(255,193,7,0.12)'
                   : 'rgba(244,67,54,0.12)';
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '14px' }}>
            {Array.from({ length: BAR_COUNT }, (_, i) => (
                <div key={i} style={{ width: '3px', height: '100%', borderRadius: '1px', backgroundColor: i < filledCount ? color : dimColor }} />
            ))}
        </div>
    );
};

const statusLabel = (s: ServiceStatus) =>
    s === 'connected' ? 'Connected' : s === 'connecting' ? 'Connecting...' : 'Disconnected';
const statusColor = (s: ServiceStatus) =>
    s === 'connected' ? '#4CAF50' : s === 'connecting' ? '#FFC107' : '#F44336';
const boolToStatus = (v: boolean | undefined, loading: boolean): ServiceStatus =>
    loading ? 'connecting' : v ? 'connected' : 'disconnected';
const backendStatus = (backendUp: boolean, loading: boolean): ServiceStatus =>
    loading ? 'connecting' : backendUp ? 'connected' : 'disconnected';
const rateToStatus = (success: number, total: number): ServiceStatus => {
    if (total < 2) return 'connecting';
    const rate = success / total;
    if (rate >= 0.12) return 'connected';
    if (rate >= 0.03) return 'connecting';
    return 'disconnected';
};

const ServiceRow: React.FC<{ label: string; status: ServiceStatus; indentPx?: number }> = ({ label, status, indentPx }) => (
    <div className={styles.dropdownRow} style={indentPx !== undefined ? { paddingLeft: indentPx } : undefined}>
        <div className={styles.dropdownRowLeft}>
            <span className={styles.dropdownDot} style={{ backgroundColor: statusColor(status) }} />
            <span className={styles.dropdownLabel}>{label}</span>
            <span className={styles.dropdownValue} style={{ color: statusColor(status) }}>
                {statusLabel(status)}
            </span>
        </div>
        <StatusBars status={status} />
    </div>
);

// Symbol row for Market sub-sections: price-change-based status + count
const MktSymbolRow: React.FC<{ label: string; status: ServiceStatus; success: number; failed: number }> = ({ label, status, success, failed }) => (
    <div className={styles.dropdownRow} style={{ paddingLeft: 52 }}>
        <div className={styles.dropdownRowLeft}>
            <span className={styles.dropdownDot} style={{ backgroundColor: statusColor(status) }} />
            <span className={styles.dropdownLabel}>{label}</span>
            <span style={{ fontSize: '10px', color: '#6B4A5A', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                {`${success}/${failed}`}
            </span>
        </div>
        <StatusBars status={status} />
    </div>
);

const SectionHeader: React.FC<{
    label: string;
    count: number;
    total: number;
    expanded: boolean;
    overallStatus: ServiceStatus;
    loading: boolean;
    onClick: () => void;
}> = ({ label, count, total, expanded, overallStatus, loading, onClick }) => (
    <button className={styles.connectorHeader} onClick={onClick}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
                style={{ transition: 'transform 0.2s', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', flexShrink: 0, color: '#A77590' }}>
                <path d="M3 1.5L7 5L3 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: '12px', color: '#FFE1F2', fontWeight: 600 }}>{label}</span>
            <span style={{ fontSize: '11px', color: '#A77590' }}>{loading ? '...' : `${count}/${total}`}</span>
        </div>
        <StatusBars status={overallStatus} />
    </button>
);

const SubSectionHeader: React.FC<{ label: string; expanded: boolean; status: ServiceStatus; onClick: () => void }> = ({ label, expanded, status, onClick }) => (
    <button
        onClick={onClick}
        style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            width: '100%', padding: '7px 14px 7px 22px',
            background: 'rgba(58,37,48,0.15)', border: 'none', cursor: 'pointer', color: 'inherit',
        }}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="8" height="8" viewBox="0 0 10 10" fill="none"
                style={{ transition: 'transform 0.2s', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', flexShrink: 0, color: '#A77590' }}>
                <path d="M3 1.5L7 5L3 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: '11px', color: '#C4A0B4', fontWeight: 600 }}>{label}</span>
        </div>
        <StatusBars status={status} />
    </button>
);

// Collapsible exchange row inside a sub-section
const ExchangeRow: React.FC<{ label: string; status: ServiceStatus; expanded: boolean; onClick: () => void }> = ({ label, status, expanded, onClick }) => (
    <button
        onClick={onClick}
        style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            width: '100%', padding: '6px 14px 6px 32px',
            background: 'none', border: 'none', cursor: 'pointer', color: 'inherit',
        }}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="7" height="7" viewBox="0 0 10 10" fill="none"
                style={{ transition: 'transform 0.15s', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', flexShrink: 0, color: '#A77590' }}>
                <path d="M3 1.5L7 5L3 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: '11px', color: '#C4A0B4', fontWeight: 500 }}>{label}</span>
        </div>
        <StatusBars status={status} />
    </button>
);

const Footer: React.FC = () => {
    const { wsStatus, allMarkets } = useMarketStore();

    const [dropdownOpen,  setDropdownOpen]  = useState(false);
    const [connectorsExp, setConnectorsExp] = useState(false);
    const [agentExp,      setAgentExp]      = useState(false);
    const [toolsExp,      setToolsExp]      = useState(false);
    const [marketExp,     setMarketExp]     = useState(false);
    const [obExp,         setObExp]         = useState(false);
    const [tradesExp,     setTradesExp]     = useState(false);
    const [priceExp,      setPriceExp]      = useState(false);
    const [tvMktExp,      setTvMktExp]      = useState(false);
    const [lbExp,         setLbExp]         = useState(false);
    const [arenaExp,      setArenaExp]      = useState(false);
    const [onchainExp,    setOnchainExp]    = useState(false);

    // Per-exchange expand state for each sub-section
    const [obExMap,    setObExMap]    = useState<Record<string, boolean>>({});
    const [trExMap,    setTrExMap]    = useState<Record<string, boolean>>({});
    const [prExMap,    setPrExMap]    = useState<Record<string, boolean>>({});
    const [tvExMap,    setTvExMap]    = useState<Record<string, boolean>>({});

    const [health,           setHealth]           = useState<HealthData | null>(null);
    const [healthLoading,    setHealthLoading]    = useState(true);
    const [memoryConnected,  setMemoryConnected]  = useState<boolean | null>(null);
    const [tvConsumerOnline, setTvConsumerOnline] = useState<boolean | null>(null);
    const [onchainConnected, setOnchainConnected] = useState<boolean | null>(null);

    const priceCountsRef = useRef<Record<string, PriceCount>>({});
    const [priceCounts,  setPriceCounts]  = useState<Record<string, { success: number; failed: number }>>({});

    const containerRef = useRef<HTMLDivElement>(null);

    const marketsBySource = useMemo(() => {
        const map: Record<string, string[]> = {};
        allMarkets.forEach(m => {
            const src = (m.source || '').toLowerCase();
            if (!map[src]) map[src] = [];
            map[src].push(m.symbol);
        });
        return map;
    }, [allMarkets]);

    // Track price changes
    useEffect(() => {
        allMarkets.forEach(m => {
            const key = `${(m.source || '').toLowerCase()}:${m.symbol}`;
            const prev = priceCountsRef.current[key];
            if (!prev) {
                priceCountsRef.current[key] = { success: 0, failed: 0, lastPrice: m.price };
                return;
            }
            if (m.price !== undefined && m.price !== prev.lastPrice) {
                prev.success++;
            } else {
                prev.failed++;
            }
            prev.lastPrice = m.price;
        });
    }, [allMarkets]);

    // Sync counts to state every 2 s
    useEffect(() => {
        const interval = setInterval(() => {
            const next: Record<string, { success: number; failed: number }> = {};
            Object.entries(priceCountsRef.current).forEach(([k, v]) => {
                next[k] = { success: v.success, failed: v.failed };
            });
            setPriceCounts(next);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        let mounted = true;
        const fetchAll = async () => {
            const results = await Promise.allSettled([
                fetch(`${API_URL}/health`,                                         { signal: AbortSignal.timeout(5000) }),
                fetch(`${API_URL}/api/connectors/memory/status`,                   { signal: AbortSignal.timeout(5000) }),
                fetch(`${API_URL}/api/connectors/tradingview/consumer-status`,     { signal: AbortSignal.timeout(5000) }),
                fetch(`${API_URL}/api/v1/faucet/balance`,                          { signal: AbortSignal.timeout(5000) }),
            ]);
            if (!mounted) return;
            const [healthRes, memRes, tvRes, onchainRes] = results;
            if (healthRes.status === 'fulfilled' && healthRes.value.ok)
                setHealth(await healthRes.value.json());
            if (memRes.status === 'fulfilled' && memRes.value.ok) {
                const d = await memRes.value.json();
                setMemoryConnected(d?.connected === true);
            } else setMemoryConnected(false);
            if (tvRes.status === 'fulfilled' && tvRes.value.ok) {
                const d = await tvRes.value.json();
                setTvConsumerOnline(d?.consumer_online === true);
            } else setTvConsumerOnline(false);
            setOnchainConnected(onchainRes.status === 'fulfilled' && onchainRes.value.ok);
            setHealthLoading(false);
        };
        fetchAll();
        const t = setInterval(fetchAll, 30_000);
        return () => { mounted = false; clearInterval(t); };
    }, []);

    useEffect(() => {
        if (!dropdownOpen) return;
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node))
                setDropdownOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [dropdownOpen]);

    const getStatusConfig = () => {
        switch (wsStatus) {
            case 'connected':  return { text: 'Operational',   icon: connectedIcon,    colorClass: styles.textConnected };
            case 'connecting': return { text: 'Connecting...',  icon: notStableIcon,    colorClass: styles.textConnecting };
            default:           return { text: 'System Outage', icon: notConnectedIcon, colorClass: styles.textDisconnected };
        }
    };
    const statusConfig = getStatusConfig();

    const backendUp   = !healthLoading && wsStatus === 'connected';
    const dbStatus    = boolToStatus(health?.database?.connected, healthLoading);
    const redisConn   = health?.redis?.connected ?? (health?.redis?.status === 'connected');
    const redisStatus = boolToStatus(redisConn, healthLoading);

    const connectorStatus = (id: string): ServiceStatus => {
        if (healthLoading) return 'connecting';
        if (id === 'hyperliquid') return boolToStatus(health?.hyperliquid?.connected, healthLoading);
        if (id === 'ostium')      return boolToStatus(health?.ostium?.connected, healthLoading);
        return backendUp ? 'connected' : 'disconnected';
    };
    const connectedCount = ALL_CONNECTORS.filter(c => connectorStatus(c.id) === 'connected').length;

    const agentServices = [
        { label: 'Memory (mem0)',  status: boolToStatus(memoryConnected ?? undefined, healthLoading) },
        { label: 'OpenRouter',     status: backendStatus(backendUp, healthLoading) },
        { label: 'Sessions',       status: backendStatus(backendUp, healthLoading) },
    ];
    const agentConnected = agentServices.filter(s => s.status === 'connected').length;

    const toolsServices = [
        { label: 'TradingView',     status: boolToStatus(tvConsumerOnline ?? undefined, healthLoading) },
        { label: 'Trade Execution', status: backendStatus(backendUp, healthLoading) },
        { label: 'Research',        status: backendStatus(backendUp, healthLoading) },
        { label: 'Web Search',      status: backendStatus(backendUp, healthLoading) },
    ];
    const toolsConnected = toolsServices.filter(s => s.status === 'connected').length;

    const lbServices = [
        { label: 'Traders', status: backendStatus(backendUp, healthLoading) },
        { label: 'Agents',  status: backendStatus(backendUp, healthLoading) },
    ];
    const lbConnected = lbServices.filter(s => s.status === 'connected').length;

    const arenaServices = [
        { label: 'Overall',    status: backendStatus(backendUp, healthLoading) },
        { label: 'Human Side', status: backendStatus(backendUp, healthLoading) },
        { label: 'AI Side',    status: backendStatus(backendUp, healthLoading) },
    ];
    const arenaConnected = arenaServices.filter(s => s.status === 'connected').length;

    const onchainServices = [
        { label: targetChain.name, status: boolToStatus(onchainConnected ?? undefined, healthLoading) },
        { label: 'Vault',          status: boolToStatus(onchainConnected ?? undefined, healthLoading) },
        { label: 'Faucet',         status: boolToStatus(onchainConnected ?? undefined, healthLoading) },
    ];
    const onchainConnectedCount = onchainServices.filter(s => s.status === 'connected').length;

    const mktStatus: ServiceStatus = backendUp ? 'connected' : healthLoading ? 'connecting' : 'disconnected';

    const getSymbolPriceData = (exId: string, sym: string) => {
        const key = `${exId}:${sym}`;
        const counts = priceCounts[key];
        if (!counts) return { status: 'connecting' as ServiceStatus, success: 0, failed: 0 };
        const total = counts.success + counts.failed;
        return { status: rateToStatus(counts.success, total), success: counts.success, failed: counts.failed };
    };

    const getExchangePriceStatus = (exId: string): ServiceStatus => {
        const syms = marketsBySource[exId] || [];
        if (syms.length === 0) return mktStatus;
        let totalSuccess = 0, totalAll = 0;
        syms.forEach(sym => {
            const key = `${exId}:${sym}`;
            const c = priceCounts[key];
            if (c) { totalSuccess += c.success; totalAll += c.success + c.failed; }
        });
        return rateToStatus(totalSuccess, totalAll);
    };

    // Renders symbol list for an expanded exchange
    const SymbolList = ({ exId, getStatus }: {
        exId: string;
        getStatus: (exId: string, sym: string) => { status: ServiceStatus; success: number; failed: number };
    }) => {
        const syms = marketsBySource[exId] || [];
        if (syms.length === 0) {
            return <div style={{ padding: '3px 14px 5px 52px', fontSize: '10px', color: '#6B4A5A' }}>No data yet</div>;
        }
        return (
            <>
                {syms.map((sym, i) => {
                    const { status, success, failed } = getStatus(exId, sym);
                    return (
                        <React.Fragment key={sym}>
                            {i > 0 && <div className={styles.dropdownDivider} />}
                            <MktSymbolRow label={sym.split('-')[0]} status={status} success={success} failed={failed} />
                        </React.Fragment>
                    );
                })}
            </>
        );
    };

    // Renders a full sub-section (list of collapsible exchanges)
    const SubSectionExchanges = ({ exchanges, exMap, setExMap, getExStatus, getSymStatus, noCapLabel }: {
        exchanges: typeof MARKET_EXCHANGES;
        exMap: Record<string, boolean>;
        setExMap: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
        getExStatus: (ex: typeof MARKET_EXCHANGES[number]) => ServiceStatus;
        getSymStatus: (exId: string, sym: string) => { status: ServiceStatus; success: number; failed: number };
        noCapLabel?: string; // shown when exchange doesn't support this feature
    }) => (
        <>
            {exchanges.map(ex => {
                const exStatus = getExStatus(ex);
                const isExpanded = exMap[ex.id] || false;
                return (
                    <React.Fragment key={ex.id}>
                        <div className={styles.dropdownDivider} />
                        <ExchangeRow
                            label={ex.label}
                            status={exStatus}
                            expanded={isExpanded}
                            onClick={() => setExMap(prev => ({ ...prev, [ex.id]: !prev[ex.id] }))}
                        />
                        {isExpanded && (
                            noCapLabel && exStatus === 'disconnected' && !marketsBySource[ex.id]?.length
                                ? <div style={{ padding: '3px 14px 5px 52px', fontSize: '10px', color: '#6B4A5A' }}>{noCapLabel}</div>
                                : <SymbolList exId={ex.id} getStatus={getSymStatus} />
                        )}
                    </React.Fragment>
                );
            })}
        </>
    );

    const tvStatus = boolToStatus(tvConsumerOnline ?? undefined, healthLoading);

    return (
        <footer className={styles.footer}>
            <div className={styles.leftSection}>
                <div ref={containerRef} style={{ position: 'relative', display: 'flex', alignItems: 'stretch' }}>
                    <button
                        className={styles.statusButton}
                        onClick={() => setDropdownOpen(v => !v)}
                        aria-expanded={dropdownOpen}
                    >
                        <span className={`${styles.dot} ${statusConfig.colorClass}`} />
                        <span className={`${styles.statusText} ${statusConfig.colorClass}`}>{statusConfig.text}</span>
                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none"
                            style={{ marginLeft: '2px', transition: 'transform 0.2s', transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0, color: '#A77590' }}>
                            <path d="M1 5L5 1L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>

                    <div className={`${styles.statusDropdown} ${dropdownOpen ? styles.statusDropdownOpen : ''}`}>
                        <div className={styles.dropdownTopBar}>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#FFE1F2' }}>System Status</span>
                        </div>

                        <ServiceRow label="WebSocket" status={wsStatus} />
                        <div className={styles.dropdownDivider} />

                        {/* Agent */}
                        <SectionHeader
                            label="Agent" count={agentConnected} total={agentServices.length}
                            expanded={agentExp} overallStatus={backendStatus(backendUp, healthLoading)} loading={healthLoading}
                            onClick={() => setAgentExp(v => !v)}
                        />
                        {agentExp && agentServices.map((s, i) => (
                            <React.Fragment key={s.label}>
                                {i > 0 && <div className={styles.dropdownDivider} />}
                                <ServiceRow label={s.label} status={s.status} indentPx={28} />
                            </React.Fragment>
                        ))}
                        <div className={styles.dropdownDivider} />

                        {/* Tools */}
                        <SectionHeader
                            label="Tools" count={toolsConnected} total={toolsServices.length}
                            expanded={toolsExp} overallStatus={backendStatus(backendUp, healthLoading)} loading={healthLoading}
                            onClick={() => setToolsExp(v => !v)}
                        />
                        {toolsExp && toolsServices.map((s, i) => (
                            <React.Fragment key={s.label}>
                                {i > 0 && <div className={styles.dropdownDivider} />}
                                <ServiceRow label={s.label} status={s.status} indentPx={28} />
                            </React.Fragment>
                        ))}
                        <div className={styles.dropdownDivider} />

                        {/* Connectors */}
                        <SectionHeader
                            label="Connectors" count={connectedCount} total={ALL_CONNECTORS.length}
                            expanded={connectorsExp} loading={healthLoading}
                            overallStatus={connectedCount === ALL_CONNECTORS.length ? 'connected' : connectedCount > 0 ? 'connecting' : 'disconnected'}
                            onClick={() => setConnectorsExp(v => !v)}
                        />
                        {connectorsExp && ALL_CONNECTORS.map((c, i) => (
                            <React.Fragment key={c.id}>
                                {i > 0 && <div className={styles.dropdownDivider} />}
                                <ServiceRow label={c.label} status={connectorStatus(c.id)} indentPx={28} />
                            </React.Fragment>
                        ))}
                        <div className={styles.dropdownDivider} />

                        {/* Leaderboard */}
                        <SectionHeader
                            label="Leaderboard" count={lbConnected} total={lbServices.length}
                            expanded={lbExp} overallStatus={backendStatus(backendUp, healthLoading)} loading={healthLoading}
                            onClick={() => setLbExp(v => !v)}
                        />
                        {lbExp && lbServices.map((s, i) => (
                            <React.Fragment key={s.label}>
                                {i > 0 && <div className={styles.dropdownDivider} />}
                                <ServiceRow label={s.label} status={s.status} indentPx={28} />
                            </React.Fragment>
                        ))}
                        <div className={styles.dropdownDivider} />

                        {/* Portfolio */}
                        <ServiceRow label="Portfolio" status={backendStatus(backendUp, healthLoading)} />
                        <div className={styles.dropdownDivider} />

                        {/* Arena */}
                        <SectionHeader
                            label="Arena" count={arenaConnected} total={arenaServices.length}
                            expanded={arenaExp} overallStatus={backendStatus(backendUp, healthLoading)} loading={healthLoading}
                            onClick={() => setArenaExp(v => !v)}
                        />
                        {arenaExp && arenaServices.map((s, i) => (
                            <React.Fragment key={s.label}>
                                {i > 0 && <div className={styles.dropdownDivider} />}
                                <ServiceRow label={s.label} status={s.status} indentPx={28} />
                            </React.Fragment>
                        ))}
                        <div className={styles.dropdownDivider} />

                        {/* Referrals */}
                        <ServiceRow label="Referrals" status={backendStatus(backendUp, healthLoading)} />
                        <div className={styles.dropdownDivider} />

                        {/* Onchain */}
                        <SectionHeader
                            label="Onchain" count={onchainConnectedCount} total={onchainServices.length}
                            expanded={onchainExp} loading={healthLoading}
                            overallStatus={boolToStatus(onchainConnected ?? undefined, healthLoading)}
                            onClick={() => setOnchainExp(v => !v)}
                        />
                        {onchainExp && onchainServices.map((s, i) => (
                            <React.Fragment key={s.label}>
                                {i > 0 && <div className={styles.dropdownDivider} />}
                                <ServiceRow label={s.label} status={s.status} indentPx={28} />
                            </React.Fragment>
                        ))}
                        <div className={styles.dropdownDivider} />

                        {/* Market (was Tradebook) */}
                        <button className={styles.connectorHeader} onClick={() => setMarketExp(v => !v)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
                                    style={{ transition: 'transform 0.2s', transform: marketExp ? 'rotate(90deg)' : 'rotate(0deg)', flexShrink: 0, color: '#A77590' }}>
                                    <path d="M3 1.5L7 5L3 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span style={{ fontSize: '12px', color: '#FFE1F2', fontWeight: 600 }}>Market</span>
                            </div>
                            <StatusBars status={mktStatus} />
                        </button>

                        {marketExp && (
                            <>
                                {/* 1. Orderbook */}
                                <SubSectionHeader label="Orderbook" expanded={obExp} status={mktStatus} onClick={() => setObExp(v => !v)} />
                                {obExp && (
                                    <SubSectionExchanges
                                        exchanges={MARKET_EXCHANGES}
                                        exMap={obExMap}
                                        setExMap={setObExMap}
                                        getExStatus={ex => !ex.hasOrderbook ? 'disconnected' : getExchangePriceStatus(ex.id)}
                                        getSymStatus={getSymbolPriceData}
                                        noCapLabel="Not supported"
                                    />
                                )}
                                <div className={styles.dropdownDivider} />

                                {/* 2. Trades */}
                                <SubSectionHeader label="Trades" expanded={tradesExp} status={mktStatus} onClick={() => setTradesExp(v => !v)} />
                                {tradesExp && (
                                    <SubSectionExchanges
                                        exchanges={MARKET_EXCHANGES}
                                        exMap={trExMap}
                                        setExMap={setTrExMap}
                                        getExStatus={ex => !ex.hasTrades ? 'disconnected' : getExchangePriceStatus(ex.id)}
                                        getSymStatus={getSymbolPriceData}
                                        noCapLabel="Not supported"
                                    />
                                )}
                                <div className={styles.dropdownDivider} />

                                {/* 3. Price */}
                                <SubSectionHeader label="Price" expanded={priceExp} status={wsStatus} onClick={() => setPriceExp(v => !v)} />
                                {priceExp && (
                                    <SubSectionExchanges
                                        exchanges={MARKET_EXCHANGES}
                                        exMap={prExMap}
                                        setExMap={setPrExMap}
                                        getExStatus={ex => getExchangePriceStatus(ex.id)}
                                        getSymStatus={getSymbolPriceData}
                                    />
                                )}
                                <div className={styles.dropdownDivider} />

                                {/* 4. TradingView */}
                                <SubSectionHeader label="TradingView" expanded={tvMktExp} status={tvStatus} onClick={() => setTvMktExp(v => !v)} />
                                {tvMktExp && (
                                    <SubSectionExchanges
                                        exchanges={MARKET_EXCHANGES}
                                        exMap={tvExMap}
                                        setExMap={setTvExMap}
                                        getExStatus={() => tvStatus}
                                        getSymStatus={(_exId, _sym) => ({ status: tvStatus, success: 0, failed: 0 })}
                                    />
                                )}
                            </>
                        )}
                        <div className={styles.dropdownDivider} />

                        {/* Database & Redis */}
                        <ServiceRow label="Database" status={dbStatus} />
                        <div className={styles.dropdownDivider} />
                        <ServiceRow label="Redis" status={redisStatus} />
                    </div>
                </div>

                <div className={styles.divider} />
                <a href="#" className={styles.link}>Help &amp; Support</a>
                <div className={styles.divider} />
                <GlobalChat />
                <div className={styles.divider} />
                <span className={styles.infoText}>
                    This site is operated by Osmo Ops subDAO, utilizing software open sourced by Osmo Trading Inc.{' '}
                    <a href="#" className={styles.learnMore}>Learn more</a>
                </span>
            </div>

            <div className={styles.rightSection}>
                <div className={styles.divider} />
                <a href="#" className={styles.socialLink} aria-label="Discord"><img src={discordIcon} alt="Discord" /></a>
                <div className={styles.divider} />
                <a href="#" className={styles.socialLink} aria-label="Telegram"><img src={telegramIcon} alt="Telegram" /></a>
                <div className={styles.divider} />
                <a href="#" className={styles.socialLink} aria-label="X (Twitter)"><img src={xIcon} alt="X (Twitter)" /></a>
            </div>
        </footer>
    );
};

export default Footer;
