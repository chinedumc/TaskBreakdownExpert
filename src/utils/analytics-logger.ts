import * as fs from 'node:fs';
import * as path from 'node:path';

export interface AnalyticsMetrics {
  taskBreakdownsGenerated: number;
  emailsSent: number;
  downloadsCompleted: number;
  lastUpdated: string;
  recentTasks: string[];
}

export class AnalyticsLogger {
  private logPath: string;
  private analyticsFile: string;

  constructor() {
    this.logPath = process.env.LOG_PATH || './logs';
    this.analyticsFile = path.join(this.logPath, 'analytics.json');
    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    try {
      if (!fs.existsSync(this.logPath)) {
        fs.mkdirSync(this.logPath, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create analytics log directory:', error);
    }
  }

  private readCurrentMetrics(): AnalyticsMetrics {
    try {
      if (fs.existsSync(this.analyticsFile)) {
        const data = fs.readFileSync(this.analyticsFile, 'utf8');
        const parsed = JSON.parse(data);
        
        // Handle migration from old format without recentTasks
        if (!parsed.recentTasks) {
          parsed.recentTasks = [];
        }
        
        return parsed as AnalyticsMetrics;
      }
    } catch (error) {
      console.error('Failed to read analytics file:', error);
    }

    // Return default metrics if file doesn't exist or can't be read
    const defaultMetrics = {
      taskBreakdownsGenerated: 0,
      emailsSent: 0,
      downloadsCompleted: 0,
      lastUpdated: new Date().toISOString(),
      recentTasks: []
    };

    // Create the file with default metrics
    this.writeMetrics(defaultMetrics);
    return defaultMetrics;
  }

  private writeMetrics(metrics: AnalyticsMetrics): void {
    try {
      const data = JSON.stringify(metrics, null, 2);
      fs.writeFileSync(this.analyticsFile, data, 'utf8');
    } catch (error) {
      console.error('Failed to write analytics file:', error);
    }
  }

  public incrementTaskBreakdowns(taskDescription?: string): void {
    const metrics = this.readCurrentMetrics();
    metrics.taskBreakdownsGenerated += 1;
    metrics.lastUpdated = new Date().toISOString();
    
    // Add task to recent tasks if provided
    if (taskDescription) {
      // Keep only the last 50 tasks to prevent file from growing too large
      metrics.recentTasks.unshift(taskDescription);
      if (metrics.recentTasks.length > 50) {
        metrics.recentTasks = metrics.recentTasks.slice(0, 50);
      }
    }
    
    this.writeMetrics(metrics);
    
    console.log(`Analytics: Task breakdowns generated: ${metrics.taskBreakdownsGenerated}`);
  }

  public incrementEmailsSent(): void {
    const metrics = this.readCurrentMetrics();
    metrics.emailsSent += 1;
    metrics.lastUpdated = new Date().toISOString();
    this.writeMetrics(metrics);
    
    console.log(`Analytics: Emails sent: ${metrics.emailsSent}`);
  }

  public incrementDownloads(): void {
    const metrics = this.readCurrentMetrics();
    metrics.downloadsCompleted += 1;
    metrics.lastUpdated = new Date().toISOString();
    this.writeMetrics(metrics);
    
    console.log(`Analytics: Downloads completed: ${metrics.downloadsCompleted}`);
  }

  public getCurrentMetrics(): AnalyticsMetrics {
    return this.readCurrentMetrics();
  }

  public getAnalyticsFilePath(): string {
    return this.analyticsFile;
  }
}
