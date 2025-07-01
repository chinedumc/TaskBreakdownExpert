import { NextResponse } from 'next/server';
import { analyticsService } from '@/utils/unified-analytics';

export async function GET() {
  try {
    const metrics = await analyticsService.getCurrentMetrics();
    const storageInfo = analyticsService.getStorageInfo();
    
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
        visitsCount: metrics.visitsCount,
        lastUpdated: metrics.lastUpdated,
        recentTasksCount: metrics.recentTasks.length,
        recentTasksSample: taskSummary
      },
      storage: storageInfo,
      message: 'Analytics data retrieved successfully'
    });
  } catch (error) {
    console.error('Analytics retrieval error:', error);
    return NextResponse.json({ error: 'Failed to retrieve analytics' }, { status: 500 });
  }
}
