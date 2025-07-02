/**
 * User Session Management without Authentication
 * Creates anonymous user IDs for tracking individual user analytics
 */

export interface UserSession {
  userId: string;
  createdAt: string;
  lastVisit: string;
  sessionCount: number;
}

export interface UserAnalytics {
  userId: string;
  taskBreakdownsGenerated: number;
  downloadsCompleted: number;
  visitsCount: number;
  firstVisit: string;
  lastVisit: string;
  totalSessions: number;
  averageSessionTime?: number;
  favoriteTaskTypes: string[];
  completedTasks: string[];
  preferences: {
    defaultTimeUnit: 'days' | 'months';
    defaultCommitment: number;
    skillLevel: 'beginner' | 'intermediate' | 'advanced';
  };
}

class UserSessionManager {
  private readonly USER_SESSION_KEY = 'taskbreakdown_user_session';
  private readonly USER_ANALYTICS_KEY = 'taskbreakdown_user_analytics';

  /**
   * Get or create a user session
   */
  getOrCreateSession(): UserSession {
    if (typeof window === 'undefined') {
      // Server-side fallback
      return this.createNewSession();
    }

    const existingSession = localStorage.getItem(this.USER_SESSION_KEY);
    
    if (existingSession) {
      try {
        const session: UserSession = JSON.parse(existingSession);
        // Update last visit
        session.lastVisit = new Date().toISOString();
        session.sessionCount += 1;
        localStorage.setItem(this.USER_SESSION_KEY, JSON.stringify(session));
        return session;
      } catch (error) {
        console.warn('Failed to parse existing session, creating new one:', error);
      }
    }

    return this.createNewSession();
  }

  /**
   * Create a new anonymous user session
   */
  private createNewSession(): UserSession {
    const userId = this.generateUserId();
    const now = new Date().toISOString();
    
    const session: UserSession = {
      userId,
      createdAt: now,
      lastVisit: now,
      sessionCount: 1,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(this.USER_SESSION_KEY, JSON.stringify(session));
      
      // Initialize user analytics
      const analytics: UserAnalytics = {
        userId,
        taskBreakdownsGenerated: 0,
        downloadsCompleted: 0,
        visitsCount: 1,
        firstVisit: now,
        lastVisit: now,
        totalSessions: 1,
        favoriteTaskTypes: [],
        completedTasks: [],
        preferences: {
          defaultTimeUnit: 'days',
          defaultCommitment: 2,
          skillLevel: 'beginner',
        },
      };
      
      localStorage.setItem(this.USER_ANALYTICS_KEY, JSON.stringify(analytics));
    }

    return session;
  }

  /**
   * Generate a unique anonymous user ID
   */
  private generateUserId(): string {
    // Create a unique ID based on timestamp and random components
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2);
    return `user_${timestamp}_${random}`;
  }

  /**
   * Get user analytics from local storage
   */
  getUserAnalytics(): UserAnalytics | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const stored = localStorage.getItem(this.USER_ANALYTICS_KEY);
    if (!stored) {
      return null;
    }

    try {
      return JSON.parse(stored) as UserAnalytics;
    } catch (error) {
      console.warn('Failed to parse user analytics:', error);
      return null;
    }
  }

  /**
   * Update user analytics
   */
  updateAnalytics(updates: Partial<UserAnalytics>): void {
    const current = this.getUserAnalytics();
    if (!current) {
      console.warn('No user analytics found to update');
      return;
    }

    const updated = { ...current, ...updates };
    updated.lastVisit = new Date().toISOString();

    if (typeof window !== 'undefined') {
      localStorage.setItem(this.USER_ANALYTICS_KEY, JSON.stringify(updated));
    }
  }

  /**
   * Track a task breakdown generation
   */
  trackTaskBreakdown(taskTitle: string): void {
    const analytics = this.getUserAnalytics();
    if (!analytics) return;

    this.updateAnalytics({
      taskBreakdownsGenerated: analytics.taskBreakdownsGenerated + 1,
      completedTasks: [...analytics.completedTasks, taskTitle].slice(-10), // Keep last 10
    });
  }

  /**
   * Track a download
   */
  trackDownload(): void {
    const analytics = this.getUserAnalytics();
    if (!analytics) return;

    this.updateAnalytics({
      downloadsCompleted: analytics.downloadsCompleted + 1,
    });
  }

  /**
   * Track a visit
   */
  trackVisit(): void {
    const analytics = this.getUserAnalytics();
    if (!analytics) return;

    this.updateAnalytics({
      visitsCount: analytics.visitsCount + 1,
      totalSessions: analytics.totalSessions + 1,
    });
  }

  /**
   * Update user preferences
   */
  updatePreferences(preferences: Partial<UserAnalytics['preferences']>): void {
    const analytics = this.getUserAnalytics();
    if (!analytics) return;

    this.updateAnalytics({
      preferences: { ...analytics.preferences, ...preferences },
    });
  }

  /**
   * Clear user data (for privacy/reset)
   */
  clearUserData(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.USER_SESSION_KEY);
      localStorage.removeItem(this.USER_ANALYTICS_KEY);
    }
  }

  /**
   * Check if user has existing data
   */
  hasUserData(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    return !!localStorage.getItem(this.USER_SESSION_KEY);
  }
}

export const userSessionManager = new UserSessionManager();
