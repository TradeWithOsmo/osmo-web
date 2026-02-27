import React, { useState } from 'react';
import styles from './OrderForm.module.css';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import { useMarketStore } from '../../store/useMarketStore';
import { useWallet } from '../../hooks';
import { useUIStore } from '../../store/useUIStore';
import { onchainService } from '../../api/onchainService';
import { orderService } from '../../api/orderService';
import { tradingViewCommandService } from '../../api/tradingViewCommandService';
import toast from 'react-hot-toast';

const parsePositiveNumber = (raw: string): number | null => {
    const parsed = parseFloat(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return parsed;
};

const formatInputPrice = (value: number): string => {
    if (!Number.isFinite(value) || value <= 0) return '';
    return value < 10 && value > 0.0001 ? value.toFixed(4) : value.toFixed(2);
};

const toNumber = (raw: string): number | null => {
    const val = parseFloat(String(raw || '').trim());
    if (!Number.isFinite(val) || val <= 0) return null;
    return val;
};

const computeTpslPrice = (side: 'buy' | 'sell', basisPrice: number, mode: 'tp' | 'sl', unit: '%' | '$', inputRaw: string): number | null => {
    const input = toNumber(inputRaw);
    if (!input || !Number.isFinite(basisPrice) || basisPrice <= 0) return null;
    if (unit === '%') {
        const ratio = input / 100;
        if (mode === 'tp') {
            return side === 'buy' ? basisPrice * (1 + ratio) : basisPrice * (1 - ratio);
        }
        return side === 'buy' ? basisPrice * (1 - ratio) : basisPrice * (1 + ratio);
    }
    if (mode === 'tp') {
        return side === 'buy' ? basisPrice + input : basisPrice - input;
    }
    return side === 'buy' ? basisPrice - input : basisPrice + input;
};

const OrderForm: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'Limit' | 'Market'>('Market');
    const [side, setSide] = useState<'buy' | 'sell'>('buy');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const selectedMarket = useMarketStore((state) => state.selectedMarket);
    const pendingLimitPrice = useMarketStore((state) => state.pendingLimitPrice);
    const clearPendingLimitPrice = useMarketStore((state) => state.clearPendingLimitPrice);
    const { refreshAll, summary } = usePortfolioStore();

    const { 
        openDepositModal, 
        hasSession, 
        setHasSession, 
        openSessionModal, 
        isTradingSetupOpen, 
        openTradingSetup, 
        isSessionChecking 
    } = useUIStore();

    const { authenticated, walletAddress, handleConnect, handleSwitchToTargetChain } = useWallet();

    const [tradingSetupOk, setTradingSetupOk] = useState(false);
    const checkSetup = React.useCallback(async () => {
        if (authenticated && walletAddress) {
            try {
                const status = await onchainService.checkTradingSetup(walletAddress);
                const isOk = status.roleGranted && status.allowance > 100_000_000n;
                setTradingSetupOk(isOk);
                return isOk;
            } catch {
                setTradingSetupOk(false);
                return false;
            }
        }
        return false;
    }, [authenticated, walletAddress]);

    React.useEffect(() => { checkSetup(); }, [checkSetup]);
    React.useEffect(() => { if (!isTradingSetupOpen) checkSetup(); }, [isTradingSetupOpen, checkSetup]);

    React.useEffect(() => {
        const checkSessionManual = () => {
            const expires = localStorage.getItem('osmo_session_expires');
            const key = localStorage.getItem('osmo_session_key');
            if (key && expires && new Date(expires) > new Date()) {
                setHasSession(true);
            } else {
                setHasSession(false);
            }
        };
        checkSessionManual();
        const interval = setInterval(checkSessionManual, 5000);
        return () => clearInterval(interval);
    }, [setHasSession]);

    const [price, setPrice] = useState('');
    const [marketOrderPrice, setMarketOrderPrice] = useState('');
    const [amount, setAmount] = useState('');
    const [isAmountUSD, setIsAmountUSD] = useState(true);
    const [leverage, setLeverage] = useState(20);
    const [marginMode, setMarginMode] = useState<'Cross' | 'Isolated'>('Cross');
    const [advancedOpen, setAdvancedOpen] = useState(false);
    
    // Auto-fill from Chart click
    React.useEffect(() => {
        if (pendingLimitPrice) {
            const fmt = formatInputPrice(pendingLimitPrice);
            if (activeTab === 'Limit') setPrice(fmt);
            else setMarketOrderPrice(fmt);
            clearPendingLimitPrice();
        }
    }, [pendingLimitPrice, activeTab, clearPendingLimitPrice]);

    const [reduceOnly, setReduceOnly] = useState(false);
    const [postOnly, setPostOnly] = useState(false);
    const [timeInForce, setTimeInForce] = useState('GTC');
    const [tifDropdownOpen, setTifDropdownOpen] = useState(false);

    const [tpslEnabled, setTpslEnabled] = useState(false);
    const [tpUnit, setTpUnit] = useState('%');
    const [tpValue, setTpValue] = useState('');
    const [tpPrice, setTpPrice] = useState('');
    const [tpDropdownOpen, setTpDropdownOpen] = useState(false);

    const [slUnit, setSlUnit] = useState('%');
    const [slValue, setSlValue] = useState('');
    const [slPrice, setSlPrice] = useState('');
    const [slDropdownOpen, setSlDropdownOpen] = useState(false);

    const currentMarketPrice = selectedMarket?.price || 0;
    const parsedLimitPrice = parsePositiveNumber(price);
    const parsedMarketOrderPrice = parsePositiveNumber(marketOrderPrice);
    const effectivePrice = activeTab === 'Market' ? (parsedMarketOrderPrice ?? currentMarketPrice) : (parsedLimitPrice ?? currentMarketPrice);

    const tradingExchange = String(import.meta.env.VITE_TRADING_EXCHANGE || 'auto').toLowerCase();
    const isSimulationExchange = tradingExchange === 'simulation' || selectedMarket?.source === 'simulation';

    React.useEffect(() => {
        if (selectedMarket?.maxLeverage && leverage > selectedMarket.maxLeverage) {
            setLeverage(selectedMarket.maxLeverage);
        }
    }, [selectedMarket?.symbol, selectedMarket?.maxLeverage, leverage]);

    const handleAmountSwitch = () => {
        if (!selectedMarket?.price || !amount) {
            setIsAmountUSD(!isAmountUSD);
            return;
        }
        const val = parseFloat(amount);
        const px = selectedMarket.price;
        const nextIsUSD = !isAmountUSD;
        const converted = nextIsUSD ? (val * px) : (val / px);
        setAmount(nextIsUSD ? converted.toFixed(2) : converted.toFixed(6));
        setIsAmountUSD(nextIsUSD);
    };

    const setAmountPercent = (pct: number) => {
        const buyingPower = (summary?.free_collateral || 0) * leverage;
        const targetUsd = buyingPower * (pct / 100);
        if (isAmountUSD) {
            setAmount(targetUsd.toFixed(2));
        } else if (selectedMarket?.price) {
            setAmount((targetUsd / selectedMarket.price).toFixed(6));
        }
    };

    const handleQuickPrice = (type: string) => {
        if (!currentMarketPrice) return;
        let target = currentMarketPrice;
        if (type === '1%') target = side === 'buy' ? target * 0.99 : target * 1.01;
        if (type === '5%') target = side === 'buy' ? target * 0.95 : target * 1.05;
        const fmt = formatInputPrice(target);
        if (activeTab === 'Market') setMarketOrderPrice(fmt);
        else setPrice(fmt);
    };

    const handleSubmit = async () => {
        if (!authenticated || !walletAddress) {
            handleConnect();
            return;
        }

        const parsedAmount = parseFloat(amount);
        if (!selectedMarket || isNaN(parsedAmount) || parsedAmount <= 0) {
            toast.error('Enter valid amount');
            return;
        }

        setIsSubmitting(true);
        try {
            const source = selectedMarket.source || 'auto';
            let amountUsd = isAmountUSD ? parsedAmount : parsedAmount * currentMarketPrice;
            const isExternalConnector = !['simulation', 'onchain', 'auto'].includes(source.toLowerCase());
            
            if (isExternalConnector) {
                amountUsd = amountUsd * leverage;
            }

            const resolvedTp = tpPrice ? parseFloat(tpPrice) : computeTpslPrice(side, effectivePrice, 'tp', tpUnit as any, tpValue);
            const resolvedSl = slPrice ? parseFloat(slPrice) : computeTpslPrice(side, effectivePrice, 'sl', slUnit as any, slValue);

            const params = {
                user_address: walletAddress.toLowerCase(),
                symbol: selectedMarket.symbol,
                side: side as any,
                order_type: activeTab.toLowerCase() as any,
                amount_usd: amountUsd,
                leverage,
                price: activeTab === 'Limit' ? (parsedLimitPrice || currentMarketPrice) : undefined,
                tp: resolvedTp || undefined,
                sl: resolvedSl || undefined,
                exchange: source,
                reduce_only: reduceOnly,
                post_only: postOnly,
                time_in_force: timeInForce
            };

            const result = await orderService.placeOrder(params);
            
            if (result.success) {
                toast.success(`Order placed on ${result.exchange || source}`);
                setAmount('');
                refreshAll(walletAddress);

                if (tpslEnabled && (resolvedTp || resolvedSl)) {
                    tradingViewCommandService.queueSetupTrade({
                        symbol: selectedMarket.symbol,
                        side,
                        entry: effectivePrice,
                        tp: resolvedTp ?? 0,
                        sl: resolvedSl ?? 0,
                        validation: resolvedTp ?? 0,
                        invalidation: resolvedSl ?? 0,
                        validation_note: 'Take Profit',
                        invalidation_note: 'Stop Loss'
                    }).catch(() => {});
                }
            } else {
                toast.error(result.message || 'Failed to place order');
            }
        } catch (error: any) {
            console.error('Order error:', error);
            toast.error(error.message || 'Order failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const canSubmit = authenticated && !isSessionChecking && hasSession && (isSimulationExchange || tradingSetupOk);
    const disableSubmit = isSubmitting || !amount || parseFloat(amount) <= 0;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerTitle}>
                    <span className={styles.symbolName}>{selectedMarket?.symbol || 'Trade'}</span>
                    {selectedMarket?.source && (
                        <span className={styles.sourceBadge}>{selectedMarket.source}</span>
                    )}
                </div>
                <div className={styles.accountStatus}>
                    <span className={styles.balanceLabel}>Available</span>
                    <span className={styles.balanceValue}>
                        ${summary?.free_collateral.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                    </span>
                </div>
            </div>

            <div className={styles.scrollContent}>
                <div className={styles.buySellContainer}>
                    <button 
                        className={`${styles.tradeBtn} ${side === 'buy' ? styles.active + ' ' + styles.buy : styles.inactive}`} 
                        onClick={() => setSide('buy')}
                    >
                        Long
                    </button>
                    <button 
                        className={`${styles.tradeBtn} ${side === 'sell' ? styles.active + ' ' + styles.sell : styles.inactive}`} 
                        onClick={() => setSide('sell')}
                    >
                        Short
                    </button>
                </div>

                <div className={styles.tabs}>
                    <button className={`${styles.tab} ${activeTab === 'Market' ? styles.active : ''}`} onClick={() => setActiveTab('Market')}>Market</button>
                    <button className={`${styles.tab} ${activeTab === 'Limit' ? styles.active : ''}`} onClick={() => setActiveTab('Limit')}>Limit</button>
                </div>

                <div className={styles.formArea}>
                    {activeTab === 'Market' ? (
                        <div className={styles.inputWrapper}>
                            <div className={styles.inputLabelRow}>
                                <span>Order Price</span>
                                <span>Auto: Market</span>
                            </div>
                            <div className={styles.inputRow}>
                                <input 
                                    className={styles.inputMain} 
                                    placeholder={formatInputPrice(currentMarketPrice) || '0.00'} 
                                    value={marketOrderPrice} 
                                    onChange={(e) => setMarketOrderPrice(e.target.value)}
                                    inputMode="decimal"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className={styles.inputWrapper}>
                            <div className={styles.inputLabelRow}>
                                <span>Limit Price</span>
                            </div>
                            <div className={styles.inputRow}>
                                <input 
                                    className={styles.inputMain} 
                                    placeholder="0.00" 
                                    value={price} 
                                    onChange={(e) => setPrice(e.target.value)}
                                    inputMode="decimal"
                                />
                            </div>
                            <div className={styles.pillsRow} style={{ padding: 0, marginTop: '4px' }}>
                                <div className={styles.pill} onClick={() => handleQuickPrice('Mid')}>Mid</div>
                                <div className={styles.pill} onClick={() => handleQuickPrice('1%')}>{side === 'buy' ? '1% ↓' : '1% ↑'}</div>
                                <div className={styles.pill} onClick={() => handleQuickPrice('5%')}>{side === 'buy' ? '5% ↓' : '5% ↑'}</div>
                            </div>
                        </div>
                    )}

                    <div className={styles.marketInputContainer}>
                        <div className={styles.marketInputColumn}>
                            <div className={styles.inputLabelRow}>
                                <span>Margin ({isAmountUSD ? 'USD' : (selectedMarket?.symbol?.split('-')[0] || 'Units')})</span>
                            </div>
                            <input 
                                className={styles.inputMain} 
                                placeholder="0.00" 
                                value={amount} 
                                onChange={(e) => setAmount(e.target.value)}
                                style={{ fontSize: '20px' }}
                                inputMode="decimal"
                            />
                        </div>
                        <div className={styles.swapButton} onClick={handleAmountSwitch}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 10l5 5 5-5M7 14l5-5 5 5"/></svg>
                        </div>
                    </div>

                    <div className={styles.pillsRow} style={{ padding: 0, marginTop: '-8px' }}>
                        {[25, 50, 75, 100].map(p => (
                            <div key={p} className={styles.pill} onClick={() => setAmountPercent(p)}>{p === 100 ? 'MAX' : p + '%'}</div>
                        ))}
                    </div>

                    <div className={styles.leverageContainer} style={{ margin: 0 }}>
                        <div className={styles.leverageHeader}>
                            <span>Leverage</span>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span className={styles.leverageValue}>{leverage}x</span>
                                <span className={styles.badgeNone} onClick={() => setMarginMode(marginMode === 'Cross' ? 'Isolated' : 'Cross')}>
                                    {marginMode}
                                </span>
                            </div>
                        </div>
                        <div className={styles.sliderTrack}>
                            <div className={styles.sliderFill} style={{ width: `${(leverage / (selectedMarket?.maxLeverage || 50)) * 100}%` }}></div>
                            <input 
                                type="range" 
                                min="1" 
                                max={selectedMarket?.maxLeverage || 50} 
                                step="1" 
                                value={leverage} 
                                onChange={(e) => setLeverage(Number(e.target.value))}
                                style={{ position: 'absolute', width: '100%', opacity: 0, cursor: 'pointer', zIndex: 10 }}
                            />
                        </div>
                    </div>

                    <div className={styles.advancedToggle} onClick={() => setAdvancedOpen(!advancedOpen)}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: advancedOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }}>
                            <path d="M6 9l6 6 6-6"/>
                        </svg>
                        Advanced & TP/SL
                    </div>

                    {advancedOpen && (
                        <div className={styles.advancedContent} style={{ padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <div className={styles.checkboxRow} onClick={() => setReduceOnly(!reduceOnly)}>
                                    <div className={`${styles.checkbox} ${reduceOnly ? styles.checked : ''}`}></div>
                                    <span>Reduce-Only</span>
                                </div>
                                <div className={styles.checkboxRow} onClick={() => setPostOnly(!postOnly)}>
                                    <div className={`${styles.checkbox} ${postOnly ? styles.checked : ''}`}></div>
                                    <span>Post-Only</span>
                                </div>
                                <div style={{ marginLeft: 'auto', position: 'relative' }}>
                                    <div 
                                        className={styles.badgeNone} 
                                        onClick={() => setTifDropdownOpen(!tifDropdownOpen)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        TIF: {timeInForce}
                                    </div>
                                    {tifDropdownOpen && (
                                        <div className={styles.dropdownMenu} style={{ top: 'calc(100% + 4px)', right: 0 }}>
                                            {['GTC', 'IOC', 'FOK'].map(tif => (
                                                <div 
                                                    key={tif} 
                                                    className={styles.dropdownItem} 
                                                    onClick={() => { setTimeInForce(tif); setTifDropdownOpen(false); }}
                                                >
                                                    {tif}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={styles.tpslContainer} style={{ padding: 0 }}>
                                <div className={styles.checkboxRow} onClick={() => setTpslEnabled(!tpslEnabled)}>
                                    <div className={`${styles.checkbox} ${tpslEnabled ? styles.checked : ''}`}></div>
                                    <span style={{ fontWeight: 600 }}>Enable TP/SL</span>
                                </div>

                                {tpslEnabled && (
                                    <div className={styles.tpslGrid} style={{ marginTop: '8px' }}>
                                        <div className={styles.tpslInput}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span className={styles.tpslLabel}>TP Preference</span>
                                                <div style={{ position: 'relative' }}>
                                                    <span 
                                                        style={{ fontSize: '10px', color: '#8C8EF2', cursor: 'pointer' }} 
                                                        onClick={() => setTpDropdownOpen(!tpDropdownOpen)}
                                                    >
                                                        Unit: {tpUnit}
                                                    </span>
                                                    {tpDropdownOpen && (
                                                        <div className={styles.dropdownMenu} style={{ top: '100%', right: 0 }}>
                                                            {['%', '$'].map(u => <div key={u} className={styles.dropdownItem} onClick={() => { setTpUnit(u); setTpDropdownOpen(false); }}>{u}</div>)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <input 
                                                className={styles.tpslField} 
                                                placeholder={tpUnit === '%' ? "10%" : "Price"} 
                                                value={tpValue} 
                                                onChange={(e) => setTpValue(e.target.value)}
                                            />
                                            <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                                                <span className={styles.tpslLabel}>Or Price:</span>
                                                <input 
                                                    className={styles.tpslField} 
                                                    style={{ height: '20px', fontSize: '10px' }} 
                                                    placeholder="Manual" 
                                                    value={tpPrice} 
                                                    onChange={(e) => setTpPrice(e.target.value)} 
                                                />
                                            </div>
                                        </div>
                                        <div className={styles.tpslInput}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span className={styles.tpslLabel}>SL Preference</span>
                                                <div style={{ position: 'relative' }}>
                                                    <span 
                                                        style={{ fontSize: '10px', color: '#8C8EF2', cursor: 'pointer' }} 
                                                        onClick={() => setSlDropdownOpen(!slDropdownOpen)}
                                                    >
                                                        Unit: {slUnit}
                                                    </span>
                                                    {slDropdownOpen && (
                                                        <div className={styles.dropdownMenu} style={{ top: '100%', right: 0 }}>
                                                            {['%', '$'].map(u => <div key={u} className={styles.dropdownItem} onClick={() => { setSlUnit(u); setSlDropdownOpen(false); }}>{u}</div>)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <input 
                                                className={styles.tpslField} 
                                                placeholder={slUnit === '%' ? "5%" : "Price"} 
                                                value={slValue} 
                                                onChange={(e) => setSlValue(e.target.value)}
                                            />
                                            <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                                                <span className={styles.tpslLabel}>Or Price:</span>
                                                <input 
                                                    className={styles.tpslField} 
                                                    style={{ height: '20px', fontSize: '10px' }} 
                                                    placeholder="Manual" 
                                                    value={slPrice} 
                                                    onChange={(e) => setSlPrice(e.target.value)} 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.summaryContainer}>
                <div className={styles.receiptDetails}>
                    <div className={styles.summaryRow}>
                        <span className={styles.summaryLabelDotted}>Notional</span>
                        <span className={styles.summaryValue}>
                            ${((isAmountUSD ? parseFloat(amount || '0') || 0 : (parseFloat(amount || '0') || 0) * currentMarketPrice) * leverage).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                    </div>
                    <div className={styles.summaryRow}>
                        <span className={styles.summaryLabelDotted}>Margin Req.</span>
                        <span className={styles.summaryValue}>
                            ${(isAmountUSD ? parseFloat(amount || '0') || 0 : (parseFloat(amount || '0') || 0) * currentMarketPrice).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                    </div>
                    <div className={styles.summaryRow}>
                        <span className={styles.summaryLabelDotted}>Est. Liq Price</span>
                        <span className={styles.summaryValue} style={{ color: '#FF4560' }}>
                            {(() => {
                                const val = parseFloat(amount || '0');
                                if (!val || !effectivePrice) return '—';
                                const liq = side === 'buy' ? effectivePrice * (1 - 0.8 / leverage) : effectivePrice * (1 + 0.8 / leverage);
                                return `$${liq.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
                            })()}
                        </span>
                    </div>
                </div>

                <button 
                    className={styles.mainActionBtn} 
                    onClick={() => {
                        if (!authenticated) handleConnect();
                        else if (!hasSession) openSessionModal();
                        else if (!isSimulationExchange && !tradingSetupOk) openTradingSetup();
                        else if (!isSimulationExchange && (summary?.account_value || 0) <= 0) openDepositModal('deposit');
                        else handleSubmit();
                    }}
                    disabled={disableSubmit}
                >
                    {isSubmitting ? (
                        'Processing...'
                    ) : !authenticated ? (
                        'Connect Wallet'
                    ) : !hasSession ? (
                        'Establish Session'
                    ) : !isSimulationExchange && !tradingSetupOk ? (
                        'Grant Trading Access'
                    ) : (
                        `${side === 'buy' ? 'Buy Long' : 'Sell Short'} ${selectedMarket?.symbol || ''}`
                    )}
                </button>

                {authenticated && !isSimulationExchange && !tradingSetupOk && (
                   <div style={{ marginTop: '8px', textAlign: 'center' }}>
                       <span style={{ fontSize: '10px', color: '#A77590', cursor: 'pointer' }} onClick={handleSwitchToTargetChain}>
                           Wrong Network? Switch to Arbitrum Sepolia
                       </span>
                   </div>
                )}
            </div>
        </div>
    );
};

export default OrderForm;
