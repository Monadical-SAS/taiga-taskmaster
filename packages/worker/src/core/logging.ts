import type { Logger } from './types.js';

export const createStructuredLogger = (level: 'debug' | 'info' | 'warn' | 'error' = 'info'): Logger => {
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
        console.debug(`[DEBUG] ${message}`, ...args);
      }
    },
    
    info(message: string, ...args: unknown[]) {
      if (shouldLog('info')) {
        console.info(`[INFO] ${message}`, ...args);
      }
    },
    
    warn(message: string, ...args: unknown[]) {
      if (shouldLog('warn')) {
        console.warn(`[WARN] ${message}`, ...args);
      }
    },
    
    error(message: string, ...args: unknown[]) {
      if (shouldLog('error')) {
        console.error(`[ERROR] ${message}`, ...args);
      }
    }
  };
};