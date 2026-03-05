import React, { useState } from 'react';
import styles from './TPSLModal.module.css';
import { useUIStore } from '../../store/useUIStore';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import { useMarketStore } from '../../store/useMarketStore';
import { usePrivy } from '@privy-io/react-auth';

export const TPSLModal: React.FC = () => {
    const { isTPSLModalOpen, closeTPSLModal, selectedPosition: uiPosition } = useUIStore();
    const { positions, updateTPSL } = usePortfolioStore();
    const { getPrice } = useMarketStore();
    const { user } = usePrivy();
    const walletAddress = user?.wallet?.address;

    const selectedPosition = positions.find(p => p.id === uiPosition?.id) || uiPosition;
    const [tpPrice, setTpPrice] = useState('');
    const [tpGain, setTpGain] = useState('');
    const [slPrice, setSlPrice] = useState('');
    const [slLoss, setSlLoss] = useState('');
    const [configAmount, setConfigAmount] = useState(false);
    const [limitPrice, setLimitPrice] = useState(false);
    const [percentage, setPercentage] = useState(100);
    const [tpLimitPrice, setTpLimitPrice] = useState('');
    const [slLimitPrice, setSlLimitPrice] = useState('');
    const [tpUnit, setTpUnit] = useState<'%' | 'USD'>('%');
    const [slUnit, setSlUnit] = useState<'%' | 'USD'>('%');
    const [manualAmount, setManualAmount] = useState('');

    // Prevent scroll
    React.useEffect(() => {
        if (isTPSLModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isTPSLModalOpen]);

    // Pre-fill existing TP/SL
    React.useEffect(() => {
        if (selectedPosition) {
            const parseValue = (val: string | number | undefined, setPrice: (v: string) => void, setGainLoss: (v: string) => void, setUnit: (v: 'USD' | '%') => void) => {
                if (!val) {
                    setPrice('');
                    setGainLoss('');
                    return;
                }
                const strVal = String(val);
                if (strVal.endsWith('%')) {
                    setGainLoss(strVal.slice(0, -1));
                    setUnit('%');
                    setPrice('');
                } else if (strVal.toUpperCase().endsWith('USD')) {
                    setGainLoss(strVal.slice(0, -3));
                    setUnit('USD');
                    setPrice('');
                } else if (strVal.endsWith('$')) {
                    setGainLoss(strVal.slice(0, -1)); // legacy format
                    setUnit('USD');
                    setPrice('');
                } else {
                    // Assume it's a price
                    setPrice(strVal);
                    setGainLoss('');
                }
            };

            parseValue(selectedPosition.tp, setTpPrice, setTpGain, setTpUnit);
            parseValue(selectedPosition.sl, setSlPrice, setSlLoss, setSlUnit);
        }
    }, [selectedPosition]);

    // Sync manual amount with percentage
    React.useEffect(() => {
        if (selectedPosition) {
            const amt = (selectedPosition.size * (percentage / 100));
            setManualAmount(amt.toFixed(selectedPosition.symbol.includes('USD') ? 4 : 8));
        }
    }, [percentage, selectedPosition?.size]);

    // Pre-fill optional risk config (size tokens + limit prices)
    React.useEffect(() => {
        if (!selectedPosition) return;

        const st = Number((selectedPosition as any).tpsl_size_tokens);
        if (Number.isFinite(st) && st > 0 && Number.isFinite(selectedPosition.size) && selectedPosition.size > 0) {
            setConfigAmount(true);
            const pct = Math.min(100, Math.max(0, (st / selectedPosition.size) * 100));
            setPercentage(pct);
            setManualAmount(st.toFixed(selectedPosition.symbol.includes('USD') ? 4 : 8));
        }

        const tlp = Number((selectedPosition as any).tp_limit_price);
        const slp = Number((selectedPosition as any).sl_limit_price);
        if ((Number.isFinite(tlp) && tlp > 0) || (Number.isFinite(slp) && slp > 0)) {
            setLimitPrice(true);
            if (Number.isFinite(tlp) && tlp > 0) setTpLimitPrice(String(tlp));
            if (Number.isFinite(slp) && slp > 0) setSlLimitPrice(String(slp));
        }
    }, [selectedPosition?.id]);

    if (!isTPSLModalOpen || !selectedPosition) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) closeTPSLModal();
    };

    const assetSymbol = selectedPosition.symbol.split('-')[0];
    const markPrice = getPrice(selectedPosition?.symbol || '') || (selectedPosition as any)?.markPrice || (selectedPosition as any)?.mark_price || 0;

    const handleManualAmountChange = (val: string) => {
        setManualAmount(val);
        const num = parseFloat(val);
        if (selectedPosition && !isNaN(num) && selectedPosition.size > 0) {
            const pct = Math.min(100, Math.max(0, (num / selectedPosition.size) * 100));
            setPercentage(pct);
        }
    };

    const hasTpsl = !!(tpPrice || tpGain || slPrice || slLoss);
    const hasValidAmount = !configAmount || (Number.isFinite(parseFloat(manualAmount)) && parseFloat(manualAmount) > 0);
    const hasLimitField = !limitPrice || !!tpLimitPrice || !!slLimitPrice;
    const isFormValid = hasTpsl && hasValidAmount && hasLimitField;

    return (
        <div className={styles.overlay} onClick={handleBackdropClick}>
            <div className={styles.modal}>
                {/* Header */}
                <div className={styles.header}>
                    <h2 className={styles.title}>TP/SL for Position</h2>
                    <button className={styles.closeButton} onClick={closeTPSLModal}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>

                <div className={styles.content}>
                    {/* Info Section */}
                    <div className={styles.infoRow}>
                        <span className={styles.label}>Coin</span>
                        <span className={styles.value}>{assetSymbol}</span>
                    </div>
                    <div className={styles.infoRow}>
                        <span className={styles.label}>Position</span>
                        <span className={`${styles.value} ${styles.highlightValue}`}>
                            {selectedPosition.size.toLocaleString()} {assetSymbol}
                        </span>
                    </div>
                    <div className={styles.infoRow}>
                        <span className={styles.label}>Entry Price</span>
                        <span className={styles.value}>{(selectedPosition as any).entry_price || (selectedPosition as any).entryPrice || 0}</span>
                    </div>
                    <div className={styles.infoRow}>
                        <span className={styles.label}>Mark Price</span>
                        <span className={styles.value}>{markPrice.toLocaleString()}</span>
                    </div>

                    {/* TP Row */}
                    <div className={styles.inputGrid}>
                        <div className={styles.inputField}>
                            <input
                                type="text"
                                className={styles.textInput}
                                placeholder="TP Price"
                                value={tpPrice}
                                onChange={(e) => setTpPrice(e.target.value)}
                            />
                        </div>
                        <div className={styles.inputField}>
                            <input
                                type="text"
                                className={styles.textInput}
                                placeholder="Gain"
                                value={tpGain}
                                onChange={(e) => setTpGain(e.target.value)}
                            />
                            <div className={styles.unitSelector} onClick={() => setTpUnit(tpUnit === '%' ? 'USD' : '%')}>
                                <span className={styles.unit}>{tpUnit}</span>
                                <svg className={styles.dropdownIcon} width="10" height="6" viewBox="0 0 10 6" fill="none">
                                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* SL Row */}
                    <div className={styles.inputGrid}>
                        <div className={styles.inputField}>
                            <input
                                type="text"
                                className={styles.textInput}
                                placeholder="SL Price"
                                value={slPrice}
                                onChange={(e) => setSlPrice(e.target.value)}
                            />
                        </div>
                        <div className={styles.inputField}>
                            <input
                                type="text"
                                className={styles.textInput}
                                placeholder="Loss"
                                value={slLoss}
                                onChange={(e) => setSlLoss(e.target.value)}
                            />
                            <div className={styles.unitSelector} onClick={() => setSlUnit(slUnit === '%' ? 'USD' : '%')}>
                                <span className={styles.unit}>{slUnit}</span>
                                <svg className={styles.dropdownIcon} width="10" height="6" viewBox="0 0 10 6" fill="none">
                                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Checkboxes */}
                    <div className={styles.checkboxSection}>
                        <label className={styles.checkbox}>
                            <input
                                type="checkbox"
                                className={styles.checkboxInput}
                                checked={configAmount}
                                onChange={(e) => setConfigAmount(e.target.checked)}
                            />
                            <span className={styles.checkboxLabel}>Configure Amount</span>
                        </label>

                        {/* Amount Reveal */}
                        {configAmount && (
                            <div className={styles.amountConfigRow}>
                                <div className={styles.sliderContainer}>
                                    <div className={styles.sliderTrack} />
                                    <div className={styles.sliderProgress} style={{ width: `${percentage}%` }} />
                                    {[0, 25, 50, 75, 100].map(dot => (
                                        <div
                                            key={dot}
                                            className={styles.sliderDot}
                                            style={{ left: `${dot}%`, zIndex: 4, cursor: 'pointer' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPercentage(dot);
                                            }}
                                        />
                                    ))}
                                    <input
                                        type="range"
                                        min="0" max="100"
                                        value={percentage}
                                        onChange={(e) => setPercentage(parseInt(e.target.value))}
                                        style={{ position: 'absolute', width: '100%', opacity: 0, cursor: 'pointer', zIndex: 3 }}
                                    />
                                    <div className={styles.sliderThumb} style={{ left: `${percentage}%` }} />
                                </div>
                                <div className={styles.amountBox}>
                                    <input
                                        type="number"
                                        value={manualAmount}
                                        onChange={(e) => handleManualAmountChange(e.target.value)}
                                    />
                                    <span className={styles.assetLabel}>{assetSymbol}</span>
                                </div>
                            </div>
                        )}

                        <label className={styles.checkbox}>
                            <input
                                type="checkbox"
                                className={styles.checkboxInput}
                                checked={limitPrice}
                                onChange={(e) => setLimitPrice(e.target.checked)}
                            />
                            <span className={styles.checkboxLabel}>Limit Price</span>
                        </label>

                        {/* Limit Price Reveal */}
                        {limitPrice && (
                            <div className={styles.limitPriceGrid}>
                                <div className={styles.inputField}>
                                    <input
                                        type="text"
                                        className={styles.textInput}
                                        placeholder="TP Limit Price"
                                        value={tpLimitPrice}
                                        onChange={(e) => setTpLimitPrice(e.target.value)}
                                    />
                                </div>
                                <div className={styles.inputField}>
                                    <input
                                        type="text"
                                        className={styles.textInput}
                                        placeholder="SL Limit Price"
                                        value={slLimitPrice}
                                        onChange={(e) => setSlLimitPrice(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Button */}
                    <button
                        className={`${styles.confirmButton} ${!isFormValid ? styles.disabledButton : ''}`}
                        disabled={!isFormValid}
                        onClick={() => {
                            if (selectedPosition) {
                                const finalTP = tpPrice || (tpGain ? `${tpGain}${tpUnit}` : undefined);
                                const finalSL = slPrice || (slLoss ? `${slLoss}${slUnit}` : undefined);
                                const risk = {
                                    // Send explicit 0 to clear when toggle is off.
                                    size_tokens: configAmount ? (parseFloat(manualAmount) || 0) : 0,
                                    tp_limit_price: limitPrice ? (parseFloat(tpLimitPrice) || 0) : 0,
                                    sl_limit_price: limitPrice ? (parseFloat(slLimitPrice) || 0) : 0,
                                };
                                updateTPSL(walletAddress || '', selectedPosition.id, finalTP, finalSL, risk);
                            }
                            closeTPSLModal();
                        }}
                    >
                        Confirm
                    </button>

                    <div className={styles.divider} />

                    {/* Footer Text */}
                    <div className={styles.footerSection}>
                        <p className={styles.footerText}>
                            By default take-profit and stop-loss orders apply to the entire position. Take-profit and stop-loss automatically cancel after closing the position. A market order is triggered when the stop loss or take profit price is reached.
                        </p>
                        <p className={styles.footerText}>
                            If the order size is configured above, the TP/SL order will be for that size no matter how the position changes in the future.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
