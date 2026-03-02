import React, { useState, useEffect } from 'react';
import styles from './DepositModal.module.css';
import { useUIStore } from '../../store/useUIStore';
import { useWallet } from '../../hooks';
import { onchainService } from '../../api/onchainService';
import toast from 'react-hot-toast';
import { useWallets } from '@privy-io/react-auth';
import { createWalletClient, custom, formatUnits } from 'viem';
import { baseSepolia } from 'viem/chains';

export const CreateCodeModal: React.FC = () => {
    const { isCreateCodeModalOpen, closeCreateCodeModal } = useUIStore();
    const { walletAddress } = useWallet();
    const { wallets } = useWallets();
    const [code, setCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tradingVolume, setTradingVolume] = useState<bigint>(0n);
    const [minVolume, setMinVolume] = useState<bigint>(10_000_000_000n);
    const [loadingVolume, setLoadingVolume] = useState(true);

    useEffect(() => {
        if (!isCreateCodeModalOpen || !walletAddress) return;
        setLoadingVolume(true);
        Promise.all([
            onchainService.getTradingVolumeUsd(walletAddress),
            onchainService.getMinimumTradingVolumeUsd(),
        ]).then(([vol, min]) => {
            setTradingVolume(vol);
            setMinVolume(min);
        }).catch(() => {}).finally(() => setLoadingVolume(false));
    }, [isCreateCodeModalOpen, walletAddress]);

    if (!isCreateCodeModalOpen) return null;

    const meetsVolume = tradingVolume >= minVolume;
    const minUsd = Number(formatUnits(minVolume, 6));
    const currentUsd = Number(formatUnits(tradingVolume, 6));
    const progressPct = Math.min(100, minUsd > 0 ? (currentUsd / minUsd) * 100 : 0);

    const getWalletClient = async () => {
        const activeWallet = wallets.find(w => w.address.toLowerCase() === walletAddress?.toLowerCase());
        if (!activeWallet) throw new Error('Wallet not connected');
        await activeWallet.switchChain(84532);
        const provider = await activeWallet.getEthereumProvider();
        return createWalletClient({
            account: walletAddress as `0x${string}`,
            chain: baseSepolia,
            transport: custom(provider)
        });
    };

    const handleSubmit = async () => {
        const trimmed = code.trim().toUpperCase();
        if (!trimmed || !meetsVolume) return;
        setIsSubmitting(true);
        try {
            const client = await getWalletClient();
            const { tx_hash } = await onchainService.createReferralCode(client, trimmed);
            toast.loading('Creating referral code...', { id: 'create-code' });
            await onchainService.waitForTransaction(tx_hash);
            toast.success('Referral code created!', { id: 'create-code' });
            setCode('');
            closeCreateCodeModal();
        } catch (e: any) {
            const msg = e?.shortMessage || e?.message || 'Failed to create code';
            if (msg.includes('user rejected') || msg.includes('denied')) {
                toast.error('Transaction rejected', { id: 'create-code' });
            } else if (msg.includes('Code already exists')) {
                toast.error('This code is already taken. Try another.', { id: 'create-code', duration: 5000 });
            } else if (msg.includes('Code already created')) {
                toast.error('You already have a referral code.', { id: 'create-code', duration: 5000 });
            } else {
                toast.error(msg, { id: 'create-code', duration: 5000 });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && closeCreateCodeModal()}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Create Referral Code</h2>
                    <button className={styles.closeButton} onClick={closeCreateCodeModal}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>

                <div className={styles.content}>
                    {/* Volume requirement block */}
                    <div style={{
                        background: meetsVolume ? 'rgba(0,227,150,0.08)' : 'rgba(167,117,144,0.1)',
                        border: `1px solid ${meetsVolume ? 'rgba(0,227,150,0.3)' : 'rgba(167,117,144,0.3)'}`,
                        borderRadius: '8px',
                        padding: '12px 14px',
                        marginBottom: '20px',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '12px', color: '#A77590' }}>
                                {meetsVolume ? '✓ Volume requirement met' : 'Volume requirement'}
                            </span>
                            <span style={{ fontSize: '12px', color: meetsVolume ? '#00E396' : '#FFE1F2', fontWeight: 600 }}>
                                {loadingVolume ? '...' : `$${currentUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })} / $${minUsd.toLocaleString()}`}
                            </span>
                        </div>
                        {/* Progress bar */}
                        <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{
                                height: '100%',
                                width: `${progressPct}%`,
                                background: meetsVolume ? '#00E396' : '#A77590',
                                borderRadius: '2px',
                                transition: 'width 0.4s ease',
                            }} />
                        </div>
                        {!meetsVolume && (
                            <p style={{ fontSize: '11px', color: '#A77590', marginTop: '8px', marginBottom: 0 }}>
                                Trade ${(minUsd - currentUsd).toLocaleString(undefined, { maximumFractionDigits: 0 })} more to unlock code creation.
                            </p>
                        )}
                    </div>

                    {/* Code input — visible only when requirement is met */}
                    {meetsVolume ? (
                        <div className={styles.amountContainer}>
                            <div className={styles.amountHeader}>
                                <span>Your Custom Code</span>
                            </div>
                            <div className={styles.inputRow}>
                                <input
                                    type="text"
                                    className={styles.amountInput}
                                    style={{ fontSize: '16px' }}
                                    placeholder="e.g. TREASURE"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                                    maxLength={32}
                                />
                            </div>
                        </div>
                    ) : (
                        <div style={{
                            textAlign: 'center',
                            padding: '24px 0',
                        }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: '12px', opacity: 0.5 }}>
                                <rect x="3" y="11" width="18" height="11" rx="2" stroke="#A77590" strokeWidth="1.5" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#A77590" strokeWidth="1.5" strokeLinecap="round" />
                                <circle cx="12" cy="16" r="1.5" fill="#A77590" />
                            </svg>
                            <div style={{ fontSize: '14px', color: '#FFE1F2', fontWeight: 500, marginBottom: '4px' }}>
                                Reach ${minUsd.toLocaleString()} trading volume
                            </div>
                            <div style={{ fontSize: '12px', color: '#A77590' }}>
                                to unlock your referral code
                            </div>
                        </div>
                    )}

                    <button
                        className={`${styles.actionButton} ${(!code || !meetsVolume) ? styles.disabledButton : ''}`}
                        disabled={!code || isSubmitting || !meetsVolume}
                        onClick={handleSubmit}
                        style={{ marginTop: meetsVolume ? undefined : '8px' }}
                    >
                        {isSubmitting ? 'Creating...' : meetsVolume ? 'Create' : 'Locked'}
                    </button>
                </div>
            </div>
        </div>
    );
};
