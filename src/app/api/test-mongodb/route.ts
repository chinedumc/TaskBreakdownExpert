import { NextRequest, NextResponse } from 'next/server';
import { MongoAnalyticsLogger } from '@/utils/mongo-analytics';

export async function GET(request: NextRequest) {
  try {
    const logger = new MongoAnalyticsLogger();
    
    // Try to get current metrics to verify connection
    const metrics = await logger.getCurrentMetrics();
    
    return NextResponse.json({ 
      status: 'success', 
      message: 'MongoDB connection successful',
      metrics: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('MongoDB test error:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: 'MongoDB test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}