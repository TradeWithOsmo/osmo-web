import React, { useState } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { onchainService, CONTRACTS } from '../../api/onchainService';
import toast from 'react-hot-toast';
import styles from './DepositModal.module.css'; // Use DepositModal styles for consistency
import { useWallets } from '@privy-io/react-auth';
import { encodeFunctionData, createWalletClient, custom, parseEther } from 'viem';
import { arbitrumSepolia } from 'viem/chains';
import { useUIStore } from '../../store/useUIStore';

interface SessionKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SessionKeyModal: React.FC<SessionKeyModalProps> = ({ isOpen, onClose }) => {
    const { walletAddress } = useWallet();
    const { wallets } = useWallets();
    const { setHasSession } = useUIStore();
    const [creating, setCreating] = useState(false);
    const [step, setStep] = useState<'initial' | 'signing' | 'confirming' | 'success'>('initial');

    // Reset state when opening
    React.useEffect(() => {
        if (isOpen) {
            setCreating(false);
            setStep('initial');
        }
    }, [isOpen]);

    // Auto-restore session from backend if it exists
    React.useEffect(() => {
        const checkExisting = async () => {
            if (isOpen && walletAddress && !creating) {
                // 1. Check LocalStorage first for instant restore
                // Skip local check if we are explicitly re-opening because of an error
                // (Handled by the fact that invalid session is cleared before opening)

                const localKey = localStorage.getItem('osmo_session_key');
                const localExpires = localStorage.getItem('osmo_session_expires');

                if (localKey && localExpires && new Date(localExpires) > new Date()) {
                    console.log('[SessionKey] Valid session found in storage');
                    setStep('success');
                    setHasSession(true);
                    // onClose(); // Dont auto close
                    return;
                }


                // 2. Fallback to Backend Check
                try {
                    // Only check if we have a wallet connected
                    const result = await onchainService.getActiveSession(walletAddress) as any;

                    if (result.has_session) {
                        console.log('[SessionKey] Active session found in backend, restoring...');

                        // IMPORTANT: Sync backend state to local storage
                        localStorage.setItem('osmo_session_key', result.session_private_key);
                        localStorage.setItem('osmo_session_address', result.session_address);

                        // Ensure expiry is in ISO format
                        const expiryDate = new Date(result.expires_at || result.expires_in * 1000 + Date.now());
                        localStorage.setItem('osmo_session_expires', expiryDate.toISOString());

                        setStep('success');
                        setHasSession(true);
                    }
                } catch (err) {
                    // console.error('[SessionKey] Failed to check for existing session', err); 
                    // Silent fail is fine here, user will just have to create new one if needed
                }

            }
        };
        checkExisting();
    }, [isOpen, walletAddress]);

