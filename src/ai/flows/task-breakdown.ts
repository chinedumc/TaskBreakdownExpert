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
import { AnalyticsLogger } from '@/utils/analytics-logger';
const serverLogger = new ServerLogger();
const analyticsLogger = new AnalyticsLogger();
import { z } from 'zod';

const TaskBreakdownInputSchema = z.object({
  task: z.string().describe('The task or goal to be achieved.'),
  targetTime: z.number().describe('The numeric value of the total estimated effort for the task (e.g., 7).'),
  targetTimeUnit: z.enum(['days', 'months']).describe('The unit for the total estimated effort (e.g., days, months).'),
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

// Function to clean and validate JSON response with advanced recovery
function cleanAndParseJSON(jsonString: string): any {
  try {
    // First, try to parse as-is
    return JSON.parse(jsonString);
  } catch (error) {
    console.log('Initial JSON parse failed, attempting advanced cleaning...');
    
    // Clean common JSON issues
    let cleaned = jsonString
      .replace(/[\u201C\u201D]/g, '"') // Replace curly quotes with straight quotes
      .replace(/[\u2018\u2019]/g, "'") // Replace curly apostrophes
      .replace(/\r\n/g, ' ') // Replace Windows line endings
      .replace(/\n/g, ' ') // Replace newlines with spaces
      .replace(/\r/g, ' ') // Replace carriage returns
      .replace(/\t/g, ' ') // Replace tabs
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
    
    // Try to find and extract just the JSON object
    const jsonStart = cleaned.indexOf('{');
    let jsonEnd = cleaned.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
      
      try {
        // Try parsing the extracted JSON
        const parsed = JSON.parse(cleaned);
        console.log('Successfully parsed JSON after cleaning');
        return parsed;
      } catch (parseError) {
        console.log('Cleaned JSON still invalid, attempting reconstruction...');
        
        // If the JSON is incomplete, try to complete it
        if (!cleaned.endsWith('}')) {
          // Find the last complete array element and close properly
          const lastCompleteTasksEnd = cleaned.lastIndexOf('"]');
          const lastCompleteObjectEnd = cleaned.lastIndexOf('}');
          
          if (lastCompleteTasksEnd > lastCompleteObjectEnd) {
            // We have an incomplete tasks array, close it properly
            const beforeIncomplete = cleaned.substring(0, lastCompleteTasksEnd + 2);
            cleaned = beforeIncomplete + '}]}';
          } else if (lastCompleteObjectEnd > 0) {
            // We have an incomplete object, close the breakdown array
            const beforeIncomplete = cleaned.substring(0, lastCompleteObjectEnd + 1);
            cleaned = beforeIncomplete + ']}';
          }
          
          try {
            const parsed = JSON.parse(cleaned);
            console.log('Successfully parsed JSON after completion');
            return parsed;
          } catch (finalError) {
            console.log('JSON completion failed, falling back to manual reconstruction');
          }
        }
      }
    }
    
    // Last resort: try to manually reconstruct the JSON
    return attemptManualJSONReconstruction(jsonString);
  }
}

// Manual JSON reconstruction for severely malformed responses
function attemptManualJSONReconstruction(jsonString: string): any {
  try {
    console.log('Attempting manual JSON reconstruction...');
    console.log('Input string preview:', jsonString.substring(0, 500));
    
    // Try multiple approaches to extract week data
    let reconstructedWeeks: any[] = [];
    
    // Approach 1: Try to extract complete week objects with better regex
    const weekObjectMatches = jsonString.match(/\{\s*"unit":\s*"[^"]*Week\s+\d+[^"]*"[^}]*"tasks":\s*\[[^\]]*\]\s*\}/g);
    
    if (weekObjectMatches && weekObjectMatches.length > 0) {
      console.log(`Found ${weekObjectMatches.length} complete week objects`);
      
      reconstructedWeeks = weekObjectMatches.map((weekMatch, index) => {
        try {
          const cleanMatch = weekMatch.replace(/\s+/g, ' ').trim();
          return JSON.parse(cleanMatch);
        } catch (err) {
          console.warn(`Failed to parse week object ${index + 1}, creating fallback`);
          return {
            unit: `Week ${index + 1} (fallback)`,
            tasks: [`Fallback task for week ${index + 1} - original parsing failed`]
          };
        }
      });
    } else {
      // Approach 2: Try to extract unit and tasks separately
      console.log('No complete week objects found, trying separate extraction...');
      
      const unitMatches = jsonString.match(/"unit":\s*"[^"]*Week\s+\d+[^"]*"/g);
      const tasksMatches = jsonString.match(/"tasks":\s*\[[^\]]*\]/g);
      
      if (unitMatches && tasksMatches) {
        const maxWeeks = Math.min(unitMatches.length, tasksMatches.length);
        console.log(`Found ${unitMatches.length} units and ${tasksMatches.length} task arrays, using ${maxWeeks}`);
        
        for (let i = 0; i < maxWeeks; i++) {
          try {
            const unitPart = unitMatches[i];
            const tasksPart = tasksMatches[i];
            const weekObject = `{${unitPart},${tasksPart}}`;
            reconstructedWeeks.push(JSON.parse(weekObject));
          } catch (err) {
            console.warn(`Failed to reconstruct week ${i + 1}, creating fallback`);
            reconstructedWeeks.push({
              unit: `Week ${i + 1} (reconstructed)`,
              tasks: [`Reconstructed task for week ${i + 1} - original parsing failed`]
            });
          }
        }
      } else {
        // Approach 3: Create minimal fallback structure
        console.log('All extraction approaches failed, creating minimal fallback');
        
        // Try to count how many weeks were mentioned
        const weekNumbers = jsonString.match(/Week\s+(\d+)/g);
        const numWeeks = weekNumbers ? Math.max(...weekNumbers.map(w => parseInt(w.match(/\d+/)?.[0] || '1'))) : 1;
        
        for (let i = 1; i <= Math.min(numWeeks, 12); i++) { // Cap at 12 weeks for safety
          reconstructedWeeks.push({
            unit: `Week ${i} (fallback - original response was malformed)`,
            tasks: [
              `Review original task breakdown request`,
              `Continue working on the main goal`,
              `WEEK END MILESTONE: Complete week ${i} objectives`
            ]
          });
        }
      }
    }
    
    if (reconstructedWeeks.length === 0) {
      throw new Error('Could not extract any valid week objects from response');
    }
    
    console.log(`Successfully reconstructed ${reconstructedWeeks.length} weeks from malformed JSON`);
    
    return {
      breakdown: reconstructedWeeks
    };
    
  } catch (error) {
    console.error('Manual reconstruction failed:', error);
    throw new Error(`Complete JSON parsing failure: ${error}`);
  }
}

