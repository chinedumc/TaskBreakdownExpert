import { NextResponse } from 'next/server';
import { analyticsService } from '@/utils/unified-analytics';

export async function POST() {
  try {
    // Track the visit
    await analyticsService.incrementVisits();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Visit tracked successfully' 
    });
  } catch (error) {
    console.error('Visit tracking error:', error);
    return NextResponse.json({ error: 'Failed to track visit' }, { status: 500 });
  }
}
