import { z } from 'zod';

export const TaskBreakdownFormSchema = z.object({
  task: z.string().min(3, { message: "Task description must be at least 3 characters long." }).max(500, { message: "Task description must be at most 500 characters long." }),
  targetTime: z.coerce.number().int().positive({ message: "Target duration must be a positive whole number." }).min(1, {message: "Target duration must be at least 1."}).max(36500, { message: "Target duration is too large."}),
  targetTimeUnit: z.enum(['days', 'months'], {
    errorMap: () => ({ message: "Please select a unit for the target duration." }),
  }),
  planGranularity: z.enum(['weekly'], { // Fixed to weekly
    errorMap: () => ({ message: "Planning granularity is set to weekly." }),
  }).default('weekly'),
  hoursPerDayCommitment: z.coerce.number().int({ message: "Daily commitment must be a whole number." })
    .positive({ message: "Daily commitment must be a positive whole number." })
    .min(1, { message: "Please commit at least 1 hour per day." })
    .max(24, { message: "Daily commitment cannot exceed 24 hours." }),
  skillLevel: z.enum(['beginner', 'intermediate', 'advanced'], {
    errorMap: () => ({ message: "Please select a skill level." }),
  }).default('beginner').optional(),
}).refine((data) => {
  // If using days, must be at least 7 days to form complete weeks
  if (data.targetTimeUnit === 'days' && data.targetTime < 7) {
    return false;
  }
  return true;
}, {
  message: "When using days, please specify at least 7 days to create meaningful weekly plans.",
  path: ["targetTime"],
});

export type TaskBreakdownFormValues = z.infer<typeof TaskBreakdownFormSchema>;

export const EmailExportFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

export type EmailExportFormValues = z.infer<typeof EmailExportFormSchema>;