// Using direct JSON response format instead of function calling for better reliability

export async function taskBreakdown(values: TaskBreakdownInput): Promise<TaskBreakdownOutput> {
  try {
    // Calculate total weeks needed
    const totalHours = values.targetTimeUnit === 'days'
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
    if (totalWeeks > 52) { // More than 12 months
      throw new Error(`Plan duration of ${totalWeeks} weeks is too long for a single generation. Please reduce target time to 12 months maximum or increase daily commitment hours to complete the goal faster.`);
    }

    // Log the calculation for debugging
    console.log(`Generating ${totalWeeks} weeks for ${values.targetTime} ${values.targetTimeUnit} at ${values.hoursPerDayCommitment} hours/day (${hoursPerWeek} hours/week)`);

    // For larger requests (>12 weeks), use chunked approach for better reliability
    let result;
    if (totalWeeks > 12) {
      result = await generateChunkedBreakdown(values, totalWeeks, hoursPerWeek);
    } else {
      result = await generateSingleBreakdown(values, totalWeeks, hoursPerWeek);
    }

    // Track successful task breakdown generation
    analyticsLogger.incrementTaskBreakdowns(values.task);
    
    return result;
  } catch (error) {
    await serverLogger.logError(error as Error, 'Task Breakdown');
    throw error;
  }
}

