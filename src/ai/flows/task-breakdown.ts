'use server';

/**
 * @fileOverview This file defines a Genkit flow for breaking down a task into achievable units based on user input.
 *
 * - taskBreakdown - A function that accepts task details and returns a breakdown of the task into achievable units.
 * - TaskBreakdownInput - The input type for the taskBreakdown function.
 * - TaskBreakdownOutput - The return type for the taskBreakdown function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TaskBreakdownInputSchema = z.object({
  task: z.string().describe('The task or goal to be achieved.'),
  targetTime: z.number().describe('The target completion time (e.g., number of hours, days, or weeks).'),
  breakdownUnit: z.enum(['hourly', 'daily', 'weekly']).describe('The units for breaking down the task.'),
});

export type TaskBreakdownInput = z.infer<typeof TaskBreakdownInputSchema>;

const TaskBreakdownOutputSchema = z.object({
  breakdown: z.array(
    z.object({
      unit: z.string().describe('The time unit (hour, day, or week).'),
      tasks: z.array(z.string()).describe('The list of tasks to be achieved in that time unit.'),
    })
  ).describe('The breakdown of the task into achievable units for each time unit.'),
});

export type TaskBreakdownOutput = z.infer<typeof TaskBreakdownOutputSchema>;

export async function taskBreakdown(input: TaskBreakdownInput): Promise<TaskBreakdownOutput> {
  return taskBreakdownFlow(input);
}

const taskBreakdownPrompt = ai.definePrompt({
  name: 'taskBreakdownPrompt',
  input: {schema: TaskBreakdownInputSchema},
  output: {schema: TaskBreakdownOutputSchema},
  prompt: `You are an expert project manager. Your job is to break down a large task into smaller, achievable units.

  The task to break down is: {{{task}}}
  The target completion time is: {{{targetTime}}} {{{breakdownUnit}}}

  Return a JSON object that contains a key called "breakdown".

  The "breakdown" key should be an array of objects.
  Each object in the breakdown array should have the following keys:
    - unit: The time unit (hour, day, or week)
    - tasks: An array of strings that describe the tasks to be achieved in that time unit.

  Example:
  {
    "breakdown": [
      {
        "unit": "day 1",
        "tasks": [
          "Research the topic",
          "Create an outline",
        ],
      },
      {
        "unit": "day 2",
        "tasks": [
          "Write the introduction",
          "Write the first section",
        ],
      }
    ]
  }
  `,
});

const taskBreakdownFlow = ai.defineFlow(
  {
    name: 'taskBreakdownFlow',
    inputSchema: TaskBreakdownInputSchema,
    outputSchema: TaskBreakdownOutputSchema,
  },
  async input => {
    const {output} = await taskBreakdownPrompt(input);
    return output!;
  }
);
