
import type { CommandExecutor } from '../types';

// Global Map to track Custom Tags -> TradingView Entity IDs
// e.g. "stop_loss_1" -> "754IFm"
const ID_MAP = new Map<string, string>();

declare global {
    interface Window {
        __tvDrawingTags?: string[];
    }
}

const _publishDrawingTags = () => {
    try {
        window.__tvDrawingTags = Array.from(ID_MAP.keys());
    } catch {
        // ignore
    }
};

export const DrawingHandler: CommandExecutor = {
    execute: async (chart: any, params: any) => {
        const action = params.action_type || params.action;

        if (action === 'clear_drawings') {
            console.log("[DrawingHandler] Clearing all drawings...");
            chart.removeAllShapes();
            ID_MAP.clear();
            _publishDrawingTags();
            return;
        }

        // Helper to resolve points
        const resolvePoint = (pt: any) => {
            if (!pt) return null;
            if (typeof pt.time === 'undefined' || typeof pt.price === 'undefined') {
                return null;
            }
            return { time: Number(pt.time), price: Number(pt.price) };
        };

        if (action === 'draw_shape') {
            const { type, style, text, id } = params;
            const styleObj = style || {};

            // Normalize Points
            let rawPoints = params.points || [];
            if (rawPoints.length === 0) {
                if (params.start) rawPoints.push(params.start);
                if (params.end) rawPoints.push(params.end);
                if (params.point) rawPoints.push(params.point);
            }

            const points = rawPoints.map(resolvePoint).filter((p: any) => p !== null);

            if (points.length === 0) {
                throw new Error(`[DrawingHandler] No valid points for shape: ${String(type || '')}`);
            }

            // Tool Map
            const TOOL_MAP: Record<string, string> = {
                'line': 'trend_line', 'trend_line': 'trend_line', 'arrow': 'arrow', 'ray': 'ray',
                'extended': 'extended', 'horizontal_line': 'horizontal_line', 'vertical_line': 'vertical_line',
                'parallel_channel': 'parallel_channel',
                'fib_retracement': 'fib_retracement', 'fib_trend_ext': 'fib_trend_ext',
                'pitchfork': 'pitchfork', 'gann_box': 'gann_box',
                'head_and_shoulders': 'head_and_shoulders', 'triangle_pattern': 'triangle_pattern',
                'elliott_impulse_wave': 'elliott_impulse_wave',
                'long_position': 'long_position', 'short_position': 'short_position',
                'price_range': 'price_range', 'date_range': 'date_range', 'prediction': 'prediction',
                'rect': 'rectangle', 'rectangle': 'rectangle', 'circle': 'circle', 'ellipse': 'ellipse',
                'text': 'text', 'icon': 'icon', 'arrow_up': 'arrow_up', 'arrow_down': 'arrow_down',
                'callout': 'balloon', 'balloon': 'balloon', 'note': 'note'
            };

            const shapeType = TOOL_MAP[type] || type;

            // Style Overrides
            let overrides = { ...styleObj };
            if (text) overrides.text = text;

            // Specific Fixes
            if (['rectangle', 'circle', 'ellipse', 'triangle_pattern'].includes(shapeType)) {
                overrides.filled = true;
                if (styleObj.backgroundColor || styleObj.fillColor) {
                    const c = styleObj.backgroundColor || styleObj.fillColor;
                    overrides.backgroundColor = c;
                    overrides.fillColor = c;
                }
            }

            const mainColor = styleObj.color || styleObj.borderColor || styleObj.lineColor || '#2962FF';
            overrides.color = mainColor;
            overrides.linecolor = mainColor;

            if (styleObj.width || styleObj.lineWidth || styleObj.borderWidth) {
                overrides.linewidth = styleObj.width || styleObj.lineWidth || styleObj.borderWidth;
            }

            try {
                // If ID is provided and already exists, remove old one first (Replace behavior)
                if (id && ID_MAP.has(id)) {
                    const oldEntity = ID_MAP.get(id);
                    // Check if it exists? TV API removeShape takes ID
                    try { chart.removeEntity(oldEntity); } catch (e) { }
                }

                const entityId = chart.createMultipointShape(points, {
                    shape: shapeType,
                    overrides: overrides,
                    lock: false,
                    disableSelection: false
                });
                if (!entityId) {
                    throw new Error(`[DrawingHandler] createMultipointShape returned empty entityId for ${shapeType}`);
                }

                if (id) {
                    ID_MAP.set(id, entityId);
                    console.log(`[DrawingHandler] Registered Tag '${id}' -> Entity '${entityId}'`);
                    _publishDrawingTags();
                } else {
                    console.log(`[DrawingHandler] Created Untagged Entity '${entityId}'`);
                }

            } catch (e) {
                console.error(`[DrawingHandler] Error creating ${shapeType}:`, e);
                throw e;
            }
            return;
        }

        if (action === 'update_drawing') {
            const { id, points, style, text } = params;
            if (!id) {
                throw new Error("[DrawingHandler] Update requires 'id'");
            }

            const entityId = ID_MAP.get(id);
            if (!entityId) {
                throw new Error(`[DrawingHandler] Tag '${id}' not found in registry.`);
            }

            console.log(`[DrawingHandler] Updating '${id}' (${entityId})`);

            try {
                // Get Shape Object
                const shape = chart.getShapeById(entityId);
                if (!shape) {
                    console.warn(`[DrawingHandler] Entity '${entityId}' no longer valid in chart.`);
                    ID_MAP.delete(id);
                    throw new Error(`[DrawingHandler] Entity '${entityId}' no longer valid in chart.`);
                }

                // Update Points
                if (points && points.length > 0) {
                    const resolvedPoints = points.map(resolvePoint).filter((p: any) => p !== null);
                    if (resolvedPoints.length > 0) {
                        shape.setPoints(resolvedPoints);
                    }
                }

                // Update Properties
                if (style || text) {
                    let props = { ...style };

                    // Remap standard props to internal overrides
                    if (style?.backgroundColor || style?.fillColor) {
                        const c = style.backgroundColor || style.fillColor;
                        props.backgroundColor = c;
                        props.fillColor = c;
                    }
                    if (style?.color || style?.borderColor || style?.lineColor) {
                        const c = style.color || style.borderColor || style.lineColor;
                        props.color = c;
                        props.linecolor = c;
                    }
                    if (style?.width || style?.lineWidth) {
                        props.linewidth = style.width || style.lineWidth;
                    }

                    if (text) props.text = text;

                    shape.setProperties(props);
                }

                console.log(`[DrawingHandler] Update Success for '${id}'`);
                _publishDrawingTags();

            } catch (e) {
                console.error(`[DrawingHandler] Update Failed for '${id}':`, e);
                throw e;
            }
            return;
        }
    }
};
