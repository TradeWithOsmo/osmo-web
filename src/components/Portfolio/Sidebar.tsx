import React from 'react';
import styles from './Portfolio.module.css';
import sidebarIcon from '../../assets/Icons/Sidebar.png';

interface SidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    isMinimized: boolean;
    onToggleMinimize: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, isMinimized, onToggleMinimize }) => {
    return (
        <div className={`${styles.sidebar} ${isMinimized ? styles.sidebarMinimized : ''}`}>
            {/* Toggle Button */}
            <button
                className={styles.toggleButton}
                onClick={onToggleMinimize}
                aria-label={isMinimized ? "Expand sidebar" : "Minimize sidebar"}
            >
                <img src={sidebarIcon} alt="Toggle Sidebar" className={styles.toggleIcon} />
            </button>

            {!isMinimized && (
                <>
                    {/* Account Section */}
                    <div>
                        <div className={styles.sidebarSectionTitle}>Account</div>
                        <div
                            className={`${styles.menuItem} ${activeTab === 'Overview' ? styles.active : ''}`}
                            onClick={() => onTabChange('Overview')}
                        >
                            {/* Icon Placeholder */}
                            <span>Overview</span>
                        </div>
                        <div
                            className={`${styles.menuItem} ${activeTab === 'Positions' ? styles.active : ''}`}
                            onClick={() => onTabChange('Positions')}
                        >
                            <span>Positions</span>
                        </div>
                        <div
                            className={`${styles.menuItem} ${activeTab === 'Orders' ? styles.active : ''}`}
                            onClick={() => onTabChange('Orders')}
                        >
                            <span>Orders</span>
                        </div>
                        <div
                            className={`${styles.menuItem} ${activeTab === 'History' ? styles.active : ''}`}
                            onClick={() => onTabChange('History')}
                        >
                            <span>History</span>
                        </div>
                    </div>

                    {/* Other Section */}
                    <div>
                        <div className={styles.sidebarSectionTitle}>Other</div>
                        <div
                            className={`${styles.menuItem} ${activeTab === 'Fees' ? styles.active : ''}`}
                            onClick={() => onTabChange('Fees')}
                        >
                            <span>Fees</span>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Sidebar;
