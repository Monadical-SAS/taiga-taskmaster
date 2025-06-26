import * as fs from 'fs/promises';
import * as path from 'path';

export interface LogEntry {
  readonly timestamp: string;
  readonly level: 'log' | 'error' | 'warn' | 'info' | 'debug';
  readonly message: string;
  readonly args: readonly unknown[];
  readonly source: 'console' | 'tui' | 'worker' | 'git';
}

export class FileLogger {
  private logFile: string;
  private originalConsole: {
    readonly log: typeof console.log;
    readonly error: typeof console.error;
    readonly warn: typeof console.warn;
    readonly info: typeof console.info;
    readonly debug: typeof console.debug;
  };
  private isSetup = false;

  constructor(logFile: string) {
    this.logFile = logFile;
    this.originalConsole = {
      log: console.log.bind(console),
      error: console.error.bind(console),
      warn: console.warn.bind(console),
      info: console.info.bind(console),
      debug: console.debug.bind(console),
    };
  }

  async setup(): Promise<void> {
    if (this.isSetup) return;

    // Ensure log directory exists
    const logDir = path.dirname(this.logFile);
    await fs.mkdir(logDir, { recursive: true });

    // Write startup marker
    await this.writeLogEntry({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Logger initialized',
      args: [`Log file: ${this.logFile}`],
      source: 'console',
    });

    // Intercept console methods
    this.interceptConsole();
    this.isSetup = true;
  }

  private interceptConsole(): void {
    const logLevels: Array<keyof Console> = ['log', 'error', 'warn', 'info', 'debug'];

    logLevels.forEach((level) => {
      (console as any)[level] = (...args: unknown[]) => {
        // Call original console method
        (this.originalConsole as any)[level](...args);

        // Write to log file
        this.writeLogEntry({
          timestamp: new Date().toISOString(),
          level: level as LogEntry['level'],
          message: this.formatMessage(args),
          args,
          source: 'console',
        }).catch((error) => {
          // Use original console to avoid infinite recursion
          this.originalConsole.error('Failed to write to log file:', error);
        });
      };
    });
  }

  async writeLogEntry(entry: LogEntry): Promise<void> {
    const logLine = this.formatLogLine(entry);
    await fs.appendFile(this.logFile, logLine + '\n', 'utf8');
  }

  async logFromSource(
    source: LogEntry['source'],
    level: LogEntry['level'],
    message: string,
    ...args: unknown[]
  ): Promise<void> {
    await this.writeLogEntry({
      timestamp: new Date().toISOString(),
      level,
      message,
      args,
      source,
    });
  }

  private formatMessage(args: unknown[]): string {
    return args
      .map((arg) => {
        if (typeof arg === 'string') return arg;
        if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      })
      .join(' ');
  }

  private formatLogLine(entry: LogEntry): string {
    const level = entry.level.toUpperCase().padEnd(5);
    const source = entry.source.toUpperCase().padEnd(7);
    
    // Format: [2024-01-20T10:30:45.123Z] [INFO ] [CONSOLE] Message with args
    let line = `[${entry.timestamp}] [${level}] [${source}] ${entry.message}`;
    
    // Add formatted args if they contain useful additional info
    if (entry.args.length > 0) {
      const argsInfo = entry.args
        .map((arg) => {
          if (typeof arg === 'object' && arg !== null) {
            try {
              return JSON.stringify(arg, null, 2);
            } catch {
              return String(arg);
            }
          }
          return null; // Skip primitive args already in message
        })
        .filter((arg) => arg !== null);
      
      if (argsInfo.length > 0) {
        line += '\n  Args: ' + argsInfo.join(', ');
      }
    }

    return line;
  }

  async rotateLogs(): Promise<void> {
    try {
      const stats = await fs.stat(this.logFile);
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (stats.size > maxSize) {
        const backupFile = `${this.logFile}.backup`;
        await fs.rename(this.logFile, backupFile);
        await this.writeLogEntry({
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'Log rotated',
          args: [`Backup: ${backupFile}`],
          source: 'console',
        });
      }
    } catch (error) {
      // Log rotation is not critical, continue silently
    }
  }

  async cleanup(): Promise<void> {
    if (!this.isSetup) return;

    await this.writeLogEntry({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Logger shutting down',
      args: [],
      source: 'console',
    });

    // Restore original console methods
    Object.assign(console, this.originalConsole);
    this.isSetup = false;
  }

  getLogFilePath(): string {
    return this.logFile;
  }
}

// Singleton logger instance
let globalLogger: FileLogger | null = null;

export const setupGlobalLogger = async (workingDir: string): Promise<FileLogger> => {
  if (globalLogger) {
    return globalLogger;
  }

  const logFile = path.join(workingDir, 'cli.log');
  globalLogger = new FileLogger(logFile);
  await globalLogger.setup();
  
  // Rotate logs on startup if needed
  await globalLogger.rotateLogs();
  
  return globalLogger;
};

export const getGlobalLogger = (): FileLogger | null => {
  return globalLogger;
};

export const cleanupGlobalLogger = async (): Promise<void> => {
  if (globalLogger) {
    await globalLogger.cleanup();
    globalLogger = null;
  }
};