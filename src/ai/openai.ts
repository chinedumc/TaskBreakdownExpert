import { config } from 'dotenv';
import OpenAI from 'openai';

config(); // Loads .env

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is not set');
}

export const ai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});