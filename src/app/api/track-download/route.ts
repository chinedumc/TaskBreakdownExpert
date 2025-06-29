import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsLogger } from '@/utils/analytics-logger';
import { z } from 'zod';

const analyticsLogger = new AnalyticsLogger();

const TrackDownloadSchema = z.object({
  downloadType: z.enum(['pdf', 'text']),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = TrackDownloadSchema.parse(body);
    
    // Track the download
    analyticsLogger.incrementDownloads();
    
    return NextResponse.json({ 
      success: true, 
      message: `${validatedData.downloadType} download tracked successfully` 
    });
  } catch (error) {
    console.error('Download tracking error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to track download' }, { status: 500 });
  }
}
