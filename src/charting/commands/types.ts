
/**
 * Interface for Command Executors
 */
export interface CommandExecutor {
    execute(chart: any, params: any): Promise<void> | void;
}

/**
 * Common Parameters Base
 */
export type CommandParams = Record<string, any>;
