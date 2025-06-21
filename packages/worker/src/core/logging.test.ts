import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createStructuredLogger } from './logging.js';

describe('createStructuredLogger', () => {
  // Mock console methods
  const originalConsole = {
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error
  };

  beforeEach(() => {
    console.debug = vi.fn();
    console.info = vi.fn();
    console.warn = vi.fn();
    console.error = vi.fn();
  });

  afterEach(() => {
    console.debug = originalConsole.debug;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  });

  it('should create a logger with default info level', () => {
    const logger = createStructuredLogger();
    
    logger.debug('debug message');
    logger.info('info message');
    logger.warn('warn message');
    logger.error('error message');

    expect(console.debug).not.toHaveBeenCalled();
    expect(console.info).toHaveBeenCalledWith('[INFO] info message');
    expect(console.warn).toHaveBeenCalledWith('[WARN] warn message');
    expect(console.error).toHaveBeenCalledWith('[ERROR] error message');
  });

  it('should respect debug level', () => {
    const logger = createStructuredLogger('debug');
    
    logger.debug('debug message');
    logger.info('info message');
    logger.warn('warn message');
    logger.error('error message');

    expect(console.debug).toHaveBeenCalledWith('[DEBUG] debug message');
    expect(console.info).toHaveBeenCalledWith('[INFO] info message');
    expect(console.warn).toHaveBeenCalledWith('[WARN] warn message');
    expect(console.error).toHaveBeenCalledWith('[ERROR] error message');
  });

  it('should respect warn level', () => {
    const logger = createStructuredLogger('warn');
    
    logger.debug('debug message');
    logger.info('info message');
    logger.warn('warn message');
    logger.error('error message');

    expect(console.debug).not.toHaveBeenCalled();
    expect(console.info).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith('[WARN] warn message');
    expect(console.error).toHaveBeenCalledWith('[ERROR] error message');
  });

  it('should respect error level', () => {
    const logger = createStructuredLogger('error');
    
    logger.debug('debug message');
    logger.info('info message');
    logger.warn('warn message');
    logger.error('error message');

    expect(console.debug).not.toHaveBeenCalled();
    expect(console.info).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith('[ERROR] error message');
  });

  it('should handle additional arguments', () => {
    const logger = createStructuredLogger('debug');
    const obj = { key: 'value' };
    const num = 42;
    
    logger.info('message with args', obj, num);

    expect(console.info).toHaveBeenCalledWith('[INFO] message with args', obj, num);
  });

  it('should handle empty additional arguments', () => {
    const logger = createStructuredLogger('info');
    
    logger.info('simple message');

    expect(console.info).toHaveBeenCalledWith('[INFO] simple message');
  });
});