// Generate breakdown in a single request (for shorter curricula)
async function generateSingleBreakdown(values: TaskBreakdownInput, totalWeeks: number, hoursPerWeek: number): Promise<TaskBreakdownOutput> {
  const totalHours = values.targetTimeUnit === 'days'
      ? values.targetTime * values.hoursPerDayCommitment
      : values.targetTime * 30 * values.hoursPerDayCommitment;

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

⚠️ JSON SAFETY REQUIREMENTS:
- Use only straight quotes in JSON strings, never curly quotes
- Avoid apostrophes or use "will" instead of "you'll" 
- Replace any special characters that might break JSON
- Keep task descriptions concise and avoid very long strings
- Use simple punctuation only (periods, commas, colons)
- Do not include newlines within JSON string values

CRITICAL REQUIREMENTS:
1. Break down high-level learning goals into weekly modules with specific daily objectives
2. Start each week with "WEEKLY GOAL: By end of week, you will have [specific measurable outcome]"
3. Include day-by-day breakdown showing exactly what to focus on each day
4. Use action verbs: Download, Install, Create, Configure, Write, Test, Debug, Practice, Study, Build
5. Include specific file names, URLs, commands, tools, or learning resources where applicable
6. Each day should have realistic learning goals fitting within ${values.hoursPerDayCommitment} hours
7. **MANDATORY: End each week with "WEEK END MILESTONE: [What learner should be able to do/demonstrate]"**
8. Ensure logical progression from week to week, building on previous knowledge

IMPORTANT: Respond ONLY with valid JSON. No markdown, no explanations, just the JSON object.

VISUAL TEMPLATE FOR EACH WEEK (follow this exact structure):

Week X (${hoursPerWeek} hours total - ${values.hoursPerDayCommitment} hours/day)
├── WEEKLY GOAL: By end of week, you will have [specific outcome]
├── Day-by-day breakdown:
├── • Monday (${values.hoursPerDayCommitment}h): [specific learning task]
├── • Tuesday (${values.hoursPerDayCommitment}h): [specific learning task]
├── • Wednesday (${values.hoursPerDayCommitment}h): [specific learning task]
├── • Thursday (${values.hoursPerDayCommitment}h): [specific learning task]
├── • Friday (${values.hoursPerDayCommitment}h): [specific learning task]
├── • Saturday (${values.hoursPerDayCommitment}h): [specific learning task]
├── • Sunday (${values.hoursPerDayCommitment}h): [specific learning task]
└── WEEK END MILESTONE: [demonstrable achievement/project completion]`
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

⚠️ JSON FORMAT SAFETY:
- Use only straight quotes (") in JSON, never curly quotes
- Replace any apostrophes with "will" instead of "you'll"
- Keep descriptions concise to avoid JSON parsing issues
- Do not include line breaks or special characters in task strings

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
      max_tokens: Math.min(16384, Math.max(4096, totalWeeks * 200)), // Better token allocation
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
    console.log('Response content length:', contentString.length);
    console.log('Response content preview (first 500 chars):', contentString.substring(0, 500));
    console.log('Response content ending (last 200 chars):', contentString.substring(Math.max(0, contentString.length - 200)));
    
    // Check if response looks like it might be truncated
    if (!contentString.includes('}') || !contentString.includes(']')) {
      console.warn('Response appears to be missing closing brackets - may be truncated');
    }
    
    let parsedArgs;
    try {
      parsedArgs = cleanAndParseJSON(contentString);
      console.log('Successfully parsed JSON response');
    } catch (parseError) {
      console.error('Failed to parse JSON response after cleaning:', parseError);
      console.error('Full response content:', contentString);
      
      // Create a basic fallback structure
      console.log('Creating fallback structure due to parsing failure');
      parsedArgs = {
        breakdown: Array.from({ length: Math.min(totalWeeks, 12) }, (_, i) => ({
          unit: `Week ${i + 1} (${hoursPerWeek} hours total - ${values.hoursPerDayCommitment} hours/day)`,
          tasks: [
            `WEEKLY GOAL: By end of week ${i + 1}, you will have made significant progress on: ${values.task}`,
            `Day-by-day breakdown:`,
            `• Monday (${values.hoursPerDayCommitment}h): Research and planning for this week's objectives`,
            `• Tuesday (${values.hoursPerDayCommitment}h): Begin core learning activities`,
            `• Wednesday (${values.hoursPerDayCommitment}h): Continue with practical exercises`,
            `• Thursday (${values.hoursPerDayCommitment}h): Apply knowledge through hands-on practice`,
            `• Friday (${values.hoursPerDayCommitment}h): Build or complete specific project components`,
            `• Saturday (${values.hoursPerDayCommitment}h): Review, test, and refine your work`,
            `• Sunday (${values.hoursPerDayCommitment}h): Consolidate learning and prepare for next week`,
            `WEEK END MILESTONE: Complete week ${i + 1} objectives related to ${values.task}`
          ]
        }))
      };
    }

    // Validate the structure before Zod parsing
    if (!parsedArgs.breakdown) {
      console.error('Missing breakdown in parsed response:', parsedArgs);
      throw new Error('OpenAI response missing breakdown field');
    }

    let parsedResponse;
    try {
      parsedResponse = TaskBreakdownOutputSchema.parse(parsedArgs);
    } catch (zodError) {
      console.error('Zod validation failed:', zodError);
      console.log('Attempting to fix common structure issues...');
      
      // Try to fix common structure issues
      const fixedArgs = {
        breakdown: Array.isArray(parsedArgs.breakdown) 
          ? parsedArgs.breakdown.map((week: any, index: number) => ({
              unit: typeof week.unit === 'string' ? week.unit : `Week ${index + 1} (${hoursPerWeek} hours total)`,
              tasks: Array.isArray(week.tasks) ? week.tasks.filter((task: any) => typeof task === 'string') : 
                     [`Default task for week ${index + 1}`, `WEEK END MILESTONE: Complete week ${index + 1} objectives`]
            }))
          : []
      };
      
      try {
        parsedResponse = TaskBreakdownOutputSchema.parse(fixedArgs);
        console.log('Successfully parsed after fixing structure issues');
      } catch (secondZodError) {
        console.error('Second Zod validation also failed:', secondZodError);
        throw new Error(`Failed to validate response structure: ${secondZodError}`);
      }
    }
    
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
}

