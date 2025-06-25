import { describe, it, expect, vi } from 'vitest';
import { createStructuredLogger, type ConsoleInterface } from './logging.js';

describe('createStructuredLogger', () => {
  // Create mock console interface - dependency injection approach
  const createMockConsole = (): ConsoleInterface => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  });

  it('should create a logger with default info level', () => {
    const mockConsole = createMockConsole();
    const logger = createStructuredLogger('info', mockConsole);
    
    logger.debug('debug message');
    logger.info('info message');
    logger.warn('warn message');
    logger.error('error message');

    expect(mockConsole.debug).not.toHaveBeenCalled();
    expect(mockConsole.info).toHaveBeenCalledWith('[INFO] info message');
    expect(mockConsole.warn).toHaveBeenCalledWith('[WARN] warn message');
    expect(mockConsole.error).toHaveBeenCalledWith('[ERROR] error message');
  });

  it('should respect debug level', () => {
    const mockConsole = createMockConsole();
    const logger = createStructuredLogger('debug', mockConsole);
    
    logger.debug('debug message');
    logger.info('info message');
    logger.warn('warn message');
    logger.error('error message');

    expect(mockConsole.debug).toHaveBeenCalledWith('[DEBUG] debug message');
    expect(mockConsole.info).toHaveBeenCalledWith('[INFO] info message');
    expect(mockConsole.warn).toHaveBeenCalledWith('[WARN] warn message');
    expect(mockConsole.error).toHaveBeenCalledWith('[ERROR] error message');
  });

  it('should respect warn level', () => {
    const mockConsole = createMockConsole();
    const logger = createStructuredLogger('warn', mockConsole);
    
    logger.debug('debug message');
    logger.info('info message');
    logger.warn('warn message');
    logger.error('error message');

    expect(mockConsole.debug).not.toHaveBeenCalled();
    expect(mockConsole.info).not.toHaveBeenCalled();
    expect(mockConsole.warn).toHaveBeenCalledWith('[WARN] warn message');
    expect(mockConsole.error).toHaveBeenCalledWith('[ERROR] error message');
  });

  it('should respect error level', () => {
    const mockConsole = createMockConsole();
    const logger = createStructuredLogger('error', mockConsole);
    
    logger.debug('debug message');
    logger.info('info message');
    logger.warn('warn message');
    logger.error('error message');

    expect(mockConsole.debug).not.toHaveBeenCalled();
    expect(mockConsole.info).not.toHaveBeenCalled();
    expect(mockConsole.warn).not.toHaveBeenCalled();
    expect(mockConsole.error).toHaveBeenCalledWith('[ERROR] error message');
  });

  it('should handle additional arguments', () => {
    const mockConsole = createMockConsole();
    const logger = createStructuredLogger('debug', mockConsole);
    const obj = { key: 'value' };
    const num = 42;
    
    logger.info('message with args', obj, num);

    expect(mockConsole.info).toHaveBeenCalledWith('[INFO] message with args', obj, num);
  });

  it('should handle empty additional arguments', () => {
    const mockConsole = createMockConsole();
    const logger = createStructuredLogger('info', mockConsole);
    
    logger.info('simple message');

    expect(mockConsole.info).toHaveBeenCalledWith('[INFO] simple message');
  });

});