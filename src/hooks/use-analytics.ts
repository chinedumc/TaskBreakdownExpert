"use client";

import { useEffect } from 'react';

export function useVisitTracking() {
  useEffect(() => {
    const trackVisit = async () => {
      try {
        await fetch('/api/track-visit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            referrer: document.referrer || 'direct',
            url: window.location.href,
          }),
        });
      } catch (error) {
        console.warn('Failed to track visit:', error);
      }
    };

    trackVisit();
  }, []);
}