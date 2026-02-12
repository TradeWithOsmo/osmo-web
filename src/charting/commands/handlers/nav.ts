
import type { CommandExecutor } from '../types';

export const NavHandler: CommandExecutor = {
    execute: async (chart: any, params: any) => {
        const action = params.action_type || 'pan'; // pan, zoom, reset

        console.log(`[NavHandler] Executing ${action}`, params);

        if (!chart) {
            console.error("[NavHandler] No chart instance available");
            return;
        }

        try {
            switch (action) {
                case 'focus_chart':
                    await handleFocusChart(chart);
                    break;
                case 'ensure_mode':
                    await handleEnsureMode(params);
                    break;
                case 'pan':
                    await handlePan(chart, params);
                    break;
                case 'zoom':
                    await handleZoom(chart, params);
                    break;
                case 'reset_view':
                case 'reset':
                    await handleReset(chart);
                    break;
                case 'focus_latest':
                    await handleFocusLatest(chart);
                    break;
                case 'set_symbol':
                    await handleSetSymbol(chart, params);
                    break;
                case 'set_timeframe':
                    await handleSetTimeframe(chart, params);
                    break;
                case 'set_crosshair':
                    await handleSetCrosshair(params);
                    break;
                case 'move_crosshair':
                    await handleMoveCrosshair(chart, params);
                    break;
                default:
                    console.warn(`[NavHandler] Unknown action: ${action}`);
            }
        } catch (e) {
            console.error(`[NavHandler] Error executing ${action}:`, e);
            throw e;
        }
    }
};

const handlePan = async (chart: any, params: any) => {
    const { axis, direction, amount } = params;

    // We mainly handle 'time' axis for panning via setVisibleRange
    if (axis === 'time' || !axis) {
        const range = chart.getVisibleRange();
        const duration = range.to - range.from;

        let multiplier = 0.1; // default medium (10%)
        if (amount === 'small') multiplier = 0.05;
        if (amount === 'large') multiplier = 0.3;
        if (typeof amount === 'number') multiplier = amount;

        const delta = duration * multiplier;

        let newFrom = range.from;
        let newTo = range.to;

        if (direction === 'left') {
            // Move view to left (into past) -> subtract delta
            newFrom -= delta;
            newTo -= delta;
        } else if (direction === 'right') {
            // Move view to right (into future) -> add delta
            newFrom += delta;
            newTo += delta;
        }

        chart.setVisibleRange({ from: newFrom, to: newTo });
    }
    // Price axis panning usually requires chart properties or mouse drag simulation, 
    // which is harder via public API. We'll skip price axis for now or map it to scroll if possible.
};

const handleZoom = async (chart: any, params: any) => {
    const { mode, amount } = params;
    const range = chart.getVisibleRange();
    const duration = range.to - range.from;
    const center = range.from + (duration / 2);

    if (mode === 'in') {
        // Shrink range (keep center)
        let percent = 0.2; // default 20%
        if (amount === 'small') percent = 0.1;
        if (amount === 'large') percent = 0.4;
        if (typeof amount === 'number') percent = amount;

        const newDuration = duration * (1 - percent);
        const half = newDuration / 2;
        chart.setVisibleRange({ from: center - half, to: center + half });

    } else if (mode === 'out') {
        // Expand range
        let percent = 0.2;
        if (amount === 'small') percent = 0.1;
        if (amount === 'large') percent = 0.4;
        if (typeof amount === 'number') percent = amount;

        const newDuration = duration * (1 + percent);
        const half = newDuration / 2;
        chart.setVisibleRange({ from: center - half, to: center + half });

    } else if (mode === 'range') {
        // Set specific range (last N bars)
        // This is tricky without knowing bar width in time. 
        // We can approximate or use setResolution if strictly needed, but changing resolution is different.
        // For now, let's just log implementation gap.
        console.warn("[NavHandler] Zoom Range not fully implemented without bar/time conversion");
    } else if (mode === 'auto' || mode === 'fit') {
        chart.executeActionById('chartReset'); // Often resets zoom
    }
};