// Generate breakdown in chunks for very large curricula
async function generateChunkedBreakdown(values: TaskBreakdownInput, totalWeeks: number, hoursPerWeek: number): Promise<TaskBreakdownOutput> {
  console.log(`Generating chunked breakdown for ${totalWeeks} weeks`);
  
  const chunkSize = 8; // Generate 8 weeks at a time
  const chunks = Math.ceil(totalWeeks / chunkSize);
  const allBreakdown: Array<{ unit: string; tasks: string[] }> = [];
  
  for (let chunkIndex = 0; chunkIndex < chunks; chunkIndex++) {
    const startWeek = chunkIndex * chunkSize + 1;
    const endWeek = Math.min((chunkIndex + 1) * chunkSize, totalWeeks);
    const weeksInChunk = endWeek - startWeek + 1;
    
    console.log(`Generating chunk ${chunkIndex + 1}/${chunks}: weeks ${startWeek}-${endWeek}`);
    
    try {
      const chunkResult = await generateWeekChunk(values, startWeek, endWeek, weeksInChunk, hoursPerWeek, totalWeeks);
      allBreakdown.push(...chunkResult.breakdown);
      
      // Small delay between chunks to avoid rate limiting
      if (chunkIndex < chunks - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`Failed to generate chunk ${chunkIndex + 1}:`, error);
      // Continue with other chunks even if one fails
      
      // Generate fallback weeks for this chunk
      for (let week = startWeek; week <= endWeek; week++) {
        allBreakdown.push({
          unit: `Week ${week} (${hoursPerWeek} hours total - ${values.hoursPerDayCommitment} hours/day)`,
          tasks: [
            `WEEKLY GOAL: By end of week ${week}, you will have made significant progress in ${values.task}`,
            "Day-by-day breakdown:",
            `• Monday (${values.hoursPerDayCommitment}h): Focus on core concepts and fundamentals`,
            `• Tuesday (${values.hoursPerDayCommitment}h): Practice and hands-on exercises`,
            `• Wednesday (${values.hoursPerDayCommitment}h): Study advanced topics and techniques`,
            `• Thursday (${values.hoursPerDayCommitment}h): Work on practical projects and applications`,
            `• Friday (${values.hoursPerDayCommitment}h): Review and reinforce learning`,
            `• Saturday (${values.hoursPerDayCommitment}h): Build and test implementations`,
            `• Sunday (${values.hoursPerDayCommitment}h): Prepare for next week and consolidate knowledge`,
            `WEEK END MILESTONE: Complete week ${week} learning objectives and demonstrate progress`
          ]
        });
      }
    }
  }
  
  return { breakdown: allBreakdown };
}

