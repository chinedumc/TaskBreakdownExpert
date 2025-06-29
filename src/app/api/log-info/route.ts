import { NextResponse } from 'next/server';
import { ServerLogger } from '@/utils/logger';
import { AnalyticsLogger } from '@/utils/analytics-logger';

// GET endpoint to retrieve current log configuration
export async function GET() {
  try {
    const logger = new ServerLogger();
    const analyticsLogger = new AnalyticsLogger();
    const logInfo = logger.getLogInfo();
    const logFiles = logger.getLogFiles();
    const analytics = analyticsLogger.getCurrentMetrics();
    
    return NextResponse.json({
      success: true,
      logConfiguration: logInfo,
      logFiles: {
        count: logFiles.length,
        files: logFiles.slice(0, 10), // Show only the 10 most recent files
        totalFiles: logFiles.length
      },
      rotationInfo: {
        maxFileSize: logInfo.maxFileSize,
        rotationTriggers: [
          "Daily rotation (new file each day)",
          "Size-based rotation (when file exceeds 20MB)",
        ],
        fileNaming: "user_attempts_YYYY-MM-DD_HH-MM-SS-mmm.log"
      },
      analytics: {
        taskBreakdownsGenerated: analytics.taskBreakdownsGenerated,
        emailsSent: analytics.emailsSent,
        downloadsCompleted: analytics.downloadsCompleted,
        lastUpdated: analytics.lastUpdated,
        recentTasksCount: analytics.recentTasks.length,
        analyticsFile: analyticsLogger.getAnalyticsFilePath()
      },
      instructions: {
        message: "Logs are automatically rotated daily and when they exceed 20MB. Analytics are tracked separately.",
        commands: [
          "GET /api/log-info - View current log configuration and analytics",
          "GET /api/analytics - View detailed analytics data",
          "Logs older than 30 days are automatically cleaned up"
        ],
        examples: [
          "LOG_PATH=./logs (current directory)",
          "LOG_PATH=/var/log/taskbreakdown (absolute path)",
          "LOG_PATH=/Users/username/logs/taskbreakdown (user directory)"
        ]
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve log configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
