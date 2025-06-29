import { NextResponse } from 'next/server';
import { AnalyticsLogger } from '@/utils/analytics-logger';

const analyticsLogger = new AnalyticsLogger();

export async function GET() {
  try {
    const metrics = analyticsLogger.getCurrentMetrics();
    const analyticsFilePath = analyticsLogger.getAnalyticsFilePath();
    
    // Create a summary of recent tasks (first 20 characters + count)
    const taskSummary = metrics.recentTasks.slice(0, 10).map(task => 
      task.length > 50 ? task.substring(0, 50) + '...' : task
    );
    
    return NextResponse.json({
      success: true,
      metrics: {
        taskBreakdownsGenerated: metrics.taskBreakdownsGenerated,
        emailsSent: metrics.emailsSent,
        downloadsCompleted: metrics.downloadsCompleted,
        lastUpdated: metrics.lastUpdated,
        recentTasksCount: metrics.recentTasks.length,
        recentTasksSample: taskSummary
      },
      analyticsFile: analyticsFilePath,
      message: 'Analytics data retrieved successfully'
    });
  } catch (error) {
    console.error('Analytics retrieval error:', error);
    return NextResponse.json({ error: 'Failed to retrieve analytics' }, { status: 500 });
  }
}