// Generate a specific chunk of weeks
async function generateWeekChunk(
  values: TaskBreakdownInput, 
  startWeek: number, 
  endWeek: number, 
  weeksInChunk: number, 
  hoursPerWeek: number,
  totalWeeks: number
): Promise<TaskBreakdownOutput> {
  const progressContext = totalWeeks > 12 
    ? `This is weeks ${startWeek}-${endWeek} of a ${totalWeeks}-week curriculum. ${startWeek === 1 ? 'Start with fundamentals.' : startWeek <= totalWeeks / 3 ? 'Build on previous weeks foundation.' : startWeek <= 2 * totalWeeks / 3 ? 'Focus on intermediate to advanced topics.' : 'Complete advanced topics and capstone projects.'}`
    : '';

  const response = await ai.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [
      { 
        role: "system",
        content: `You are an expert learning consultant creating detailed weekly learning plans. Generate EXACTLY ${weeksInChunk} weeks numbered ${startWeek} through ${endWeek}.

CRITICAL JSON REQUIREMENTS:
- Use only straight quotes (") never curly quotes or apostrophes
- Keep task descriptions under 100 characters each
- Use simple punctuation only (periods, commas, colons)
- No special characters that could break JSON
- Each week must have exactly 10 tasks in this order:
  1. "WEEKLY GOAL: [outcome]"
  2. "Day-by-day breakdown:"
  3. "• Monday (${values.hoursPerDayCommitment}h): [task]"
  4. "• Tuesday (${values.hoursPerDayCommitment}h): [task]"
  5. "• Wednesday (${values.hoursPerDayCommitment}h): [task]"
  6. "• Thursday (${values.hoursPerDayCommitment}h): [task]"
  7. "• Friday (${values.hoursPerDayCommitment}h): [task]"
  8. "• Saturday (${values.hoursPerDayCommitment}h): [task]"
  9. "• Sunday (${values.hoursPerDayCommitment}h): [task]"
  10. "WEEK END MILESTONE: [achievement]"

JSON Structure:
{
  "breakdown": [
    {
      "unit": "Week ${startWeek} (${hoursPerWeek} hours total - ${values.hoursPerDayCommitment} hours/day)",
      "tasks": [exactly 10 items as specified above]
    }
  ]
}`
      },
      { 
        role: "user",
        content: `Generate weeks ${startWeek}-${endWeek} for: ${values.task}

Context: ${progressContext}
Daily commitment: ${values.hoursPerDayCommitment} hours
Weekly total: ${hoursPerWeek} hours

Keep descriptions concise and focused. Generate EXACTLY ${weeksInChunk} weeks.

Respond with valid JSON only.`
      }
    ],
    temperature: 0.1,
    max_tokens: weeksInChunk * 400, // More conservative token limit
    response_format: { type: "json_object" }
  });

  const choice = response.choices[0];
  if (!choice?.message?.content) {
    throw new Error('Invalid OpenAI response: missing content');
  }

  const parsedArgs = cleanAndParseJSON(choice.message.content);
  
  if (!parsedArgs.breakdown || !Array.isArray(parsedArgs.breakdown)) {
    throw new Error('Invalid chunk response structure');
  }

  return TaskBreakdownOutputSchema.parse(parsedArgs);
}