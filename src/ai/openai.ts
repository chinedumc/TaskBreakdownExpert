import { config } from 'dotenv';
import OpenAI from 'openai';

config(); // Loads .env

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is not set');
}

export const ai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Default model configuration
export const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';