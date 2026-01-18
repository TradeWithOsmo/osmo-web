
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
                default:
                    console.warn(`[NavHandler] Unknown action: ${action}`);
            }
        } catch (e) {
            console.error(`[NavHandler] Error executing ${action}:`, e);
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
        try {
            chart.setSymbol(symbol, () => {
                console.log(`[NavHandler] Symbol successfully set to ${symbol}`);
            });
        } catch (e) {
            console.error(`[NavHandler] Failed to set symbol: ${e}`);
        }
    }
};
