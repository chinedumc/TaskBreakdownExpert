import { NextResponse } from 'next/server';
import { analyticsService } from '@/utils/unified-analytics';

export async function POST() {
  try {
    // Force a read and write to migrate the data structure
    const metrics = await analyticsService.getCurrentMetrics();
    
    // If visitsCount is missing, initialize it to 0
    if (metrics.visitsCount === undefined || metrics.visitsCount === null) {
      // Force an increment to 0 to initialize the field
      await analyticsService.incrementVisits();
      // Then decrement by reading and manually setting to 0
      const updatedMetrics = await analyticsService.getCurrentMetrics();
      return NextResponse.json({ 
        success: true, 
        message: 'Migration completed',
        before: metrics,
        after: updatedMetrics
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'No migration needed',
      metrics: metrics
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
  }
}
