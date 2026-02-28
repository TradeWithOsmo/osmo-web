import React, { useState } from "react";
import styles from "./PositionsPanel.module.css";
import { useUIStore } from "../../store/useUIStore";
import { useMarketStore } from "../../store/useMarketStore";
import TokenIcon from "../MarketDetails/TokenIcon";
import OstiumIcon from "../MarketDetails/OstiumIcon";

export interface PositionData {
  id: string;
  symbol: string;
  pair: string;
  exchange?: string;
  side: "Long" | "Short";
  size: number;
  sizeUsd: number;
  leverage: string;
  entryPrice: number;
  markPrice: number;
  liquidationPrice: number | null;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  margin: number;
  funding: number;
  tp?: number | string;
  sl?: number | string;
}

interface PositionRowProps {
  position: PositionData;
}

const safeNumber = (value: unknown, fallback = 0): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const formatUsd = (val: number) =>
  safeNumber(val).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatCrypto = (val: number) =>
  safeNumber(val).toLocaleString(undefined, {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });

const PositionRow: React.FC<PositionRowProps> = ({ position }) => {
  const { openReverseModal, openMarketCloseModal, openTPSLModal, openLimitCloseModal } = useUIStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const symbol = String(position.symbol || "").trim() || "UNKNOWN";
  const isLong = position.side === "Long";
  const canManagePosition = Boolean(position.id && symbol !== "UNKNOWN");

  const entryPrice = safeNumber(position.entryPrice, 0);
  const markPrice = safeNumber(position.markPrice, entryPrice);
  const size = safeNumber(position.size, 0);
  const sizeUsd = safeNumber(position.sizeUsd, 0);
  const liqPrice = position.liquidationPrice === null ? null : safeNumber(position.liquidationPrice, 0);
  const pnl = safeNumber(position.unrealizedPnl, 0);
  const pnlPercent = safeNumber(position.unrealizedPnlPercent, 0);
  const margin = safeNumber(position.margin, 0);

  const markets = useMarketStore((state) => state.markets);
  const marketMeta = markets.find((m) => m.symbol === symbol);
  const isOstiumSymbol = marketMeta?.source === "ostium" || String(position.exchange || "").toLowerCase() === "ostium";

  const pnlColor = pnl >= 0 ? styles.positive : styles.negative;
  const roiColor = pnlPercent >= 0 ? styles.positive : styles.negative;
  const pnlText = `${pnl >= 0 ? "" : "-"}$${Math.abs(pnl).toFixed(2)}`;
  const roiText = `(${pnlPercent.toFixed(2)}%)`;

  const handleLimitClick = () => {
    if (!canManagePosition) return;
    openLimitCloseModal(position);
  };

  const handleMarketClick = () => {
    if (!canManagePosition) return;
    openMarketCloseModal(position);
  };

  const handleReverseClick = () => {
    if (!canManagePosition) return;
    openReverseModal(position);
  };

  const handleEditTpsl = () => {
    if (!canManagePosition) return;
    openTPSLModal(position);
  };

  return (
    <>
      <tr className={`${styles.row} ${styles.desktopRow}`}>
        <td className={`${styles.td} ${styles.tdFirst}`}>
          <div className={styles.cellContent} style={{ flexDirection: "row", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
              {isOstiumSymbol ? <OstiumIcon symbol={symbol} size={24} /> : <TokenIcon symbol={symbol} size={24} />}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontWeight: 700, color: "#FFFFFF" }}>{symbol}</span>
              <span
                className={isLong ? styles.positive : styles.negative}
                style={{
                  fontSize: "11px",
                  backgroundColor: isLong ? "rgba(0, 227, 150, 0.1)" : "rgba(255, 69, 96, 0.1)",
                  padding: "2px 4px",
                  borderRadius: "2px",
                }}
              >
                {position.leverage}
              </span>
            </div>
          </div>
        </td>

        <td className={`${styles.td} ${styles.tdRight}`}>
          <span style={{ color: "#FFFFFF" }}>
            {formatCrypto(size)} <span style={{ color: "#A77590", fontSize: "11px" }}>{symbol}</span>
          </span>
        </td>

        <td className={`${styles.td} ${styles.tdRight}`}>
          <span style={{ color: "#FFFFFF" }}>
            {formatUsd(sizeUsd)} <span style={{ color: "#A77590", fontSize: "11px" }}>USDC</span>
          </span>
        </td>

        <td className={`${styles.td} ${styles.tdRight}`}>
          <span>{entryPrice.toLocaleString()}</span>
        </td>

        <td className={`${styles.td} ${styles.tdRight}`}>
          <span>{markPrice.toLocaleString()}</span>
        </td>

        <td className={`${styles.td} ${styles.tdRight}`}>
          <div className={styles.cellContent} style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
            <span className={pnlColor}>{pnlText}</span>
            <span className={roiColor}>{roiText}</span>
            <span className={styles.shareIcon}>*</span>
          </div>
        </td>

        <td className={`${styles.td} ${styles.tdRight}`}>
          <span>{liqPrice ? liqPrice.toLocaleString() : "N/A"}</span>
        </td>

        <td className={`${styles.td} ${styles.tdRight}`}>
          <span>
            ${formatUsd(margin)} <span style={{ color: "#A77590", fontSize: "11px" }}>(Cross)</span>
          </span>
        </td>

        <td className={styles.td}>
          <div className={styles.actionGroup}>
            <button className={styles.actionButton} onClick={handleLimitClick} disabled={!canManagePosition}>Limit</button>
            <button className={styles.actionButton} onClick={handleMarketClick} disabled={!canManagePosition}>Market</button>
            <button className={styles.actionButton} onClick={handleReverseClick} disabled={!canManagePosition}>Reverse</button>
          </div>
        </td>

        <td className={`${styles.td} ${styles.tdRight}`}>
          <div className={styles.actionGroup} style={{ justifyContent: "flex-end" }}>
            <span style={{ fontSize: "12px" }}>
              {position.tp && position.sl
                ? `${position.tp} / ${position.sl}`
                : position.tp
                ? `${position.tp} / --`
                : position.sl
                ? `-- / ${position.sl}`
                : "-- / --"}
            </span>
            <button className={styles.editButton} onClick={handleEditTpsl} disabled={!canManagePosition}>Edit</button>
          </div>
        </td>
      </tr>

      <tr className={`${styles.row} ${styles.mobileRow}`}>
        <td className={styles.td} colSpan={100}>
          <div className={styles.mobileCard}>
            <div className={styles.mobileHeader} onClick={() => setIsExpanded((v) => !v)}>
              <div className={styles.mobileHeaderContent}>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span style={{ fontSize: "12px", color: "#A77590" }}>Coin</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontWeight: 700, color: "#FFFFFF", fontSize: "14px" }}>{symbol}</span>
                    <span
                      className={isLong ? styles.positive : styles.negative}
                      style={{
                        fontSize: "10px",
                        backgroundColor: isLong ? "rgba(0, 227, 150, 0.1)" : "rgba(255, 69, 96, 0.1)",
                        padding: "2px 4px",
                        borderRadius: "2px",
                      }}
                    >
                      {position.leverage}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span style={{ fontSize: "12px", color: "#A77590" }}>Size</span>
                  <span style={{ color: "#00E396", fontSize: "13px" }}>{formatCrypto(size)} {symbol}</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span style={{ fontSize: "12px", color: "#A77590" }}>PNL (ROE %)</span>
                  <div style={{ display: "flex", flexDirection: "column", lineHeight: "1.2" }}>
                    <span className={pnlColor} style={{ fontSize: "13px" }}>{pnlText}</span>
                    <span className={roiColor} style={{ fontSize: "11px" }}>{roiText} <span className={styles.shareIcon} style={{ fontSize: "10px" }}>*</span></span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", color: "#A77590" }}>
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            {isExpanded && (
              <div className={styles.mobileDetails}>
                <div className={styles.mobileDetailRow}><span className={styles.mobileLabel}>Entry Price</span><span className={styles.mobileValue}>{entryPrice.toLocaleString()}</span></div>
                <div className={styles.mobileDetailRow}><span className={styles.mobileLabel}>Mark Price</span><span className={styles.mobileValue}>{markPrice.toLocaleString()}</span></div>
                <div className={styles.mobileDetailRow}><span className={styles.mobileLabel}>Liq. Price</span><span className={styles.mobileValue}>{liqPrice ? liqPrice.toLocaleString() : "N/A"}</span></div>
                <div className={styles.mobileDetailRow}><span className={styles.mobileLabel}>Position Value</span><span className={styles.mobileValue}>{formatUsd(sizeUsd)} USDC</span></div>
                <div className={styles.mobileDetailRow}><span className={styles.mobileLabel}>Margin</span><span className={styles.mobileValue}>${formatUsd(margin)} (Cross)</span></div>
                <div className={styles.mobileDetailRow}>
                  <span className={styles.mobileLabel}>TP/SL</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className={styles.mobileValue}>
                      {position.tp && position.sl
                        ? `${position.tp} / ${position.sl}`
                        : position.tp
                        ? `${position.tp} / --`
                        : position.sl
                        ? `-- / ${position.sl}`
                        : "-- / --"}
                    </span>
                    <button className={styles.editButton} onClick={handleEditTpsl} disabled={!canManagePosition}>Edit</button>
                  </div>
                </div>
                <div className={styles.mobileDetailRow} style={{ borderBottom: "none", paddingTop: "16px", justifyContent: "flex-start", gap: "16px" }}>
                  <button className={styles.actionButton} style={{ fontSize: "13px", border: "1px solid #2E93fF", padding: "4px 12px", borderRadius: "4px" }} onClick={handleLimitClick} disabled={!canManagePosition}>Limit</button>
                  <button className={styles.actionButton} style={{ fontSize: "13px", border: "1px solid #2E93fF", padding: "4px 12px", borderRadius: "4px" }} onClick={handleMarketClick} disabled={!canManagePosition}>Market</button>
                  <button className={styles.actionButton} style={{ fontSize: "13px", border: "1px solid #2E93fF", padding: "4px 12px", borderRadius: "4px" }} onClick={handleReverseClick} disabled={!canManagePosition}>Reverse</button>
                </div>
              </div>
            )}
          </div>
        </td>
      </tr>
    </>
  );
};

export default PositionRow;
