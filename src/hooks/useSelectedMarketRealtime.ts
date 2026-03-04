import { useEffect, useRef } from 'react';
import { marketService } from '../api/marketService';
import { useMarketStore } from '../store/useMarketStore';

const POLL_INTERVAL_MS = 2000;

const normalizeSymbol = (value: string): string =>
  String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[\/_]/g, '-')
    .replace(/\s+/g, '')
    .replace(/-+/g, '-');

export const useSelectedMarketRealtime = () => {
  const selectedMarket = useMarketStore((s) => s.selectedMarket);
  const updateMarketDataBySource = useMarketStore((s) => s.updateMarketDataBySource);
  const timerRef = useRef<number | null>(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (!selectedMarket?.symbol || !selectedMarket?.source) return;

    const source = String(selectedMarket.source || '').toLowerCase();
    const symbol = selectedMarket.symbol;

    // Hyperliquid already has dedicated global WS stream.
    if (source === 'hyperliquid') return;

    let cancelled = false;

    const tick = async () => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      try {
        const list = await marketService.getMarketsByExchange(source);
        if (cancelled) return;

        const target = list.find(
          (m) =>
            String(m.source || '').toLowerCase() === source &&
            normalizeSymbol(m.symbol) === normalizeSymbol(symbol)
        );
        if (!target) return;

        updateMarketDataBySource(symbol, source, {
          price: target.price,
          change24h: target.change24h,
          change24hPercent: target.change24hPercent,
          high24h: target.high24h,
          low24h: target.low24h,
          volume24h: target.volume24h,
          fundingRate: target.fundingRate,
          openInterest: target.openInterest,
          maxLeverage: target.maxLeverage,
          category: target.category,
          subCategory: target.subCategory,
          canonical: target.canonical,
        });
      } catch {
        // best effort polling
      } finally {
        inFlightRef.current = false;
      }
    };

    tick();
    timerRef.current = window.setInterval(tick, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [selectedMarket?.symbol, selectedMarket?.source, updateMarketDataBySource]);
};
