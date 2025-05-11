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
  targetTime: z.number().describe('The numeric value of the target completion duration (e.g., 7).'),
  targetTimeUnit: z.enum(['hours', 'days', 'months']).describe('The unit for the target completion duration (e.g., hours, days, months).'),
  planGranularity: z.enum(['hourly', 'daily', 'weekly']).describe('The desired granularity for breaking down the task (e.g., plan tasks per hour, day, or week).'),
});

export type TaskBreakdownInput = z.infer<typeof TaskBreakdownInputSchema>;

const TaskBreakdownOutputSchema = z.object({
  breakdown: z.array(
    z.object({
      unit: z.string().describe('The time unit (e.g., "Hour 1", "Day 1", "Week 1"), reflecting the planGranularity.'),
      tasks: z.array(z.string()).describe('The list of tasks to be achieved in that time unit.'),
    })
  ).describe('The breakdown of the task into achievable units for each time unit, based on the planGranularity.'),
});

export type TaskBreakdownOutput = z.infer<typeof TaskBreakdownOutputSchema>;

export async function taskBreakdown(input: TaskBreakdownInput): Promise<TaskBreakdownOutput> {
  return taskBreakdownFlow(input);
}

const taskBreakdownPrompt = ai.definePrompt({
  name: 'taskBreakdownPrompt',
  input: {schema: TaskBreakdownInputSchema},
  output: {schema: TaskBreakdownOutputSchema},
  prompt: `You are an expert project manager. Your job is to break down a large task into smaller, achievable units according to a specified planning granularity.

The task to break down is: {{{task}}}
The total target completion time for this task is: {{{targetTime}}} {{{targetTimeUnit}}}.
You should break this down into sub-tasks planned on a {{{planGranularity}}} basis.

Return a JSON object that contains a key called "breakdown".

The "breakdown" key should be an array of objects.
Each object in the breakdown array should represent one period of the specified {{{planGranularity}}} (e.g., if {{{planGranularity}}} is 'daily', then 'Day 1', 'Day 2', etc.; if 'hourly', then 'Hour 1', 'Hour 2', etc.).
Each object should have the following keys:
  - unit: A string describing the planning period (e.g., "Hour 1", "Day 1", "Week 1"). This string must reflect the {{{planGranularity}}}. For instance, if {{{planGranularity}}} is 'daily', units should be "Day 1", "Day 2", ... "Day N", where N is based on the overall {{{targetTime}}} and {{{targetTimeUnit}}}. If {{{planGranularity}}} is 'hourly', units should be "Hour 1", "Hour 2", ..., "Hour M". If {{{planGranularity}}} is 'weekly', units should be "Week 1", "Week 2", ..., "Week P".
  - tasks: An array of strings that describe the tasks to be achieved in that planning period.

Ensure the number of units in the breakdown corresponds appropriately to the overall target completion time ({{{targetTime}}} {{{targetTimeUnit}}}) and the specified {{{planGranularity}}}. For example, if the target is 2 days and granularity is daily, provide 2 daily units. If the target is 1 week and granularity is daily, provide 7 daily units. If the target is 3 hours and granularity is hourly, provide 3 hourly units.

Example (if targetTime is 2, targetTimeUnit is 'days', and planGranularity is 'daily'):
{
  "breakdown": [
    {
      "unit": "Day 1",
      "tasks": [
        "Research the topic",
        "Create an outline",
      ],
    },
    {
      "unit": "Day 2",
      "tasks": [
        "Write the introduction",
        "Write the first section",
      ],
    }
  ]
}

Example (if targetTime is 3, targetTimeUnit is 'hours', and planGranularity is 'hourly'):
{
  "breakdown": [
    {
      "unit": "Hour 1",
      "tasks": [
        "Task A for hour 1",
      ],
    },
    {
      "unit": "Hour 2",
      "tasks": [
        "Task B for hour 2",
      ],
    },
    {
      "unit": "Hour 3",
      "tasks": [
        "Task C for hour 3",
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
