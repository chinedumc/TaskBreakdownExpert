'use server';

/**
 * @fileOverview Summarizes the task breakdown in one short sentence.
 *
 * - summarizeTaskBreakdown - A function that handles the summarization of task breakdown.
 * - SummarizeTaskBreakdownInput - The input type for the summarizeTaskBreakdown function.
 * - SummarizeTaskBreakdownOutput - The return type for the summarizeTaskBreakdown function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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
  return summarizeTaskBreakdownFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeTaskBreakdownPrompt',
  input: {schema: SummarizeTaskBreakdownInputSchema},
  output: {schema: SummarizeTaskBreakdownOutputSchema},
  prompt: `Summarize the following task breakdown in one short sentence:\n\n{{{taskBreakdown}}}`,config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const summarizeTaskBreakdownFlow = ai.defineFlow(
  {
    name: 'summarizeTaskBreakdownFlow',
    inputSchema: SummarizeTaskBreakdownInputSchema,
    outputSchema: SummarizeTaskBreakdownOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return {
      ...output!,
      progress: 'The AI has summarized the task breakdown into one short sentence.',
    };
  }
);
