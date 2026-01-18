
import type { CommandExecutor } from '../types';

export const InputHandler: CommandExecutor = {
    execute: async (_chart: any, params: any) => {
        const action = params.action_type || 'simulate';

        // Note: Direct input simulation on Canvas is limited in browser sandbox.
        // We dispatch events to the document or canvas element if possible.
        // For now, we dispatch to document.

        if (action === 'press_key') {
            const { key } = params;
            console.log(`[InputHandler] Simulating KeyPress: ${key}`);

            const eventDown = new KeyboardEvent('keydown', { key: key, code: key, bubbles: true });
            document.dispatchEvent(eventDown);

            setTimeout(() => {
                const eventUp = new KeyboardEvent('keyup', { key: key, code: key, bubbles: true });
                document.dispatchEvent(eventUp);
            }, 100);
        } else if (action === 'mouse_move') {
            // Visual Only - Cannot move OS cursor
            console.log(`[InputHandler] Mouse Move simulation request (Visual Only) to ${params.x}, ${params.y}`);
        } else if (action === 'hover_candle') {
            const { x_from_right, y_price } = params;
            console.log(`[InputHandler] Hover Candle: ${x_from_right} bars from right, price: ${y_price}`);
        } else if (action === 'get_box' || action === 'get_canvas') {
            const selector = params.selector;

            // Try selector first
            let el = document.querySelector(selector);

            // Fallback: Find specific TV canvas if not found
            if (!el) {
                // TradingView often has multiple canvases. The main chart usually is the second one or has specific class.
                // Or simply grab the first canvas in our container `tv_chart_container`
                const container = document.getElementById('tv_chart_container');
                if (container) {
                    el = container.querySelector('canvas');
                    if (!el) {
                        // Maybe inside an iframe? If so, we can't access easily.
                        // Check if there are iframes
                        const frames = container.getElementsByTagName('iframe');
                        if (frames.length > 0) console.warn("[InputHandler] Chart seems to be in an IFRAME. Canvas access restricted.");
                    }
                }
            }

            // Fallback 2: Any canvas on page
            if (!el) {
                const allCanvas = document.querySelectorAll('canvas');
                if (allCanvas.length > 0) el = allCanvas[0];
            }

            // Fallback 3: Container or Iframe (If canvas is hidden/cross-origin)
            if (!el) {
                const container = document.getElementById('tv_chart_container');
                if (container) {
                    // Try to find an iframe inside
                    const iframe = container.querySelector('iframe');
                    el = iframe || container;
                    console.log(`[InputHandler] Canvas unusable. Falling back to ${el.tagName} for box coordinates.`);
                }
            }

            if (el) {
                const rect = el.getBoundingClientRect();
                console.log(`[InputHandler] ${action} Result (Found via ${el.tagName}#${el.id}.${el.className}):`, rect);

                if (action === 'get_screenshot') {
                    console.log("[InputHandler] SCREENSHOT INFO: Use the above coordinates with your OS-level screenshot tool. Canvas data access is restricted due to Iframe security.");
                }
            } else {
                console.warn(`[InputHandler] Element NOT found via selector '${selector}' or fallbacks.`);
            }
        }
    }
};
