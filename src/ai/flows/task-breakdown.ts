'use server';

/**
 * @fileOverview This file defines a function for breaking down a task into specific, actionable weekly learning plans
 * with daily breakdowns based on user input, including their daily time commitment.
 *
 * - taskBreakdown - A function that accepts task details and returns a detailed weekly learning breakdown.
 * - TaskBreakdownInput - The input type for the taskBreakdown function.
 * - TaskBreakdownOutput - The return type for the taskBreakdown function.
 */

import { ai, DEFAULT_MODEL } from '@/ai/openai';
import { ServerLogger } from '@/utils/logger';
const serverLogger = new ServerLogger();
import { z } from 'zod';

const TaskBreakdownInputSchema = z.object({
  task: z.string().describe('The task or goal to be achieved.'),
  targetTime: z.number().describe('The numeric value of the total estimated effort for the task (e.g., 7).'),
  targetTimeUnit: z.enum(['hours', 'days', 'months']).describe('The unit for the total estimated effort (e.g., hours, days, months).'),
  planGranularity: z.enum(['weekly']).describe('The planning granularity, fixed to weekly.'),
  hoursPerDayCommitment: z.number().min(1).max(24).describe('The number of hours the user commits to working on the task per day.'),
});

export type TaskBreakdownInput = z.infer<typeof TaskBreakdownInputSchema>;

const TaskBreakdownOutputSchema = z.object({
  breakdown: z.array(
    z.object({
      unit: z.string().describe('The time unit, e.g., "Week 1 (X hours total)", where X is the weekly time commitment.'),
      tasks: z.array(z.string()).describe('A list of specific, actionable sub-tasks to be achieved during that week, fitting within the weekly committed hours.'),
    })
  ).describe('The detailed weekly breakdown of the task into specific, actionable sub-tasks.'),
});

export type TaskBreakdownOutput = z.infer<typeof TaskBreakdownOutputSchema>;

// Using direct JSON response format instead of function calling for better reliability

