import { z } from 'zod';

export const TaskBreakdownFormSchema = z.object({
  task: z.string().min(3, { message: "Task description must be at least 3 characters long." }).max(500, { message: "Task description must be at most 500 characters long." }),
  targetTime: z.coerce.number().int().positive({ message: "Target duration must be a positive number." }).min(1, {message: "Target duration must be at least 1."}).max(365, { message: "Target duration must be at most 365."}), // Max increased slightly to accommodate ~1 year in days or ~12 months
  targetTimeUnit: z.enum(['hours', 'days', 'months'], {
    errorMap: () => ({ message: "Please select a unit for the target duration." }),
  }),
  planGranularity: z.enum(['hourly', 'daily', 'weekly'], { // Renamed from breakdownUnit
    errorMap: () => ({ message: "Please select a planning granularity." }),
  }),
});

export type TaskBreakdownFormValues = z.infer<typeof TaskBreakdownFormSchema>;

export const EmailExportFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

export type EmailExportFormValues = z.infer<typeof EmailExportFormSchema>;
