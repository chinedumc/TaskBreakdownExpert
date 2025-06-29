import { NextResponse } from 'next/server';
import { ServerLogger } from '@/utils/logger';

// GET endpoint to test log rotation by generating a log entry
export async function GET() {
  try {
    const logger = new ServerLogger();
    
    // Generate a test log entry
    await logger.logUserAction('Test Log Rotation', {
      test: true,
      timestamp: new Date().toISOString(),
      description: 'Testing the new log rotation functionality'
    });
    
    const logInfo = logger.getLogInfo();
    const logFiles = logger.getLogFiles();
    
    return NextResponse.json({
      success: true,
      message: 'Test log entry created',
      currentLogFile: logInfo.logFile,
      totalLogFiles: logFiles.length,
      logFiles: logFiles.slice(0, 5)
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to create test log entry',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
