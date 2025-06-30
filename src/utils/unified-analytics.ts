import { MongoAnalyticsLogger } from './mongo-analytics';
import { AnalyticsLogger } from './analytics-logger';

export class UnifiedAnalyticsService {
  private mongoLogger: MongoAnalyticsLogger | null = null;
  private fileLogger: AnalyticsLogger | null = null;
  private isProduction: boolean;
  private mongoFailed: boolean = false;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
    
    if (this.isProduction && process.env.MONGODB_URI) {
      try {
        this.mongoLogger = new MongoAnalyticsLogger();
        console.log('Using MongoDB analytics for production');
      } catch (error) {
        console.error('Failed to initialize MongoDB analytics, falling back to local:', error);
        this.mongoFailed = true;
        this.initializeFileLogger();
      }
    } else {
      this.initializeFileLogger();
    }
  }

  private initializeFileLogger() {
    try {
      this.fileLogger = new AnalyticsLogger();
      console.log('Using file-based analytics for development');
    } catch (error) {
      console.error('Failed to initialize file analytics:', error);
    }
  }

  async incrementTaskBreakdowns(taskDescription?: string): Promise<void> {
    try {
      if (this.mongoLogger) {
        await this.mongoLogger.incrementTaskBreakdowns(taskDescription);
      } else if (this.fileLogger) {
        this.fileLogger.incrementTaskBreakdowns(taskDescription);
      }
    } catch (error) {
      console.error('Failed to increment task breakdowns:', error);
    }
  }

  async incrementEmailsSent(): Promise<void> {
    try {
      if (this.mongoLogger) {
        await this.mongoLogger.incrementEmailsSent();
      } else if (this.fileLogger) {
        this.fileLogger.incrementEmailsSent();
      }
    } catch (error) {
      console.error('Failed to increment emails sent:', error);
    }
  }

  async incrementDownloads(downloadType?: string): Promise<void> {
    try {
      if (this.mongoLogger) {
        await this.mongoLogger.incrementDownloads(downloadType);
      } else if (this.fileLogger) {
        this.fileLogger.incrementDownloads(); // File logger doesn't support downloadType
      }
    } catch (error) {
      console.error('Failed to increment downloads:', error);
    }
  }

  async getCurrentMetrics() {
    try {
      if (this.mongoLogger && !this.mongoFailed) {
        try {
          const metrics = await this.mongoLogger.getCurrentMetrics();
          console.log('✅ Successfully retrieved metrics from MongoDB');
          return metrics;
        } catch (mongoError) {
          console.error('❌ MongoDB metrics failed:', mongoError);
          this.mongoFailed = true;
          
          // Try to fallback to file logger if in development
          if (!this.isProduction) {
            console.log('🔄 Falling back to file analytics');
            this.initializeFileLogger();
            if (this.fileLogger) {
              return this.fileLogger.getCurrentMetrics();
            }
          }
          
          // Return default metrics with error info
          return {
            taskBreakdownsGenerated: 0,
            emailsSent: 0,
            downloadsCompleted: 0,
            lastUpdated: new Date().toISOString(),
            recentTasks: [`Error: MongoDB failed - ${mongoError instanceof Error ? mongoError.message : 'Unknown error'}`]
          };
        }
      } else if (this.fileLogger) {
        return this.fileLogger.getCurrentMetrics();
      }
      
      // Return default metrics if no logger is available
      return {
        taskBreakdownsGenerated: 0,
        emailsSent: 0,
        downloadsCompleted: 0,
        lastUpdated: new Date().toISOString(),
        recentTasks: this.mongoFailed ? ['Error: MongoDB authentication failed'] : ['No analytics logger available']
      };
    } catch (error) {
      console.error('Failed to get current metrics:', error);
      return {
        taskBreakdownsGenerated: 0,
        emailsSent: 0,
        downloadsCompleted: 0,
        lastUpdated: new Date().toISOString(),
        recentTasks: [`System error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  async getRecentEvents(limit: number = 100) {
    try {
      if (this.mongoLogger) {
        return await this.mongoLogger.getRecentEvents(limit);
      }
      
      // File logger doesn't support events, return empty array
      return [];
    } catch (error) {
      console.error('Failed to get recent events:', error);
      return [];
    }
  }

  getStorageInfo(): string {
    if (this.mongoLogger && !this.mongoFailed) {
      return 'MongoDB (Production)';
    } else if (this.mongoFailed) {
      return 'MongoDB (Failed - check credentials)';
    } else if (this.fileLogger) {
      return `Local Files (Development) - ${this.fileLogger.getAnalyticsFilePath()}`;
    }
    return 'No analytics storage available';
  }

  async close(): Promise<void> {
    try {
      if (this.mongoLogger) {
        await this.mongoLogger.close();
      }
      // File logger doesn't need explicit cleanup
    } catch (error) {
      console.error('Failed to close analytics service:', error);
    }
  }
}

// Export singleton instance
export const analyticsService = new UnifiedAnalyticsService();
