import * as fs from 'fs';
import * as path from 'path';
import { IServerLogger } from './types';

// Server-side logger that uses file system with rotation
export class ServerLogger implements IServerLogger {
  private static readonly MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB in bytes

  private formatLogEntry(type: string, content: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] ${type}: ${content}\n`;
  }

  private getCurrentDateString(): string {
    const now = new Date();
    return now.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  private getLogFileName(): string {
    const dateStr = this.getCurrentDateString();
    
    // Check for existing files for today
    const logDir = this.getLogDirectory();
    const pattern = `user_attempts_${dateStr}_`;
    
    try {
      const files = fs.readdirSync(logDir)
        .filter(file => file.startsWith(pattern) && file.endsWith('.log'))
        .sort()
        .reverse(); // Most recent first

      if (files.length > 0) {
        const latestFile = files[0];
        const latestFilePath = path.join(logDir, latestFile);
        
        // Check if current file needs rotation due to size
        if (fs.existsSync(latestFilePath)) {
          const stats = fs.statSync(latestFilePath);
          if (stats.size < ServerLogger.MAX_FILE_SIZE) {
            return latestFile; // Use existing file
          }
        }
      }

      // Create new file (either first of the day or size rotation)
      const timeStr = new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('Z')[0]; // HH-MM-SS-mmm
      return `user_attempts_${dateStr}_${timeStr}.log`;
    } catch (error) {
      console.warn('Error checking existing log files, creating new one:', error);
      const timeStr = new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('Z')[0];
      return `user_attempts_${dateStr}_${timeStr}.log`;
    }
  }

  private getLogPath(): string {
    const logDir = this.getLogDirectory();
    const logFileName = this.getLogFileName();
    return path.join(logDir, logFileName);
  }

  private getLogDirectory(): string {
    const envLogPath = process.env.LOG_PATH;
    
    if (envLogPath) {
      // If path is relative, resolve it relative to process.cwd()
      if (path.isAbsolute(envLogPath)) {
        return envLogPath;
      } else {
        return path.resolve(process.cwd(), envLogPath);
      }
    }
    
    // Default fallback
    return path.join(process.cwd(), 'logs');
  }

  private ensureLogDirectory(): void {
    const logDir = this.getLogDirectory();
    if (!fs.existsSync(logDir)) {
      try {
        fs.mkdirSync(logDir, { recursive: true });
        console.log(`Created log directory: ${logDir}`);
      } catch (error) {
        console.error(`Failed to create log directory ${logDir}:`, error);
        throw error;
      }
    }
  }

  private saveToFile(content: string): void {
    try {
      const logFile = this.getLogPath();
      this.ensureLogDirectory();
      
      // Check if we need to rotate due to size before writing
      if (fs.existsSync(logFile)) {
        const stats = fs.statSync(logFile);
        if (stats.size + Buffer.byteLength(content, 'utf8') > ServerLogger.MAX_FILE_SIZE) {
          // Force a new file by creating a new filename with current timestamp
          const dateStr = this.getCurrentDateString();
          const timeStr = new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('Z')[0];
          const newLogFile = path.join(this.getLogDirectory(), `user_attempts_${dateStr}_${timeStr}.log`);
          fs.appendFileSync(newLogFile, content);
          return;
        }
      }
      
      fs.appendFileSync(logFile, content);
    } catch (error) {
      console.error('Error saving to log file:', error);
      console.error('Log directory:', this.getLogDirectory());
      console.error('Attempted log file path:', this.getLogPath());
      // Don't throw the error to avoid breaking the application
    }
  }

  // Method to get current log configuration (useful for debugging)
  public getLogInfo(): { 
    logDirectory: string; 
    logFile: string; 
    envLogPath?: string; 
    maxFileSize: string;
    currentDate: string;
  } {
    return {
      logDirectory: this.getLogDirectory(),
      logFile: this.getLogPath(),
      envLogPath: process.env.LOG_PATH,
      maxFileSize: `${ServerLogger.MAX_FILE_SIZE / (1024 * 1024)}MB`,
      currentDate: this.getCurrentDateString()
    };
  }

  // Method to list all log files
  public getLogFiles(): string[] {
    try {
      const logDir = this.getLogDirectory();
      if (!fs.existsSync(logDir)) {
        return [];
      }
      
      return fs.readdirSync(logDir)
        .filter(file => file.startsWith('user_attempts_') && file.endsWith('.log'))
        .sort()
        .reverse(); // Most recent first
    } catch (error) {
      console.error('Error listing log files:', error);
      return [];
    }
  }

  // Method to clean up old log files (keep last 30 days)
  public cleanupOldLogs(daysToKeep: number = 30): void {
    try {
      const logDir = this.getLogDirectory();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const files = fs.readdirSync(logDir)
        .filter(file => file.startsWith('user_attempts_') && file.endsWith('.log'));
      
      let deletedCount = 0;
      for (const file of files) {
        const filePath = path.join(logDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          deletedCount++;
          console.log(`Deleted old log file: ${file}`);
        }
      }
      
      if (deletedCount > 0) {
        console.log(`Cleaned up ${deletedCount} old log files`);
      }
    } catch (error) {
      console.error('Error cleaning up old logs:', error);
    }
  }

  public async logUserAction(action: string, details: Record<string, any>): Promise<void> {
    const content = this.formatLogEntry('USER_ACTION', `Action: ${action}\nDetails: ${JSON.stringify(details, null, 2)}`);
    console.log(content);
    this.saveToFile(content);
  }

  public async logError(error: Error, context: string): Promise<void> {
    const content = this.formatLogEntry('ERROR', `Context: ${context}\nError: ${error.message}\nStack: ${error.stack}`);
    console.error(content);
    this.saveToFile(content);
  }

  public async logOpenAIResponse(context: string, response: any): Promise<void> {
    const content = this.formatLogEntry('OPENAI_RESPONSE', `Context: ${context}\nResponse: ${JSON.stringify(response, null, 2)}`);
    console.log(content);
    this.saveToFile(content);
  }
}
