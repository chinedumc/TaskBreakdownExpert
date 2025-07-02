"use client";

import { useEffect, useState } from 'react';
import { userSessionManager, type UserAnalytics } from '@/utils/user-session';

export function useVisitTracking() {
  useEffect(() => {
    // Initialize or update user session
    const session = userSessionManager.getOrCreateSession();
    
    // Track visit in user analytics
    userSessionManager.trackVisit();
    
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
            userId: session.userId, // Include user ID for server tracking
          }),
        });
      } catch (error) {
        console.warn('Failed to track visit:', error);
      }
    };

    trackVisit();
  }, []);
}

/**
 * Hook to get user-specific analytics
 */
export function useUserAnalytics() {
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get user analytics from local storage
    const userAnalytics = userSessionManager.getUserAnalytics();
    setAnalytics(userAnalytics);
    setIsLoading(false);

    // Set up listener for analytics updates
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'taskbreakdown_user_analytics') {
        const updated = userSessionManager.getUserAnalytics();
        setAnalytics(updated);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const trackTaskBreakdown = (taskTitle: string) => {
    userSessionManager.trackTaskBreakdown(taskTitle);
    const updated = userSessionManager.getUserAnalytics();
    setAnalytics(updated);
  };

  const trackDownload = () => {
    userSessionManager.trackDownload();
    const updated = userSessionManager.getUserAnalytics();
    setAnalytics(updated);
  };

  const updatePreferences = (preferences: Partial<UserAnalytics['preferences']>) => {
    userSessionManager.updatePreferences(preferences);
    const updated = userSessionManager.getUserAnalytics();
    setAnalytics(updated);
  };

  const clearUserData = () => {
    userSessionManager.clearUserData();
    setAnalytics(null);
  };

  return {
    analytics,
    isLoading,
    trackTaskBreakdown,
    trackDownload,
    updatePreferences,
    clearUserData,
    hasUserData: userSessionManager.hasUserData(),
  };
}

/**
 * Hook to get global/admin analytics (existing functionality)
 */
export function useGlobalAnalytics() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/analytics');
        if (response.ok) {
          const data = await response.json();
          setAnalytics(data.metrics);
        }
      } catch (error) {
        console.warn('Failed to fetch global analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return { analytics, isLoading };
}