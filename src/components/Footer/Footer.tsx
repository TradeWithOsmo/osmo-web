import React from 'react';
import styles from './Footer.module.css';
import { useMarketStore } from '../../store/useMarketStore';

import GlobalChat from './GlobalChat';

// Icons
import connectedIcon from '../../assets/Footer/Conected.png';
import notStableIcon from '../../assets/Footer/not stable.png';
import notConnectedIcon from '../../assets/Footer/not conected.png';
import discordIcon from '../../assets/Footer/DiscordLogo.png';
import telegramIcon from '../../assets/Footer/TelegramLogo.png';
import xIcon from '../../assets/Footer/XLogo.png';

const Footer: React.FC = () => {
    const { wsStatus } = useMarketStore();

    const getStatusConfig = () => {
        switch (wsStatus) {
            case 'connected':
                return { text: 'Operational', icon: connectedIcon, colorClass: styles.textConnected };
            case 'connecting':
                return { text: 'Connecting...', icon: notStableIcon, colorClass: styles.textConnecting };
            case 'disconnected':
            default:
                return { text: 'System Outage', icon: notConnectedIcon, colorClass: styles.textDisconnected };
        }
    };

    const statusConfig = getStatusConfig();

    return (
        <footer className={styles.footer}>
            <div className={styles.leftSection}>
                <div className={styles.statusGroup}>
                    <span className={`${styles.dot} ${statusConfig.colorClass}`}></span>
                    <span className={`${styles.statusText} ${statusConfig.colorClass}`}>{statusConfig.text}</span>
                    <img src={statusConfig.icon} alt={statusConfig.text} className={styles.statusIcon} />
                </div>
                <div className={styles.divider} />
                <a href="#" className={styles.link}>Help &amp; Support</a>
                <div className={styles.divider} />
                <GlobalChat />
                <div className={styles.divider} />
                <span className={styles.infoText}>
                    This site is operated by Osmo Ops subDAO, utilizing software open sourced by Osmo Trading Inc. <a href="#" className={styles.learnMore}>Learn more</a>
                </span>
            </div>

            <div className={styles.rightSection}>
                <div className={styles.divider} />
                <a href="#" className={styles.socialLink} aria-label="Discord">
                    <img src={discordIcon} alt="Discord" />
                </a>
                <div className={styles.divider} />
                <a href="#" className={styles.socialLink} aria-label="Telegram">
                    <img src={telegramIcon} alt="Telegram" />
                </a>
                <div className={styles.divider} />
                <a href="#" className={styles.socialLink} aria-label="X (Twitter)">
                    <img src={xIcon} alt="X (Twitter)" />
                </a>
            </div>
        </footer>
    );
};

export default Footer;
