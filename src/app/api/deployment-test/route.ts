import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: 'Deployment test endpoint',
    timestamp: new Date().toISOString(),
    version: '0.1.1',
    commit: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown'
  });
}
