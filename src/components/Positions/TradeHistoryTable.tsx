import styles from './PositionsPanel.module.css';
import TradeHistoryRow from './TradeHistoryRow';
import type { TradeHistoryData } from './TradeHistoryRow';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import { useWallet } from '../../hooks/useWallet';

interface TradeHistoryTableProps {
    trades: TradeHistoryData[];
    footerContent?: React.ReactNode;
}

const TradeHistoryTable: React.FC<TradeHistoryTableProps> = ({ trades, footerContent }) => {
    // Assuming these are passed or we use store here. For consistency with OrdersTable, let's use the store hook inside if not passed.
    // However, the prop defines only trades. I will check PositionsPanel to see if I can pass loading/error state.
    // For now I will mock the visual state structure assuming the parent passes correct data or empty array if loading.

    // Better practice: Use store here to get loading status if not passed as prop
    const { isLoading, error, refreshAll } = usePortfolioStore();
    const { walletAddress } = useWallet();

    return (
        <div className={styles.tableWrapper}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th className={styles.th}>Time</th>
                        <th className={styles.th}>Coin</th>
                        <th className={styles.th}>Direction</th>
                        <th className={styles.th}>Price</th>
                        <th className={styles.th}>Size</th>
                        <th className={styles.th}>Trade Value</th>
                        <th className={styles.th}>Fee</th>
                        <th className={styles.th} style={{ textAlign: 'right' }}>Closed PNL</th>
                    </tr>
                </thead>
                <tbody>
                    {isLoading && trades.length === 0 ? (
                        <tr>
                            <td colSpan={8} style={{ textAlign: 'center', padding: '40px 0', color: '#A77590' }}>
                                Loading trade history...
                            </td>
                        </tr>
                    ) : error ? (
                        <tr>
                            <td colSpan={8} style={{ textAlign: 'center', padding: '40px 0' }}>
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
                    ) : trades.length > 0 ? (
                        trades.map(trade => (
                            <TradeHistoryRow key={trade.id} trade={trade} />
                        ))
                    ) : (
                        <tr>
                            <td colSpan={8} style={{ textAlign: 'center', padding: '40px 0' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#5D4050" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                                    </svg>
                                    <span style={{ color: '#A77590', fontSize: '14px' }}>No trade history</span>
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

export default TradeHistoryTable;
