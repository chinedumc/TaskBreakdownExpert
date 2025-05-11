'use server';

/**
 * @fileOverview This file defines a Genkit flow for breaking down a task into specific, actionable daily sub-tasks
 * based on user input, including their daily time commitment.
 *
 * - taskBreakdown - A function that accepts task details and returns a detailed daily breakdown.
 * - TaskBreakdownInput - The input type for the taskBreakdown function.
 * - TaskBreakdownOutput - The return type for the taskBreakdown function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TaskBreakdownInputSchema = z.object({
  task: z.string().describe('The task or goal to be achieved.'),
  targetTime: z.number().describe('The numeric value of the total estimated effort for the task (e.g., 7).'),
  targetTimeUnit: z.enum(['hours', 'days', 'months']).describe('The unit for the total estimated effort (e.g., hours, days, months).'),
  planGranularity: z.enum(['daily']).describe('The planning granularity, fixed to daily.'),
  hoursPerDayCommitment: z.number().min(1).max(24).describe('The number of hours the user commits to working on the task per day.'),
});

export type TaskBreakdownInput = z.infer<typeof TaskBreakdownInputSchema>;

const TaskBreakdownOutputSchema = z.object({
  breakdown: z.array(
    z.object({
      unit: z.string().describe('The time unit, e.g., "Day 1 (X hours focus)", where X is the daily commitment.'),
      tasks: z.array(z.string()).describe('A list of specific, actionable sub-tasks to be achieved that day, fitting within the daily committed hours.'),
    })
  ).describe('The detailed daily breakdown of the task into specific, actionable sub-tasks.'),
});

export type TaskBreakdownOutput = z.infer<typeof TaskBreakdownOutputSchema>;

export async function taskBreakdown(input: TaskBreakdownInput): Promise<TaskBreakdownOutput> {
  return taskBreakdownFlow(input);
}

const taskBreakdownPrompt = ai.definePrompt({
  name: 'taskBreakdownPrompt',
  input: {schema: TaskBreakdownInputSchema},
  output: {schema: TaskBreakdownOutputSchema},
  prompt: `You are an expert project manager and learning coach. Your job is to break down a large task into a detailed daily plan composed of smaller, highly specific, and actionable sub-tasks.

TASK DETAILS:
- The main task or goal: {{{task}}}
- Total estimated effort for this task: {{{targetTime}}} {{{targetTimeUnit}}}.
- User's daily commitment: {{{hoursPerDayCommitment}}} hours per day.
- Planning granularity: Daily (this is fixed).

CONVERSION GUIDELINES FOR TOTAL EFFORT:
- If {{{targetTimeUnit}}} is 'hours', TotalEffortInHours is {{{targetTime}}}.
- If {{{targetTimeUnit}}} is 'days', assume 1 day of effort = 8 hours. So, TotalEffortInHours = {{{targetTime}}} * 8.
- If {{{targetTimeUnit}}} is 'months', assume 1 month of effort = 20 working days, and 1 working day = 8 hours. So, TotalEffortInHours = {{{targetTime}}} * 20 * 8.

PLAN GENERATION REQUIREMENTS:
1.  Calculate the TotalEffortInHours based on {{{targetTime}}} and {{{targetTimeUnit}}} using the conversion guidelines above.
2.  Determine the number of days required for the plan: NumberOfDays = ceil(TotalEffortInHours / {{{hoursPerDayCommitment}}}).
3.  Create a daily plan spanning these NumberOfDays. Each day in the plan should be labeled as "Day N (X hours focus)", where N is the day number and X is {{{hoursPerDayCommitment}}}.
4.  For each day, list specific, actionable sub-tasks. Each sub-task in the 'tasks' array must be a single, concrete step.
    - BAD: "Learn about Next.js features."
    - GOOD:
        - "Read the official Next.js documentation on 'File-based Routing'."
        - "Watch a tutorial explaining Server Components in Next.js."
        - "Complete exercise 3 from the Next.js beginner course focusing on API routes."
5.  The combined sub-tasks for each day must be realistically achievable within the user's {{{hoursPerDayCommitment}}}-hour daily commitment.
6.  The entire set of daily plans must comprehensively cover the main task.

OUTPUT JSON FORMAT:
Return a JSON object that contains a key called "breakdown".
The "breakdown" key should be an array of objects.
Each object in the breakdown array represents one day of the plan and should have:
  - unit: A string describing the day and commitment (e.g., "Day 1 ({{{hoursPerDayCommitment}}} hours focus)").
  - tasks: An array of strings. Each string is a single, specific, actionable sub-task.

EXAMPLE (if task is "Learn basic cooking", targetTime is 10, targetTimeUnit is 'hours', and hoursPerDayCommitment is 2):
TotalEffortInHours = 10 hours.
NumberOfDays = ceil(10 / 2) = 5 days.

{
  "breakdown": [
    {
      "unit": "Day 1 (2 hours focus)",
      "tasks": [
        "Research basic knife skills: Watch three introductory videos on YouTube about holding a knife and basic cuts (dice, chop, mince).",
        "Practice dicing an onion: Follow a video guide and dice one medium onion.",
        "Learn about mise en place: Read an article explaining its importance in cooking."
      ]
    },
    {
      "unit": "Day 2 (2 hours focus)",
      "tasks": [
        "Understand heat control: Read about different heat levels (low, medium, high) and their uses for stovetop cooking.",
        "Cook a simple scrambled egg: Focus on controlling heat to achieve desired texture.",
        "Learn to boil water and cook pasta: Follow package instructions for 100g of pasta."
      ]
    },
    // ... (Day 3, Day 4, Day 5 with similarly detailed tasks for 2 hours each)
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