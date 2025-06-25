import type { Logger } from './types.js';

// Console interface for dependency injection
export interface ConsoleInterface {
  readonly debug: (message?: unknown, ...optionalParams: unknown[]) => void;
  readonly info: (message?: unknown, ...optionalParams: unknown[]) => void;
  readonly warn: (message?: unknown, ...optionalParams: unknown[]) => void;
  readonly error: (message?: unknown, ...optionalParams: unknown[]) => void;
}

export const createStructuredLogger = (
  level: 'debug' | 'info' | 'warn' | 'error' = 'info',
  consoleInterface: ConsoleInterface = console
): Logger => {
  const levels = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };
  
  const shouldLog = (messageLevel: keyof typeof levels) => {
    return levels[messageLevel] >= levels[level];
  };
  
  return {
    debug(message: string, ...args: unknown[]) {
      if (shouldLog('debug')) {
        consoleInterface.debug(`[DEBUG] ${message}`, ...args);
      }
    },
    
    info(message: string, ...args: unknown[]) {
      if (shouldLog('info')) {
        consoleInterface.info(`[INFO] ${message}`, ...args);
      }
    },
    
    warn(message: string, ...args: unknown[]) {
      if (shouldLog('warn')) {
        consoleInterface.warn(`[WARN] ${message}`, ...args);
      }
    },
    
    error(message: string, ...args: unknown[]) {
      if (shouldLog('error')) {
        consoleInterface.error(`[ERROR] ${message}`, ...args);
      }
    }
  };
};