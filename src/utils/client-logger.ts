import { IClientLogger } from './types';

// Client-side logger that uses browser storage
export class ClientLogger implements IClientLogger {
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

  public logOpenAIResponse(context: string, response: any): void {
    const content = this.formatLogEntry(
      "OPENAI_RESPONSE",
      `Context: ${context}\nResponse: ${JSON.stringify(response, null, 2)}`
    );
    console.log(content);
    this.saveToLocalStorage("ai-responses", content);
  }
}

// Create a singleton instance
export const logger = new ClientLogger();
