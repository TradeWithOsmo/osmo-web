import React, { useState, useEffect } from 'react';
import styles from './DepositModal.module.css';
import { useUIStore } from '../../store/useUIStore';
import { useWallet } from '../../hooks';
import { referralService } from '../../api/referralService';

export const ShareLinkModal: React.FC = () => {
    const { isShareLinkModalOpen, closeShareLinkModal, openCreateCodeModal } = useUIStore();
    const { walletAddress } = useWallet();
    const [customCode, setCustomCode] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!isShareLinkModalOpen || !walletAddress) return;
        referralService.getSummary(walletAddress)
            .then((s) => setCustomCode(s.customCode || ''))
            .catch(() => setCustomCode(''));
    }, [isShareLinkModalOpen, walletAddress]);

    if (!isShareLinkModalOpen) return null;

    const referralLink = customCode
        ? `${window.location.origin}/refer?ref=${encodeURIComponent(customCode)}`
        : '';

    const handleCopy = async () => {
        if (!referralLink) return;
        try {
            await navigator.clipboard.writeText(referralLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // fallback: select input text
            const el = document.getElementById('referral-link-input') as HTMLInputElement | null;
            el?.select();
        }
    };

    const handleNativeShare = async () => {
        if (!referralLink || !navigator.share) return;
        try {
            await navigator.share({
                title: 'Join me on Osmo',
                text: 'Trade with me on Osmo. Use my referral link:',
                url: referralLink,
            });
        } catch { /* cancelled */ }
    };

    const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

    return (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && closeShareLinkModal()}>
            <div className={styles.modal} style={{ maxWidth: '400px' }}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Share Referral Link</h2>
                    <button className={styles.closeButton} onClick={closeShareLinkModal}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>

                <div className={styles.content}>
                    {customCode ? (
                        <>
                            <p style={{ color: '#A77590', fontSize: '13px', marginBottom: '16px', lineHeight: '1.5' }}>
                                Share your personal referral link and earn rewards when traders sign up.
                            </p>

                            {/* Code badge */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
                                <span style={{ fontSize: '12px', color: '#A77590' }}>Your code:</span>
                                <span style={{
                                    background: 'rgba(102,0,53,0.3)',
                                    border: '1px solid rgba(102,0,53,0.6)',
                                    borderRadius: '6px',
                                    padding: '3px 10px',
                                    color: '#FFE1F2',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    letterSpacing: '0.05em',
                                }}>
                                    {customCode}
                                </span>
                            </div>

                            {/* Link input + copy */}
                            <div style={{
                                display: 'flex',
                                gap: '8px',
                                background: '#1A0A14',
                                border: '1px solid #3A2530',
                                borderRadius: '8px',
                                padding: '10px 12px',
                                marginBottom: '16px',
                                alignItems: 'center',
                            }}>
                                <input
                                    id="referral-link-input"
                                    readOnly
                                    value={referralLink}
                                    style={{
                                        flex: 1,
                                        background: 'transparent',
                                        border: 'none',
                                        outline: 'none',
                                        color: '#A77590',
                                        fontSize: '12px',
                                        fontFamily: 'monospace',
                                        minWidth: 0,
                                    }}
                                    onFocus={(e) => e.target.select()}
                                />
                                <button
                                    onClick={handleCopy}
                                    style={{
                                        flexShrink: 0,
                                        background: copied ? 'rgba(0,227,150,0.15)' : 'rgba(102,0,53,0.3)',
                                        border: `1px solid ${copied ? 'rgba(0,227,150,0.4)' : 'rgba(102,0,53,0.6)'}`,
                                        borderRadius: '6px',
                                        color: copied ? '#00E396' : '#FFE1F2',
                                        padding: '4px 12px',
                                        fontSize: '12px',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {copied ? (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                            Copied
                                        </span>
                                    ) : (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="1.8" /></svg>
                                            Copy
                                        </span>
                                    )}
                                </button>
                            </div>

                            {/* Native share (mobile) */}
                            {canNativeShare && (
                                <button
                                    onClick={handleNativeShare}
                                    style={{
                                        width: '100%',
                                        background: 'transparent',
                                        border: '1px solid #3A2530',
                                        borderRadius: '8px',
                                        color: '#FFE1F2',
                                        padding: '10px',
                                        fontSize: '14px',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><polyline points="16 6 12 2 8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><line x1="12" y1="2" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                                    Share
                                </button>
                            )}
                        </>
                    ) : (
                        /* No code yet */
                        <div style={{ textAlign: 'center', padding: '16px 0' }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: '12px', opacity: 0.5 }}>
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="#A77590" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="#A77590" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <div style={{ fontSize: '14px', color: '#FFE1F2', fontWeight: 500, marginBottom: '6px' }}>
                                No referral code yet
                            </div>
                            <div style={{ fontSize: '12px', color: '#A77590', marginBottom: '20px' }}>
                                Create a code first to get your shareable link
                            </div>
                            <button
                                className={styles.actionButton}
                                onClick={() => { closeShareLinkModal(); openCreateCodeModal(); }}
                            >
                                Create Code
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
