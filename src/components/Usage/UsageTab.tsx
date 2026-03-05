import React from 'react';
import styles from './Usage.module.css';
import UsageHistoryTable from './UsageHistoryTable';

const UsageTab: React.FC = () => {
    return (
        <div style={{ paddingBottom: '32px' }}>
            <div className={styles.sectionTitle}>Usage</div>
            <UsageHistoryTable />
        </div>
    );
};

export default UsageTab;