const handleReset = async (chart: any) => {
    chart.executeActionById('chartReset');
};

const handleFocusLatest = async (chart: any) => {
    // Scroll to most recent
    chart.executeActionById('chartGotoLastBar'); // Potential action
    // Or just set wide range ending at now
    // const now = Date.now() / 1000;
    // const range = chart.getVisibleRange();
    // const duration = range.to - range.from;
    // chart.setVisibleRange({ from: now - duration, to: now });
};

const handleSetSymbol = async (chart: any, params: any) => {
    const { symbol } = params;
    if (symbol) {
        console.log(`[NavHandler] Switching symbol to: ${symbol}`);
        await new Promise<void>((resolve, reject) => {
            let finished = false;
            const timer = setTimeout(() => {
                if (!finished) {
                    finished = true;
                    reject(new Error(`setSymbol timeout for ${symbol}`));
                }
            }, 7000);
            try {
                chart.setSymbol(symbol, () => {
                    if (finished) return;
                    finished = true;
                    clearTimeout(timer);
                    console.log(`[NavHandler] Symbol successfully set to ${symbol}`);
                    resolve();
                });
            } catch (e) {
                if (finished) return;
                finished = true;
                clearTimeout(timer);
                reject(e as Error);
            }
        });
    }
};

const normalizeResolution = (value: any): string => {
    const raw = String(value || '').trim().toUpperCase();
    if (!raw) return '';
    const mapping: Record<string, string> = {
        '1M': '1',
        '3M': '3',
        '5M': '5',
        '15M': '15',
        '30M': '30',
        '45M': '45',
        '1H': '60',
        '2H': '120',
        '3H': '180',
        '4H': '240',
        '6H': '360',
        '8H': '480',
        '12H': '720',
        '1D': 'D',
        '1W': 'W',
    };
    return mapping[raw] || raw;
};

const handleSetTimeframe = async (chart: any, params: any) => {
    const rawTf = params?.timeframe;
    const tf = normalizeResolution(rawTf);
    if (!tf) {
        throw new Error('Missing timeframe param');
    }
    await new Promise<void>((resolve, reject) => {
        let finished = false;
        const timer = setTimeout(() => {
            if (!finished) {
                finished = true;
                reject(new Error(`setResolution timeout for ${rawTf}`));
            }
        }, 7000);
        try {
            chart.setResolution(tf, () => {
                if (finished) return;
                finished = true;
                clearTimeout(timer);
                resolve();
            });
        } catch (e) {
            if (finished) return;
            finished = true;
            clearTimeout(timer);
            reject(e as Error);
        }
    });
};

const handleFocusChart = async (chart: any) => {
    try {
        const container = document.getElementById('tv_chart_container') as HTMLElement | null;
        if (container) {
            container.focus?.();
            container.click?.();
            return;
        }
    } catch (e) {
        console.warn('[NavHandler] focus_chart fallback failed:', e);
    }
    // Fallback no-op; command considered processed.
    void chart;
};

const handleEnsureMode = async (params: any) => {
    const mode = String(params?.mode || '').toLowerCase();
    if (mode === 'nav') {
        // Escape commonly exits draw/edit mode in TradingView.
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
        document.dispatchEvent(new KeyboardEvent('keyup', { key: 'Escape', code: 'Escape', bubbles: true }));
    }
};

const handleSetCrosshair = async (params: any) => {
    // TradingView public API for toggling crosshair is limited in embedded mode.
    // Keep as a graceful no-op to avoid unknown-action failures from backend nav tools.
    void params;
};

const handleMoveCrosshair = async (chart: any, params: any) => {
    // Fallback behavior: approximate as a tiny pan.
    const axis = String(params?.axis || 'time').toLowerCase();
    const direction = String(params?.direction || 'right').toLowerCase();
    const amount = params?.amount || 'small';
    if (axis === 'time') {
        await handlePan(chart, { axis: 'time', direction: direction === 'left' ? 'left' : 'right', amount });
        return;
    }
    // No-op for price-axis crosshair moves in embedded mode.
};
