import { MongoClient, Db, Collection } from 'mongodb';

export interface AnalyticsMetrics {
  taskBreakdownsGenerated: number;
  emailsSent: number;
  downloadsCompleted: number;
  visitsCount: number;
  lastUpdated: string;
  recentTasks: string[];
}

export interface AnalyticsEvent {
  type: 'task_breakdown' | 'email_sent' | 'download' | 'visit';
  timestamp: string;
  data?: {
    taskDescription?: string;
    downloadType?: string;
  };
}

interface MetricsDocument extends AnalyticsMetrics {
  _id: string;
}

interface EventDocument extends AnalyticsEvent {
  _id?: any;
}

export class MongoAnalyticsLogger {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private metricsCollection: Collection | null = null;
  private eventsCollection: Collection | null = null;
  private connectionString: string;
  private dbName: string;

  constructor() {
    this.connectionString = process.env.MONGODB_URI || '';
    this.dbName = process.env.MONGODB_DB || 'taskbreakdown';
    
    if (!this.connectionString) {
      throw new Error('MONGODB_URI environment variable is required for production analytics');
    }
  }

  private async connect(): Promise<void> {
    if (this.client && this.db) {
      return; // Already connected
    }

    try {
      console.log('🔗 Connecting to MongoDB for analytics...');
      this.client = new MongoClient(this.connectionString);
      await this.client.connect();
      this.db = this.client.db(this.dbName);
      this.metricsCollection = this.db.collection('analytics');
      this.eventsCollection = this.db.collection('user_attempts');
      
      // Ensure indexes
      await this.eventsCollection.createIndex({ timestamp: -1 });
      await this.eventsCollection.createIndex({ type: 1 });
      
      console.log('✅ Connected to MongoDB for analytics');
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('bad auth')) {
        console.error('🔐 MongoDB authentication failed - check credentials');
      } else if (errorMessage.includes('ENOTFOUND')) {
        console.error('🌐 MongoDB host not found - check connection string');
      }
      throw error;
    }
  }

  private async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      this.metricsCollection = null;
      this.eventsCollection = null;
    }
  }

  private async readCurrentMetrics(): Promise<AnalyticsMetrics> {
    try {
      await this.connect();
      
      const metrics = await this.metricsCollection!.findOne({ _id: 'global' } as any);
      
      if (metrics) {
        console.log('✅ Successfully read metrics from MongoDB');
        return {
          taskBreakdownsGenerated: metrics.taskBreakdownsGenerated || 0,
          emailsSent: metrics.emailsSent || 0,
          downloadsCompleted: metrics.downloadsCompleted || 0,
          visitsCount: (metrics.visitsCount !== undefined && metrics.visitsCount !== null) ? metrics.visitsCount : 0,
          lastUpdated: metrics.lastUpdated || new Date().toISOString(),
          recentTasks: metrics.recentTasks || []
        };
      }
      
      // Document doesn't exist, create it with default metrics
      console.log('📝 No metrics document found, creating default metrics');
      const defaultMetrics: AnalyticsMetrics = {
        taskBreakdownsGenerated: 0,
        emailsSent: 0,
        downloadsCompleted: 0,
        visitsCount: 0,
        lastUpdated: new Date().toISOString(),
        recentTasks: []
      };
      
      await this.writeMetrics(defaultMetrics);
      return defaultMetrics;
      
    } catch (error) {
      console.error('❌ Failed to read/create metrics in MongoDB:', error);
      
      // Return default metrics without trying to write to MongoDB
      return {
        taskBreakdownsGenerated: 0,
        emailsSent: 0,
        downloadsCompleted: 0,
        visitsCount: 0,
        lastUpdated: new Date().toISOString(),
        recentTasks: []
      };
    }
  }

  private async writeMetrics(metrics: AnalyticsMetrics): Promise<void> {
    try {
      await this.connect();
      
      console.log('🔄 Writing metrics to MongoDB:', JSON.stringify(metrics, null, 2));
      
      const result = await this.metricsCollection!.replaceOne(
        { _id: 'global' } as any,
        { _id: 'global', ...metrics } as any,
        { upsert: true }
      );
      
      console.log('✅ MongoDB write result:', {
        acknowledged: result.acknowledged,
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        upsertedCount: result.upsertedCount
      });
      
    } catch (error) {
      console.error('❌ Failed to write metrics to MongoDB:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('bad auth')) {
        console.error('🔐 Authentication failed - check MongoDB credentials');
      } else if (errorMessage.includes('timeout')) {
        console.error('⏱️ Connection timeout - check network access');
      }
      throw error;
    }
  }

  private async logEvent(event: AnalyticsEvent): Promise<void> {
    await this.connect();
    
    try {
      await this.eventsCollection!.insertOne({
        ...event,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log event to MongoDB:', error);
      // Don't throw here - we don't want to break the main functionality
    }
  }

  public async incrementTaskBreakdowns(taskDescription?: string): Promise<void> {
    try {
      console.log('📈 Incrementing task breakdowns...');
      const metrics = await this.readCurrentMetrics();
      metrics.taskBreakdownsGenerated += 1;
      metrics.lastUpdated = new Date().toISOString();
      
      // Add task to recent tasks if provided
      if (taskDescription) {
        // Keep only the last 50 tasks to prevent document from growing too large
        metrics.recentTasks.unshift(taskDescription);
        if (metrics.recentTasks.length > 50) {
          metrics.recentTasks = metrics.recentTasks.slice(0, 50);
        }
      }
      
      await this.writeMetrics(metrics);
      
      // Log the event
      await this.logEvent({
        type: 'task_breakdown',
        timestamp: new Date().toISOString(),
        data: { taskDescription }
      });
      
      console.log(`✅ Analytics: Task breakdowns generated: ${metrics.taskBreakdownsGenerated}`);
    } catch (error) {
      console.error('❌ Failed to increment task breakdowns:', error);
      // Don't throw to avoid breaking the main functionality, but log the failure
    }
  }

  public async incrementEmailsSent(): Promise<void> {
    try {
      const metrics = await this.readCurrentMetrics();
      metrics.emailsSent += 1;
      metrics.lastUpdated = new Date().toISOString();
      await this.writeMetrics(metrics);
      
      // Log the event
      await this.logEvent({
        type: 'email_sent',
        timestamp: new Date().toISOString()
      });
      
      console.log(`Analytics: Emails sent: ${metrics.emailsSent}`);
    } catch (error) {
      console.error('Failed to increment emails sent:', error);
    }
  }

  public async incrementDownloads(downloadType?: string): Promise<void> {
    try {
      console.log('📈 Incrementing downloads...');
      const metrics = await this.readCurrentMetrics();
      metrics.downloadsCompleted += 1;
      metrics.lastUpdated = new Date().toISOString();
      await this.writeMetrics(metrics);
      
      // Log the event
      await this.logEvent({
        type: 'download',
        timestamp: new Date().toISOString(),
        data: { downloadType }
      });
      
      console.log(`✅ Analytics: Downloads completed: ${metrics.downloadsCompleted}`);
    } catch (error) {
      console.error('❌ Failed to increment downloads:', error);
      // Don't throw to avoid breaking the main functionality, but log the failure
    }
  }

  public async incrementVisits(): Promise<void> {
    try {
      console.log('📈 Incrementing visits...');
      const metrics = await this.readCurrentMetrics();
      metrics.visitsCount += 1;
      metrics.lastUpdated = new Date().toISOString();
      await this.writeMetrics(metrics);
      
      // Log the event
      await this.logEvent({
        type: 'visit',
        timestamp: new Date().toISOString()
      });
      
      console.log(`✅ Analytics: Visits count: ${metrics.visitsCount}`);
    } catch (error) {
      console.error('❌ Failed to increment visits:', error);
      // Don't throw to avoid breaking the main functionality, but log the failure
    }
  }

  public async getCurrentMetrics(): Promise<AnalyticsMetrics> {
    try {
      return await this.readCurrentMetrics();
    } catch (error) {
      console.error('Failed to get current metrics:', error);
      // Return default metrics on error
      return {
        taskBreakdownsGenerated: 0,
        emailsSent: 0,
        downloadsCompleted: 0,
        visitsCount: 0,
        lastUpdated: new Date().toISOString(),
        recentTasks: []
      };
    }
  }

  public async getRecentEvents(limit: number = 100): Promise<AnalyticsEvent[]> {
    try {
      await this.connect();
      const events = await this.eventsCollection!
        .find({})
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
      
      return events.map(event => ({
        type: event.type,
        timestamp: event.timestamp,
        data: event.data
      }));
    } catch (error) {
      console.error('Failed to get recent events:', error);
      return [];
    }
  }

  // For compatibility with existing analytics monitoring tools
  public getAnalyticsFilePath(): string {
    return 'MongoDB Collection: metrics (global document)';
  }

  // Clean up method for proper shutdown
  public async close(): Promise<void> {
    await this.disconnect();
  }
}
