import React from 'react';
import styles from './PositionsPanel.module.css';
import type { FundingHistoryData } from '../../api/portfolioService';
import usdcArbIcon from '../../assets/deposited chain/USDCARB.png';

interface FundingHistoryRowProps {
    data: FundingHistoryData;
}

const FundingHistoryRow: React.FC<FundingHistoryRowProps> = ({ data }) => {
    const statusColor =
        data.status === 'Completed' ? '#00E396' :
            data.status === 'Failed' ? '#FF4560' :
                '#FEB019';

    return (
        <tr className={styles.row}>
            <td className={styles.td}>
                <span className={styles.timeText}>{new Date(data.timestamp).toLocaleString()}</span>
            </td>
            <td className={styles.td}>
                <span style={{
                    color: data.type === 'Deposit' ? '#00E396' : '#FF4560',
                    background: data.type === 'Deposit' ? 'rgba(0, 227, 150, 0.1)' : 'rgba(255, 69, 96, 0.1)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '12px'
                }}>
                    {data.type}
                </span>
            </td>
            <td className={styles.td}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <img src={usdcArbIcon} alt="USDC" width={16} height={16} />
                    <span>{data.asset}</span>
                </div>
            </td>
            <td className={styles.td}>
                {data.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
            </td>
            <td className={styles.td}>
                <a
                    href={`https://sepolia.arbiscan.io/tx/${data.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#00E396', textDecoration: 'none' }}
                >
                    {data.txHash.slice(0, 6)}...{data.txHash.slice(-4)}
                </a>
            </td>
            <td className={styles.td} style={{ textAlign: 'right' }}>
                <span style={{ color: statusColor }}>{data.status}</span>
            </td>
        </tr>
    );
};

export default FundingHistoryRow;
