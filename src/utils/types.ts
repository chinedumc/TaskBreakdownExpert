// Shared logging interface
export interface ILogger {
  logUserAction(action: string, details: Record<string, any>): void | Promise<void>;
  logOpenAIResponse(context: string, response: any): void | Promise<void>;
}

// Server-only logger interface
export interface IServerLogger extends ILogger {
  logError(error: Error, context: string): void | Promise<void>;
}

// Client-only logger interface  
export interface IClientLogger extends ILogger {
  getLogs(type: string): string;
}