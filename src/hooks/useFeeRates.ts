import { useState, useEffect } from 'react';
import { onchainService } from '../api/onchainService';

export interface FeeRates {
    /** Trading fee in basis points (e.g. 8 = 0.08%) */
    tradingFeeBps: number;
    /** Cashback rate on trading fees in bps (e.g. 300 = 3%) */
    tradingRewardBps: number;
    /** AI usage fee in bps (e.g. 25 = 0.25%) */
    aiFeeBps: number;
    /** Cashback rate on AI fees in bps (e.g. 500 = 5%) */
    aiRewardBps: number;
    /** Trading fee as a percentage string, e.g. "0.08%" */
    tradingFeeDisplay: string;
    /** Cashback percentage string, e.g. "3%" */
    tradingRewardDisplay: string;
}

export interface SystemStatus {
    circuitBreakerTripped: boolean;
    paused: boolean;
    /** true while the initial fetch is in progress */
    loading: boolean;
}

const bpsToPercent = (bps: number) => `${(bps / 100).toFixed(bps % 100 === 0 ? 0 : 2)}%`;

/** Fetches live fee rates from FeeManager contract. Refreshes every 5 minutes. */
export function useFeeRates(): FeeRates & { loading: boolean } {
    const [rates, setRates] = useState<FeeRates>({
        tradingFeeBps: 8,
        tradingRewardBps: 300,
        aiFeeBps: 25,
        aiRewardBps: 500,
        tradingFeeDisplay: '0.08%',
        tradingRewardDisplay: '3%',
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const fetch = async () => {
            try {
                const r = await onchainService.getFeeRates();
                if (!mounted) return;
                setRates({
                    ...r,
                    tradingFeeDisplay: bpsToPercent(r.tradingFeeBps),
                    tradingRewardDisplay: bpsToPercent(r.tradingRewardBps),
                });
            } catch { /* keep defaults */ } finally {
                if (mounted) setLoading(false);
            }
        };
        fetch();
        const t = setInterval(fetch, 5 * 60 * 1000); // refresh every 5 min
        return () => { mounted = false; clearInterval(t); };
    }, []);

    return { ...rates, loading };
}

/** Polls SecurityModule for circuit breaker + pause status every 30 seconds. */
export function useSystemStatus(): SystemStatus {
    const [status, setStatus] = useState<SystemStatus>({
        circuitBreakerTripped: false,
        paused: false,
        loading: true,
    });

    useEffect(() => {
        let mounted = true;
        const fetch = async () => {
            try {
                const s = await onchainService.getSystemStatus();
                if (mounted) setStatus({ ...s, loading: false });
            } catch {
                if (mounted) setStatus(prev => ({ ...prev, loading: false }));
            }
        };
        fetch();
        const t = setInterval(fetch, 30_000);
        return () => { mounted = false; clearInterval(t); };
    }, []);

    return status;
}