    const handleCreate = async () => {

        console.log('[SessionKey] Starting creation flow...');

        // Find the active wallet
        const activeWallet = wallets.find(w => w.address.toLowerCase() === walletAddress?.toLowerCase());

        if (!activeWallet) {
            console.error('[SessionKey] Wallet mismatch or not found');
            toast.error('Please connect your wallet');
            return;
        }

        setCreating(true);
        setStep('initial');

        try {
            // 1. Backend Create
            console.log('[SessionKey] Requesting session from backend...');
            const sessionData = await onchainService.createSessionKey(walletAddress!, {
                max_trade_size: 1000 * 1_000_000,
                expires_in: 24 * 60 * 60
            });

            if (!sessionData.needs_onchain_approval) {
                console.log('[SessionKey] Legacy flow detected');
                localStorage.setItem('osmo_session_key', sessionData.session_private_key);
                setStep('success');
                setHasSession(true);
                setTimeout(() => onClose(), 100);
                return;
            }

            // 2. On-chain Transaction
            setStep('signing');
            console.log('[SessionKey] Preparing on-chain transaction...');

            const maxTradeSize = Math.floor(Number(sessionData.max_trade_size_usd) * 1_000_000);

            const abi = [
                {
                    name: 'createSessionKey',
                    type: 'function',
                    stateMutability: 'nonpayable',
                    inputs: [
                        { name: 'user', type: 'address' },
                        { name: 'agentPubkey', type: 'bytes' },
                        { name: 'durationSeconds', type: 'uint256' },
                        { name: 'dailyLimitUsd', type: 'uint256' }
                    ],
                    outputs: [{ name: 'sessionId', type: 'bytes32' }]
                }
            ] as const;

            const calldata = encodeFunctionData({
                abi,
                args: [
                    walletAddress as `0x${string}`,
                    sessionData.session_address as `0x${string}`,
                    BigInt(sessionData.expires_in),
                    BigInt(maxTradeSize)
                ]
            });

            const provider = await activeWallet.getEthereumProvider();

            // Switch chain if needed
            if (activeWallet.chainId !== 'eip155:421614') {
                console.log('[SessionKey] Switching network...');
                await activeWallet.switchChain(421614);
            }

            const walletClient = createWalletClient({
                account: walletAddress as `0x${string}`,
                chain: arbitrumSepolia,
                transport: custom(provider)
            });

            console.log('[SessionKey] Sending transaction...');

            const txHash = await walletClient.sendTransaction({
                to: CONTRACTS.SessionKeyManager as `0x${string}`,
                data: calldata,
                value: parseEther('0.005'), // Fund the session key with 0.005 ETH for gas
                chain: arbitrumSepolia
            });

            console.log('[SessionKey] Transaction hash:', txHash);

            // OPTIMISTIC: Close modal immediately after user signs
            onClose();
            toast.loading('Verifying session...', { id: 'session-verify' });

            // 3. Backend Confirmation & Local Storage
            console.log('[SessionKey] Confirming with backend...');

            // Set local storage optimistically
            localStorage.setItem('osmo_session_key', sessionData.session_private_key);
            localStorage.setItem('osmo_session_address', sessionData.session_address);
            localStorage.setItem('osmo_session_expires', new Date(Date.now() + sessionData.expires_in * 1000).toISOString());

            // Confirm with backend
            await onchainService.confirmSessionKey({
                user_address: walletAddress!,
                session_address: sessionData.session_address,
                session_private_key: sessionData.session_private_key,
                expires_in: sessionData.expires_in
            });

            console.log('[SessionKey] Successfully established!');
            toast.success('Connection fully established!', { id: 'session-verify' });
            setHasSession(true);

        } catch (error: any) {
            console.error('[SessionKey] Error:', error);
            const msg = error.message || 'Unknown error';
            if (msg.toLowerCase().includes('user rejected') || msg.toLowerCase().includes('denied')) {
                toast.error('Transaction rejected');
            } else {
                console.error('[SessionKey] Create Failed:', msg);
                if (msg.includes('Failed to fetch')) {
                    toast.error('Backend unreachable. Is server running?', { id: 'session-verify', duration: 5000 });
                } else {
                    // Show validation errors from backend
                    toast.error(msg, { id: 'session-verify', duration: 5000 });
                }
            }
            // If failed, clear local storage
            localStorage.removeItem('osmo_session_key');
            localStorage.removeItem('osmo_session_address');
            localStorage.removeItem('osmo_session_expires');
            setHasSession(false);

            setCreating(false);
            setStep('initial');
        }
    };


    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const getButtonText = () => {
        if (step === 'success') return '✓ Connection Established';
        if (!creating) return 'Confirm Connection';
        switch (step) {
            case 'signing':
                return 'Waiting for Signature...';
            case 'confirming':
                return 'Confirming On-Chain...';
            default:
                return 'Establishing...';
        }
    };


    return (
        <div className={styles.overlay} onClick={handleBackdropClick}>
            <div className={styles.modal} style={{ maxWidth: '450px' }}>
                {/* Header */}
                <div className={styles.header}>
                    <h2 className={styles.title}>Establish Connection</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className={styles.content}>
                    <p style={{ color: '#A77590', fontSize: '14px', lineHeight: '1.5', margin: 0 }}>
                        Authorize a secure session key to enable autonomous AI trading execution.
                        This requires an on-chain transaction to ensure trustless permission management.
                    </p>

                    <div className={styles.amountContainer}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div className={styles.infoRow} style={{ borderBottom: '1px solid #2D0818', paddingBottom: '8px' }}>
                                <span className={styles.infoLabel}>Permission</span>
                                <span className={styles.infoValue}>Trade Execution</span>
                            </div>
                            <div className={styles.infoRow} style={{ borderBottom: '1px solid #2D0818', paddingBottom: '8px' }}>
                                <span className={styles.infoLabel}>Max Size</span>
                                <span className={styles.infoValue}>$1,000.00</span>
                            </div>
                            <div className={styles.infoRow} style={{ borderBottom: '1px solid #2D0818', paddingBottom: '8px' }}>
                                <span className={styles.infoLabel}>Validity</span>
                                <span className={styles.infoValue}>24 Hours</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Gas Deposit</span>
                                <span className={styles.infoValue}>~0.005 ETH</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.infoRow} style={{ justifyContent: 'center' }}>
                        <span style={{ fontSize: '12px', color: '#553344' }}>
                            Stored on-chain. Revocable anytime via contract.
                        </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                        <button
                            className={styles.actionButton}
                            onClick={handleCreate}
                            disabled={creating}
                        >
                            {getButtonText()}
                        </button>

                        <button
                            style={{
                                background: 'transparent',
                                border: '1px solid #3A2530',
                                color: '#A77590',
                                padding: '12px',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 500
                            }}
                            onClick={onClose}
                            disabled={creating}
                        >
                            Skip for Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
