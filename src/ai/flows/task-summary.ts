'use server';

/**
 * @fileOverview Summarizes the task breakdown in one short sentence.
 *
 * - summarizeTaskBreakdown - A function that handles the summarization of task breakdown.
 * - SummarizeTaskBreakdownInput - The input type for the summarizeTaskBreakdown function.
 * - SummarizeTaskBreakdownOutput - The return type for the summarizeTaskBreakdown function.
 */

import { z } from 'zod';
import { ai } from '@/ai/openai';

const SummarizeTaskBreakdownInputSchema = z.object({
  taskBreakdown: z
    .string()
    .describe('The detailed breakdown of the task into smaller units.'),
});
export type SummarizeTaskBreakdownInput = z.infer<typeof SummarizeTaskBreakdownInputSchema>;

const SummarizeTaskBreakdownOutputSchema = z.object({
  summary: z.string().describe('A short, one-sentence summary of the task breakdown.'),
  progress: z.string().describe('A short sentence summarizing the summary.'),
});
export type SummarizeTaskBreakdownOutput = z.infer<typeof SummarizeTaskBreakdownOutputSchema>;

export async function summarizeTaskBreakdown(input: SummarizeTaskBreakdownInput): Promise<SummarizeTaskBreakdownOutput> {
  const completion = await ai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: `Summarize the following task breakdown in one short sentence:\n\n${input.taskBreakdown}`
      }
    ],
    temperature: 0.7
  });

  return {
    summary: completion.choices[0].message.content || '',
    progress: 'Summary generated successfully'
  };
}
