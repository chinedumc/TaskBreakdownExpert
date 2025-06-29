'use server';

/**
 * @fileOverview This file defines a function for breaking down a task into specific, actionable daily sub-tasks
 * based on user input, including their daily time commitment.
 *
 * - taskBreakdown - A function that accepts task details and returns a detailed daily breakdown.
 * - TaskBreakdownInput - The input type for the taskBreakdown function.
 * - TaskBreakdownOutput - The return type for the taskBreakdown function.
 */

import { ai } from '@/ai/openai';
import { ServerLogger } from '@/utils/logger';
const serverLogger = new ServerLogger();
import { z } from 'zod';

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

// Define the function for OpenAI
const taskBreakdownFunction = {
  name: "taskBreakdown",
  description: "Breaks down a task into specific, actionable daily sub-tasks based on user input",
  parameters: {
    type: "object",
    properties: {
      task: {
        type: "string",
        description: "The task to be broken down"
      },
      targetTime: {
        type: "number",
        description: "The target time for completion"
      },
      targetTimeUnit: {
        type: "string",
        enum: ["hours", "days", "months"],
        description: "The unit of time for targetTime"
      },
      planGranularity: {
        type: "string",
        enum: ["daily"],
        description: "The granularity of the plan"
      },
      hoursPerDayCommitment: {
        type: "number",
        description: "The number of hours available per day for the task"
      }
    },
    required: ["task", "targetTime", "targetTimeUnit", "planGranularity", "hoursPerDayCommitment"]
  }
};

export async function taskBreakdown(values: TaskBreakdownInput): Promise<TaskBreakdownOutput> {
  try {
    serverLogger.logUserAction('Task Breakdown Request', {
      task: values.task,
      targetTime: values.targetTime,
      targetTimeUnit: values.targetTimeUnit,
      hoursPerDayCommitment: values.hoursPerDayCommitment
    });

    const response = await ai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system",
          content: "You are a task breakdown expert. Break down tasks into daily actionable sub-tasks."
        },
        { 
          role: "user",
          content: `Break down this task into daily actionable sub-tasks:
          Task: ${values.task}
          Target Time: ${values.targetTime} ${values.targetTimeUnit}
          Daily Commitment: ${values.hoursPerDayCommitment} hours`
        }
      ],
      functions: [taskBreakdownFunction],
      function_call: { name: "taskBreakdown" }
    });

    const choice = response.choices[0];
    if (!choice?.message?.function_call?.arguments) {
      throw new Error('Invalid OpenAI response: missing function call arguments');
    }

    const parsedResponse = TaskBreakdownOutputSchema.parse(choice.message.function_call.arguments);
    await serverLogger.logOpenAIResponse('Task Breakdown', parsedResponse);
    return parsedResponse;
  } catch (error) {
    await serverLogger.logError(error as Error, 'Task Breakdown');
    throw error;
  }
}