export async function taskBreakdown(values: TaskBreakdownInput): Promise<TaskBreakdownOutput> {
  try {
    // Calculate total weeks needed
    const totalHours = values.targetTimeUnit === 'hours'
      ? values.targetTime
      : values.targetTimeUnit === 'days'
        ? values.targetTime * values.hoursPerDayCommitment
        : values.targetTime * 30 * values.hoursPerDayCommitment; // months to total hours
    
    const hoursPerWeek = values.hoursPerDayCommitment * 7; // hours per day * 7 days
    const totalWeeks = Math.ceil(totalHours / hoursPerWeek);

    serverLogger.logUserAction('Task Breakdown Request', {
      task: values.task,
      targetTime: values.targetTime,
      targetTimeUnit: values.targetTimeUnit,
      hoursPerDayCommitment: values.hoursPerDayCommitment,
      calculatedTotalWeeks: totalWeeks,
      totalHours: totalHours,
      hoursPerWeek: hoursPerWeek
    });

    // For very long curricula, we might hit token limits
    if (totalWeeks > 104) { // More than 2 years
      throw new Error(`Plan duration of ${totalWeeks} weeks is too long for a single generation. Please reduce target time or increase daily commitment hours.`);
    }

    // Log the calculation for debugging
    console.log(`Generating ${totalWeeks} weeks for ${values.targetTime} ${values.targetTimeUnit} at ${values.hoursPerDayCommitment} hours/day (${hoursPerWeek} hours/week)`);

    const response = await ai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { 
          role: "system",
          content: `You are an expert learning consultant who creates highly detailed, actionable weekly learning plans. You MUST respond with a valid JSON object that matches this exact structure:

{
  "breakdown": [
    {
      "unit": "Week 1 (${hoursPerWeek} hours total - ${values.hoursPerDayCommitment} hours/day)",
      "tasks": [
        "WEEKLY GOAL: By end of week, you will have [specific skill/understanding achieved]",
        "Day-by-day breakdown:",
        "• Monday (${values.hoursPerDayCommitment}h): [Specific learning tasks and goals]",
        "• Tuesday (${values.hoursPerDayCommitment}h): [Specific learning tasks and goals]", 
        "• Wednesday (${values.hoursPerDayCommitment}h): [Specific learning tasks and goals]",
        "• Thursday (${values.hoursPerDayCommitment}h): [Specific learning tasks and goals]",
        "• Friday (${values.hoursPerDayCommitment}h): [Specific learning tasks and goals]",
        "• Saturday (${values.hoursPerDayCommitment}h): [Specific learning tasks and goals]",
        "• Sunday (${values.hoursPerDayCommitment}h): [Specific learning tasks and goals]",
        "WEEK END MILESTONE: [What learner should be able to do/demonstrate]"
      ]
    }
  ]
}

CRITICAL REQUIREMENTS:
1. Break down high-level learning goals into weekly modules with specific daily objectives
2. Start each week with "WEEKLY GOAL: By end of week, you will have [specific measurable outcome]"
3. Include day-by-day breakdown showing exactly what to focus on each day
4. Use action verbs: Download, Install, Create, Configure, Write, Test, Debug, Practice, Study, Build
5. Include specific file names, URLs, commands, tools, or learning resources where applicable
6. Each day should have realistic learning goals fitting within ${values.hoursPerDayCommitment} hours
7. **MANDATORY: End each week with "WEEK END MILESTONE: [What learner should be able to do/demonstrate]"**
8. Ensure logical progression from week to week, building on previous knowledge

IMPORTANT: Respond ONLY with valid JSON. No markdown, no explanations, just the JSON object.`
        },
        { 
          role: "user",
          content: `Create a detailed weekly learning curriculum for: ${values.task}

SPECIFICATIONS:
- Total Duration: ${values.targetTime} ${values.targetTimeUnit}
- Daily Time: ${values.hoursPerDayCommitment} hours per day
- Weekly Time: ${hoursPerWeek} hours per week
- Skill Level: Assume beginner unless task specifies otherwise

DURATION CALCULATION:
- Total Hours Needed: ${totalHours} hours
- Hours Per Week: ${hoursPerWeek} hours (${values.hoursPerDayCommitment} hours/day × 7 days)
- Total Weeks Required: ${totalWeeks} weeks

🚨 CRITICAL REQUIREMENT - READ CAREFULLY:
You MUST generate exactly ${totalWeeks} weekly entries in the "breakdown" array. 

DO NOT STOP EARLY! DO NOT GENERATE ONLY A FEW WEEKS!

The breakdown array must contain ${totalWeeks} objects, numbered from Week 1 to Week ${totalWeeks}.

${totalWeeks > 12 
  ? `This is a ${totalWeeks}-week comprehensive learning curriculum spanning approximately ${Math.ceil(totalWeeks / 4.33)} months. Create a clear progression from beginner to advanced level across all ${totalWeeks} weeks.`
  : ''
}

EXAMPLES of the specificity required for weekly learning plans:

BAD: "Learn the basics this week"
GOOD: 
"WEEKLY GOAL: By end of week, you will have a working development environment and completed your first functional project"
"Day-by-day breakdown:"
"• Monday (${values.hoursPerDayCommitment}h): Download and install SDK, set up IDE, verify installation with 'hello world'"
"• Tuesday (${values.hoursPerDayCommitment}h): Study basic syntax through official documentation and beginner tutorials"
"• Wednesday (${values.hoursPerDayCommitment}h): Practice variables, data types, and basic operations with coding exercises"
"• Thursday (${values.hoursPerDayCommitment}h): Learn control structures (if/else, loops) through guided practice problems"
"• Friday (${values.hoursPerDayCommitment}h): Study functions and scope through practical examples and mini-projects"
"• Saturday (${values.hoursPerDayCommitment}h): Build a simple calculator project combining all week's concepts"
"• Sunday (${values.hoursPerDayCommitment}h): Code review, debugging practice, and preparation for next week's advanced topics"
"WEEK END MILESTONE: Complete a functional calculator app that demonstrates all basic programming concepts learned this week"

REQUIRED FORMAT:
- Start each week with "WEEKLY GOAL: By end of week, you will have [specific learning outcome]"
- Include day-by-day breakdown with specific daily learning objectives
- Include specific learning resources, documentation links, tutorial URLs, or tools for each day
- Add practical projects/exercises that demonstrate weekly learning progress
- Ensure logical progression from week to week, building on previous knowledge
- Each week should total exactly ${hoursPerWeek} hours (${values.hoursPerDayCommitment} hours × 7 days)
- **MANDATORY: Every single week MUST end with "WEEK END MILESTONE: [Specific achievement/project/demonstration]"**

EXAMPLE STRUCTURE for ${totalWeeks} weeks:
{
  "breakdown": [
    { "unit": "Week 1 (${hoursPerWeek} hours total - ${values.hoursPerDayCommitment} hours/day)", "tasks": [...] },
    { "unit": "Week 2 (${hoursPerWeek} hours total - ${values.hoursPerDayCommitment} hours/day)", "tasks": [...] },
    { "unit": "Week 3 (${hoursPerWeek} hours total - ${values.hoursPerDayCommitment} hours/day)", "tasks": [...] },
    ...continue this pattern...
    { "unit": "Week ${totalWeeks} (${hoursPerWeek} hours total - ${values.hoursPerDayCommitment} hours/day)", "tasks": [...] }
  ]
}

🚨 THE BREAKDOWN ARRAY MUST HAVE EXACTLY ${totalWeeks} OBJECTS 🚨

🎯 CRITICAL REMINDER: Every single week's tasks array must end with "WEEK END MILESTONE: [specific achievement]"

Respond with valid JSON only.`
        }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const choice = response.choices[0];
    
    // Enhanced debugging
    console.log('OpenAI Response:', JSON.stringify(response.choices[0], null, 2));
    
    if (!choice?.message?.content) {
      console.error('OpenAI response structure:', choice);
      throw new Error('Invalid OpenAI response: missing message content');
    }

    const contentString = choice.message.content;
    console.log('Response content:', contentString);
    
    let parsedArgs;
    try {
      parsedArgs = JSON.parse(contentString);
      console.log('Parsed response:', JSON.stringify(parsedArgs, null, 2));
    } catch (parseError) {
      console.error('Failed to parse JSON response:', contentString);
      throw new Error(`Failed to parse OpenAI response: ${parseError}`);
    }

    // Validate the structure before Zod parsing
    if (!parsedArgs.breakdown) {
      console.error('Missing breakdown in parsed response:', parsedArgs);
      throw new Error('OpenAI response missing breakdown field');
    }

    const parsedResponse = TaskBreakdownOutputSchema.parse(parsedArgs);
    
    // Ensure we have valid breakdown data
    if (!parsedResponse.breakdown || parsedResponse.breakdown.length === 0) {
      throw new Error('OpenAI returned empty breakdown');
    }

    // Validate that we got the expected number of weeks
    const expectedWeeks = totalWeeks;
    const actualWeeks = parsedResponse.breakdown.length;
    
    if (actualWeeks < expectedWeeks) {
      console.warn(`OpenAI generated ${actualWeeks} weeks but expected ${expectedWeeks} weeks`);
      
      // For now, we'll accept partial results but log the issue
      if (actualWeeks < Math.min(4, expectedWeeks)) {
        throw new Error(`OpenAI only generated ${actualWeeks} weeks out of expected ${expectedWeeks}. This is insufficient for a meaningful curriculum.`);
      }
    }
    
    await serverLogger.logOpenAIResponse('Task Breakdown', parsedResponse);
    return parsedResponse;
  } catch (error) {
    await serverLogger.logError(error as Error, 'Task Breakdown');
    throw error;
  }
}