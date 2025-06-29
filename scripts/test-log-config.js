#!/usr/bin/env node

/**
 * Log Configuration Test Script
 * 
 * This script tests the configurable logging setup and validates that logs
 * can be written to the specified location.
 * 
 * Usage:
 *   node scripts/test-log-config.js
 *   LOG_PATH=/custom/path node scripts/test-log-config.js
 */

import { ServerLogger } from '../src/utils/logger.js';
import * as fs from 'fs';

async function testLogConfiguration() {
  console.log('🧪 Testing Log Configuration...\n');
  
  // Create logger instance
  const logger = new ServerLogger();
  
  // Get current configuration
  const logInfo = logger.getLogInfo();
  
  console.log('📋 Current Log Configuration:');
  console.log(`   Log Directory: ${logInfo.logDirectory}`);
  console.log(`   Log File: ${logInfo.logFile}`);
  console.log(`   Environment LOG_PATH: ${logInfo.envLogPath || 'not set (using default)'}\n`);
  
  // Test directory creation and write permissions
  try {
    console.log('🔧 Testing log functionality...');
    
    // Test user action logging
    await logger.logUserAction('Test Log Configuration', {
      timestamp: new Date().toISOString(),
      testCase: 'Configuration validation',
      environment: process.env.NODE_ENV || 'development'
    });
    
    // Test error logging
    const testError = new Error('This is a test error for log configuration validation');
    await logger.logError(testError, 'Log Configuration Test');
    
    // Test OpenAI response logging
    await logger.logOpenAIResponse('Test Context', {
      test: true,
      message: 'This is a test response for log configuration validation',
      timestamp: new Date().toISOString()
    });
    
    console.log('✅ Log functionality test completed successfully!');
    
    // Check if log file exists and has content
    if (fs.existsSync(logInfo.logFile)) {
      const stats = fs.statSync(logInfo.logFile);
      console.log(`📊 Log file size: ${stats.size} bytes`);
      console.log(`📅 Last modified: ${stats.mtime.toISOString()}`);
    } else {
      console.log('❌ Log file was not created');
    }
    
  } catch (error) {
    console.error('❌ Log functionality test failed:', error);
    process.exit(1);
  }
  
  console.log('\n🎉 Log configuration test completed successfully!');
  console.log('\n💡 To use a different log location, set the LOG_PATH environment variable:');
  console.log('   export LOG_PATH=/your/custom/log/directory');
  console.log('   npm run dev');
}

// Run the test
testLogConfiguration().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
