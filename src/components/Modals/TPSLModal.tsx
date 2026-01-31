import React, { useState } from 'react';
import styles from './TPSLModal.module.css';
import { useUIStore } from '../../store/useUIStore';
import { usePortfolioStore } from '../../store/usePortfolioStore';

export const TPSLModal: React.FC = () => {
    const { isTPSLModalOpen, closeTPSLModal, selectedPosition } = useUIStore();
    const { updateTPSL } = usePortfolioStore();
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

    // Prevent scroll
    React.useEffect(() => {
        if (isTPSLModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isTPSLModalOpen]);

    if (!isTPSLModalOpen || !selectedPosition) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) closeTPSLModal();
    };

    const assetSymbol = selectedPosition.symbol.split('-')[0];
    const amountToApply = (selectedPosition.size * (percentage / 100)).toFixed(4);
    const isFormValid = !!(tpPrice || tpGain || slPrice || slLoss || configAmount);

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
                        <span className={styles.value}>{selectedPosition.entryPrice.toLocaleString()}</span>
                    </div>
                    <div className={styles.infoRow}>
                        <span className={styles.label}>Mark Price</span>
                        <span className={styles.value}>{selectedPosition.markPrice.toLocaleString()}</span>
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
                                    <input type="text" value={amountToApply.replace('.', ',')} readOnly />
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
                                updateTPSL(selectedPosition.id, finalTP, finalSL);
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
