import React, { useState } from "react";
import styles from "./LimitCloseModal.module.css";
import { useUIStore } from "../../store/useUIStore";

import { useWallet } from "../../hooks/useWallet";
import { orderService } from "../../api/orderService";
import { usePortfolioStore } from "../../store/usePortfolioStore";
import { useMarketStore } from "../../store/useMarketStore";
import toast from "react-hot-toast";

export const LimitCloseModal: React.FC = () => {
  const {
    isLimitCloseModalOpen,
    closeLimitCloseModal,
    selectedPosition: uiPosition,
  } = useUIStore();
  const { positions, refreshAll } = usePortfolioStore();
  const { getPrice } = useMarketStore();
  const { walletAddress } = useWallet() as any;

  const selectedPosition =
    positions.find((p) => p.id === uiPosition?.id) || uiPosition;

  const [percentage, setPercentage] = useState(100);
  const [manualSize, setManualSize] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const markPrice =
    getPrice(selectedPosition?.symbol || "") ||
    (selectedPosition as any)?.markPrice ||
    (selectedPosition as any)?.mark_price ||
    0;

  // Prevent background scrolling
  React.useEffect(() => {
    if (isLimitCloseModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isLimitCloseModalOpen]);

  // Sync manual size when percentage changes
  React.useEffect(() => {
    if (selectedPosition && !isSubmitting) {
      const size = selectedPosition.size * (percentage / 100);
      setManualSize(
        size.toFixed(selectedPosition.symbol.includes("USD") ? 4 : 8),
      );
    }
  }, [percentage, selectedPosition?.size, isSubmitting]);

  if (!isLimitCloseModalOpen || !selectedPosition) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeLimitCloseModal();
    }
  };

  const assetSymbol = selectedPosition.symbol.split("-")[0];

  const handleManualSizeChange = (val: string) => {
    setManualSize(val);
    const num = parseFloat(val);
    if (selectedPosition && !isNaN(num) && selectedPosition.size > 0) {
      const pct = Math.min(
        100,
        Math.max(0, (num / selectedPosition.size) * 100),
      );
      setPercentage(pct);
    }
  };

  const closingSize = parseFloat(manualSize) || 0;

  const formatSize = (val: number) => {
    if (!val && val !== 0) return "0.0000";
    return val.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 8,
    });
  };

  const isFormValid = !!limitPrice && !isNaN(parseFloat(limitPrice)) && parseFloat(limitPrice) > 0;

  const handleConfirm = async () => {
    if (!walletAddress || !selectedPosition) return;
    setIsSubmitting(true);
    try {
      await orderService.closePosition(
        walletAddress,
        selectedPosition.symbol,
        parseFloat(limitPrice),
        percentage / 100,
        (selectedPosition as any)?.exchange,
        true, // is_limit = true for limit close orders
      );

      toast.success("Limit close order placed");
      closeLimitCloseModal();

      // Immediate Refresh
      refreshAll(walletAddress);

      // Sequential refreshes
      setTimeout(() => refreshAll(walletAddress), 500);
      setTimeout(() => refreshAll(walletAddress), 2000);
    } catch (error: any) {
      console.error("Close failed", error);
      toast.error(error.message || "Failed to place limit close order");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Limit Close</h2>
          <button className={styles.closeButton} onClick={closeLimitCloseModal}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <div className={styles.content}>
          <p className={styles.subtitle}>
            This will close the position at the specified price.
          </p>

          {/* Size Summary */}
          <div className={styles.row}>
            <span className={styles.label}>Size</span>
            <span className={`${styles.value} ${styles.sizeValue}`}>
              {formatSize(selectedPosition.size)} {assetSymbol}
            </span>
          </div>

          {/* Price Input */}
          <div className={styles.inputContainer}>
            <span className={styles.inputLabel}>Limit Price</span>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                className={styles.numberInput}
                placeholder={markPrice.toString()}
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
              />
              <span className={styles.assetName}>USDC</span>
            </div>
          </div>

          <div className={styles.row}>
            <span className={styles.label}>Mark Price</span>
            <span className={styles.value}>${markPrice.toLocaleString()}</span>
          </div>

          <div className={styles.row}>
            <span className={styles.label}>Close Value</span>
            <span className={styles.value}>
              $
              {(
                closingSize * (parseFloat(limitPrice) || markPrice)
              ).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>

          {/* Size Input Area */}
          <div className={styles.inputContainer}>
            <span className={styles.inputLabel}>Amount</span>
            <div className={styles.inputWrapper}>
              <input
                type="number"
                className={styles.numberInput}
                value={manualSize}
                onChange={(e) => handleManualSizeChange(e.target.value)}
              />
              <span className={styles.assetName}>{assetSymbol}</span>
            </div>
          </div>

          {/* Slider Section */}
          <div className={styles.sliderSection}>
            <div className={styles.sliderContainer}>
              <div className={styles.sliderTrack} />
              <div
                className={styles.sliderProgress}
                style={{ width: `${percentage}%` }}
              />
              {[0, 25, 50, 75, 100].map((dot) => (
                <div
                  key={dot}
                  className={styles.sliderDot}
                  style={{ left: `${dot}%`, zIndex: 4, cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPercentage(dot);
                  }}
                />
              ))}
              <input
                type="range"
                min="0"
                max="100"
                value={percentage}
                onChange={(e) => setPercentage(parseInt(e.target.value))}
                style={{
                  position: "absolute",
                  width: "100%",
                  opacity: 0,
                  cursor: "pointer",
                  zIndex: 3,
                }}
              />
              <div
                className={styles.sliderThumb}
                style={{ left: `${percentage}%` }}
              />
          </div>
          <div className={styles.percentageBox}>{percentage} %</div>
        </div>

        <button
          type="button"
          className={styles.confirmButton}
          onClick={handleConfirm}
          disabled={!isFormValid || isSubmitting}
        >
          {isSubmitting ? "Placing..." : "Limit Close"}
        </button>
      </div>
    </div>
  </div>
);
};
