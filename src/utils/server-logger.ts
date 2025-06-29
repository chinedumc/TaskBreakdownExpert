import fs from 'fs/promises';
import path from 'path';
import { format } from 'date-fns';

const LOGS_DIR = path.join(process.cwd(), 'logs');

export class ServerLogger {
  private static instance: ServerLogger;
  private constructor() {}

  public static getInstance(): ServerLogger {
    if (!ServerLogger.instance) {
      ServerLogger.instance = new ServerLogger();
      this.ensureLogsDirectoryExists();
    }
    return ServerLogger.instance;
  }

  private static async ensureLogsDirectoryExists(): Promise<void> {
    try {
      await fs.access(LOGS_DIR);
    } catch {
      await fs.mkdir(LOGS_DIR, { recursive: true });
    }
  }

  private async logToFile(fileName: string, content: string): Promise<void> {
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
    const logFile = path.join(LOGS_DIR, `${timestamp}_${fileName}.log`);
    await fs.writeFile(logFile, content);
  }

  public async logUserAction(action: string, details: Record<string, any>): Promise<void> {
    const content = `User Action: ${action}\nDetails: ${JSON.stringify(details, null, 2)}\n`;
    await this.logToFile('user_action', content);
  }

  public async logOpenAIResponse(action: string, response: any): Promise<void> {
    const content = `OpenAI Response for ${action}:\n${JSON.stringify(response, null, 2)}\n`;
    await this.logToFile('openai_response', content);
  }

  public async logError(error: Error, context: string): Promise<void> {
    const content = `Error in ${context}:\n${error.message}\nStack: ${error.stack}\n`;
    await this.logToFile('error', content);
  }
}

export const serverLogger = ServerLogger.getInstance();
