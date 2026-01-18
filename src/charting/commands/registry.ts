
import type { CommandExecutor } from './types';
import { NavHandler } from './handlers/nav';
import { InputHandler } from './handlers/input';
import { DrawingHandler } from './handlers/drawing';

/**
 * Registry to map action names to handlers.
 * Refactored to stateless function to avoid Singleton/HMR issues.
 */

const HANDLER_MAP_V3: Record<string, CommandExecutor> = {
    // Navigation
    'pan': NavHandler,
    'zoom': NavHandler,
    'reset_view': NavHandler,
    'focus_latest': NavHandler,
    'set_symbol': NavHandler,

    // Input & Awareness
    'press_key': InputHandler,
    'mouse_move': InputHandler,
    'mouse_press': InputHandler,
    'inspect_cursor': InputHandler,
    'capture_moment': InputHandler,

    // Canvas & Advanced
    'hover_candle': InputHandler,
    'get_canvas': InputHandler,
    'get_box': InputHandler,
    'get_screenshot': InputHandler,

    // Drawing
    'draw_shape': DrawingHandler,
    'clear_drawings': DrawingHandler,
    'update_drawing': DrawingHandler
};

export class CommandRegistry {
    // Legacy support for instance methods if needed, 
    // but better to use static or direct export

    get(action: string): CommandExecutor | undefined {
        const handler = HANDLER_MAP_V3[action];
        console.log(`[CommandRegistry V3] Lookup '${action}': ${handler ? 'Found' : 'NOT FOUND'}`);
        return handler;
    }

    register(action: string, handler: CommandExecutor) {
        HANDLER_MAP_V3[action] = handler;
    }
}

export const commandRegistry = new CommandRegistry();
// HMR Force Update Trigger
