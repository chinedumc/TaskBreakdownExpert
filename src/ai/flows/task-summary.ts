'use server';

/**
 * @fileOverview Summarizes the weekly task breakdown in one short sentence.
 *
 * - summarizeTaskBreakdown - A function that handles the summarization of weekly task breakdown.
 * - SummarizeTaskBreakdownInput - The input type for the summarizeTaskBreakdown function.
 * - SummarizeTaskBreakdownOutput - The return type for the summarizeTaskBreakdown function.
 */

import { z } from 'zod';
import { ai, DEFAULT_MODEL } from '@/ai/openai';

export type SummarizeTaskBreakdownInput = {
  taskBreakdown: string;
};

export type SummarizeTaskBreakdownOutput = {
  summary: string;
  progress: string;
};

const SummarizeTaskBreakdownOutputSchema = z.object({
  summary: z.string().describe('A short, one-sentence summary of the weekly learning plan breakdown.'),
  progress: z.string().describe('A short sentence summarizing the summary generation.'),
});

export async function summarizeTaskBreakdown(input: SummarizeTaskBreakdownInput): Promise<SummarizeTaskBreakdownOutput> {
  const completion = await ai.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [
      {
        role: 'system',
        content: `Summarize the following weekly learning plan breakdown in one short, engaging sentence that highlights the weekly structure and learning progression:\n\n${input.taskBreakdown}`
      }
    ],
    temperature: 0.7
  });

  return {
    summary: completion.choices[0].message.content || '',
    progress: 'Summary generated successfully'
  };
}
