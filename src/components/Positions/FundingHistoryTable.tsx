import React from 'react';
import styles from './PositionsPanel.module.css';
import FundingHistoryRow from './FundingHistoryRow';
import type { FundingHistoryData } from '../../api/portfolioService';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import { useWallet } from '../../hooks/useWallet';

interface FundingHistoryTableProps {
    data: FundingHistoryData[];
    footerContent?: React.ReactNode;
}

const FundingHistoryTable: React.FC<FundingHistoryTableProps> = ({ data, footerContent }) => {
    const { isLoading, error, refreshAll } = usePortfolioStore();
    const { walletAddress } = useWallet();

    return (
        <div className={styles.tableWrapper}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th className={`${styles.th} ${styles.thFirst}`}>Time</th>
                        <th className={styles.th}>Type</th>
                        <th className={styles.th}>Asset</th>
                        <th className={`${styles.th} ${styles.thRight}`}>Amount</th>
                        <th className={styles.th}>Tx Hash</th>
                        <th className={`${styles.th} ${styles.thRight}`}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {isLoading && data.length === 0 ? (
                        <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: '#A77590' }}>
                                Loading funding history...
                            </td>
                        </tr>
                    ) : error ? (
                        <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: '40px 0' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ color: '#FF4560', fontSize: '14px' }}>⚠ Failed to load history</span>
                                    <span style={{ color: '#A77590', fontSize: '12px' }}>{error}</span>
                                    <button
                                        onClick={() => refreshAll(walletAddress!)}
                                        style={{ marginTop: '8px', padding: '4px 12px', background: '#3A2530', border: '1px solid #5D4050', borderRadius: '4px', cursor: 'pointer', color: '#FFE1F2' }}
                                    >
                                        Retry
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ) : data.length > 0 ? (
                        data.map(item => (
                            <FundingHistoryRow key={item.id} data={item} />
                        ))
                    ) : (
                        <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: '40px 0' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#5D4050" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 2v20M2 12h20" strokeLinecap="round" />
                                    </svg>
                                    <span style={{ color: '#A77590', fontSize: '14px' }}>No funding history</span>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
            {footerContent}
        </div>
    );
};

export default FundingHistoryTable;
