"use client";

import { useEffect, useRef } from 'react';

// Hook to track user visits
export function useVisitTracking() {
  const hasTracked = useRef(false);

  useEffect(() => {
    // Only track once per session
    if (!hasTracked.current) {
      trackVisit();
      hasTracked.current = true;
    }
  }, []);
}

// Function to track visits
async function trackVisit() {
  try {
    const response = await fetch('/api/track-visit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      }),
    });

    if (!response.ok) {
      console.warn('Failed to track visit:', response.statusText);
    } else {
      console.log('✅ Visit tracked successfully');
    }
  } catch (error) {
    console.error('Error tracking visit:', error);
    // Don't throw - analytics failures shouldn't break the user experience
  }
}

// Function to track downloads (already implemented in download component, but here for completeness)
export async function trackDownload(downloadType: 'pdf' | 'text', additionalData?: any) {
  try {
    const response = await fetch('/api/track-download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        downloadType,
        timestamp: new Date().toISOString(),
        ...additionalData
      }),
    });

    if (!response.ok) {
      console.warn('Failed to track download:', response.statusText);
    } else {
      console.log(`✅ ${downloadType} download tracked successfully`);
    }
  } catch (error) {
    console.error('Error tracking download:', error);
    // Don't throw - analytics failures shouldn't break the user experience
  }
}
