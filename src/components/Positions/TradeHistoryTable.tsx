import styles from './PositionsPanel.module.css';
import TradeHistoryRow from './TradeHistoryRow';
import type { TradeHistoryData } from './TradeHistoryRow';

interface TradeHistoryTableProps {
    trades: TradeHistoryData[];
    footerContent?: React.ReactNode;
}

const TradeHistoryTable: React.FC<TradeHistoryTableProps> = ({ trades, footerContent }) => {
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
                    {trades.length > 0 ? (
                        trades.map(trade => (
                            <TradeHistoryRow key={trade.id} trade={trade} />
                        ))
                    ) : (
                        <tr>
                            <td colSpan={8} style={{ textAlign: 'center', padding: '48px', color: '#A77590' }}>
                                No trade history
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
