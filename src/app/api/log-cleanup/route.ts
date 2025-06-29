import { NextRequest, NextResponse } from 'next/server';
import { ServerLogger } from '@/utils/logger';

// POST endpoint to manually clean up old log files
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const daysToKeep = body.daysToKeep || 30;
    
    if (daysToKeep < 1 || daysToKeep > 365) {
      return NextResponse.json({
        success: false,
        error: 'daysToKeep must be between 1 and 365'
      }, { status: 400 });
    }
    
    const logger = new ServerLogger();
    logger.cleanupOldLogs(daysToKeep);
    
    const remainingFiles = logger.getLogFiles();
    
    return NextResponse.json({
      success: true,
      message: `Cleaned up log files older than ${daysToKeep} days`,
      remainingFiles: {
        count: remainingFiles.length,
        files: remainingFiles.slice(0, 10)
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to cleanup log files',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to get log cleanup information
export async function GET() {
  try {
    const logger = new ServerLogger();
    const logFiles = logger.getLogFiles();
    
    return NextResponse.json({
      success: true,
      logFiles: {
        count: logFiles.length,
        files: logFiles.map(file => ({
          name: file,
          // Extract date from filename for sorting/display
          date: file.match(/user_attempts_(\d{4}-\d{2}-\d{2})/)?.[1] || 'unknown'
        }))
      },
      cleanupInfo: {
        message: "Log files are automatically cleaned up after 30 days",
        manualCleanup: "POST to this endpoint with {\"daysToKeep\": N} to manually cleanup"
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve log cleanup information',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
