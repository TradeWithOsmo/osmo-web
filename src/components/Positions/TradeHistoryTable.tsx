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
                    {trades.map(trade => (
                        <TradeHistoryRow key={trade.id} trade={trade} />
                    ))}
                </tbody>
            </table>
            {footerContent}
        </div>
    );
};

export default TradeHistoryTable;
