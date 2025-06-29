import { format } from 'date-fns';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Client-side logger that uses browser storage
export class ClientLogger {
  private formatLogEntry(type: string, content: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] ${type}: ${content}\n`;
  }

  private getLogStorageKey(type: string): string {
    return `task-breakdown-expert-logs-${type}`;
  }

  private saveToLocalStorage(type: string, content: string): void {
    try {
      const key = this.getLogStorageKey(type);
      const existingLogs = localStorage.getItem(key) || '';
      localStorage.setItem(key, existingLogs + content);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  public logUserAction(action: string, details: Record<string, any>): void {
    const content = this.formatLogEntry('USER_ACTION', `Action: ${action}\nDetails: ${JSON.stringify(details, null, 2)}`);
    console.log(content);
    this.saveToLocalStorage('user-actions', content);
  }

  public getLogs(type: string): string {
    try {
      return localStorage.getItem(this.getLogStorageKey(type)) || '';
    } catch (error) {
      console.error('Error retrieving logs:', error);
      return '';
    }
  }
}

// Server-side logger that uses file system
export class ServerLogger {
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

  public logUserAction(action: string, details: Record<string, any>): void {
    const content = this.formatLogEntry('USER_ACTION', `Action: ${action}\nDetails: ${JSON.stringify(details, null, 2)}`);
    console.log(content);
    this.saveToFile(content);
  }

  public logError(error: Error, context: string): void {
    const content = this.formatLogEntry('ERROR', `Context: ${context}\nError: ${error.message}\nStack: ${error.stack}`);
    console.error(content);
    this.saveToFile(content);
  }

  public logOpenAIResponse(context: string, response: any): void {
    const content = this.formatLogEntry('OPENAI_RESPONSE', `Context: ${context}\nResponse: ${JSON.stringify(response, null, 2)}`);
    console.log(content);
    this.saveToFile(content);
  }
}

// Client-side logger that uses browser storage
export class Logger {
	private formatLogEntry(type: string, content: string): string {
		const timestamp = new Date().toISOString();
		return `[${timestamp}] ${type}: ${content}\n`;
	}

	private getLogStorageKey(type: string): string {
		return `task-breakdown-expert-logs-${type}`;
	}

	public logUserAction(action: string, details: Record<string, any>): void {
		const content = this.formatLogEntry(
			"USER_ACTION",
			`Action: ${action}\nDetails: ${JSON.stringify(details, null, 2)}`
		);
		console.log(content);
		this.saveToLocalStorage("user-actions", content);
	}

	private saveToLocalStorage(type: string, content: string): void {
		try {
			const key = this.getLogStorageKey(type);
			const existingLogs = localStorage.getItem(key) || "";
			localStorage.setItem(key, existingLogs + content);
		} catch (error) {
			console.error("Error saving to localStorage:", error);
		}
	}

	public logOpenAIResponse(context: string, response: any): void {
		const content = this.formatLogEntry(
			"AI_RESPONSE",
			`Context: ${context}\nResponse: ${JSON.stringify(response, null, 2)}`
		);
		console.log(content);
		this.saveToLocalStorage("ai-responses", content);
	}
}

// Create a singleton instance
export const logger = new Logger();
