import * as fs from 'fs';
import { IServerLogger } from './types';

// Server-side logger that uses file system
export class ServerLogger implements IServerLogger {
  private formatLogEntry(type: string, content: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] ${type}: ${content}\n`;
  }

  private getLogPath(): string {
    const logDir = process.cwd() + '/logs';
    const logFile = logDir + '/user_attempts.log';
    return logFile;
  }

  private ensureLogDirectory(): void {
    const logDir = process.cwd() + '/logs';
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  private saveToFile(content: string): void {
    try {
      const logFile = this.getLogPath();
      this.ensureLogDirectory();
      fs.appendFileSync(logFile, content);
    } catch (error) {
      console.error('Error saving to file:', error);
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
