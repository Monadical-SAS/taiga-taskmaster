#!/usr/bin/env node
import { setupGlobalLogger, cleanupGlobalLogger } from './file-logger.js';
import * as path from 'path';
import * as os from 'os';

async function testLogger() {
  console.log('🧪 Testing logger functionality...');
  
  // Setup logger in a temp directory
  const testDir = path.join(os.tmpdir(), 'test-logger');
  const logger = await setupGlobalLogger(testDir);
  
  console.log(`📝 Log file created at: ${logger.getLogFilePath()}`);
  
  // Test different console methods
  console.log('This is a regular log message');
  console.info('This is an info message');
  console.warn('This is a warning message');  
  console.error('This is an error message');
  
  // Test structured logging  
  await logger.logFromSource('tui', 'info', 'Custom log message from test source');
  
  // Test object logging
  console.log('Testing object logging:', { 
    timestamp: Date.now(), 
    user: 'test',
    action: 'testing-logger'
  });
  
  // Test error logging
  try {
    throw new Error('Test error for logging');
  } catch (error) {
    console.error('Caught test error:', error);
  }
  
  console.log('✅ Logger test completed');
  
  // Cleanup
  await cleanupGlobalLogger();
  console.log('🧹 Logger cleaned up');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testLogger().catch(console.error);
}