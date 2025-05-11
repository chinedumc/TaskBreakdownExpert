import { z } from 'zod';

export const TaskBreakdownFormSchema = z.object({
  task: z.string().min(3, { message: "Task description must be at least 3 characters long." }).max(500, { message: "Task description must be at most 500 characters long." }),
  targetTime: z.coerce.number().int().positive({ message: "Target time must be a positive number." }).min(1).max(100, { message: "Target time must be between 1 and 100."}),
  breakdownUnit: z.enum(['hourly', 'daily', 'weekly'], {
    errorMap: () => ({ message: "Please select a breakdown unit." }),
  }),
});

export type TaskBreakdownFormValues = z.infer<typeof TaskBreakdownFormSchema>;

export const EmailExportFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

export type EmailExportFormValues = z.infer<typeof EmailExportFormSchema>;
