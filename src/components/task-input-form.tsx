"use client";

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BrainCircuit, CalendarDays, ClipboardList, Clock, Hourglass, Loader2, Sparkles, CheckSquare, AlertTriangle, Star } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TaskBreakdownFormValues } from '@/lib/schemas';
import { TaskBreakdownFormSchema } from '@/lib/schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface TaskInputFormProps {
  onSubmit: (values: TaskBreakdownFormValues) => Promise<void>;
  isLoading: boolean;
}

const formDefaultValues: Partial<TaskBreakdownFormValues> = {
  task: '',
  targetTime: undefined,
  targetTimeUnit: 'days',
  planGranularity: 'weekly',
  hoursPerDayCommitment: undefined,
  skillLevel: 'beginner', // Default to beginner
};

function usePrevious<T>(value: T): T | undefined {
  const ref = React.useRef<T>();
  React.useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

export function TaskInputForm({ onSubmit, isLoading }: TaskInputFormProps): React.JSX.Element {
  const form = useForm<TaskBreakdownFormValues>({
    resolver: zodResolver(TaskBreakdownFormSchema),
    defaultValues: formDefaultValues,
  });

  const { watch } = form;
  const watchedTargetTimeUnit = watch('targetTimeUnit');
  const watchedTargetTime = watch('targetTime');
  const watchedHoursPerDayCommitment = watch('hoursPerDayCommitment');

  // Calculate if the current inputs would exceed plan duration limits
  const calculatePlanDuration = () => {
    const targetTime = watchedTargetTime;
    const targetTimeUnit = watchedTargetTimeUnit;
    const hoursPerDay = watchedHoursPerDayCommitment;
    
    // Check for valid numeric values
    if (!targetTime || !targetTimeUnit || !hoursPerDay || 
        typeof targetTime !== 'number' || typeof hoursPerDay !== 'number' ||
        isNaN(targetTime) || isNaN(hoursPerDay) || 
        targetTime <= 0 || hoursPerDay <= 0) {
      return null;
    }
    
    const totalHours = targetTimeUnit === 'days'
        ? targetTime * hoursPerDay
        : targetTime * 30 * hoursPerDay; // months to total hours
    
    const hoursPerWeek = hoursPerDay * 7;
    const totalWeeks = Math.ceil(totalHours / hoursPerWeek);
    
    return { totalWeeks, totalHours, hoursPerWeek };
  };
  
  const planDuration = calculatePlanDuration();
  const isOverLimit = planDuration ? planDuration.totalWeeks > 52 : false;
  const isNearLimit = planDuration ? planDuration.totalWeeks > 40 && planDuration.totalWeeks <= 52 : false;

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <BrainCircuit className="h-8 w-8 text-primary" />
          Describe Your Goal
        </CardTitle>
        <CardDescription>
          Let our AI expert help you break down your goal into a detailed weekly plan with daily tasks based on your commitment.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="task"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center text-lg">
                    <ClipboardList className="mr-2 h-5 w-5" />
                    Task or Goal
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Learn Next.js and build projects each step of the way" {...field} className="text-base placeholder:opacity-40 placeholder:text-muted-foreground"/>
                  </FormControl>
                  <FormDescription>
                    What do you want to achieve? Be specific for better weekly planning results.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="skillLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center text-lg">
                    <Star className="mr-2 h-5 w-5" />
                    Skill Level (Optional)
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="text-base">
                        <SelectValue placeholder="Select your skill level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner - New to this area</SelectItem>
                      <SelectItem value="intermediate">Intermediate - Some experience</SelectItem>
                      <SelectItem value="advanced">Advanced - Experienced practitioner</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Your skill level helps us tailor recommendations. Defaults to Beginner if not selected.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="targetTime"
                render={({ field }) => (
                  <FormItem className="sm:col-span-1">
                    <FormLabel className="flex items-center text-lg">
                      <Clock className="mr-2 h-5 w-5" />
                      Total Task Effort
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="7" 
                        {...field} 
                        value={field.value !== undefined ? String(field.value) : ''}
                        className="text-base [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield] placeholder:opacity-40 placeholder:text-muted-foreground" 
                        min="1"
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            field.onChange(undefined);
                          } else {
                            const numValue = parseInt(value, 10);
                            if (!isNaN(numValue)) {
                              field.onChange(numValue);
                            }
                          }
                        }}
                        onKeyDown={(e) => {
                          // Allow: backspace, delete, tab, escape, enter, decimal point, and arrow keys
                          if ([8, 9, 27, 13, 46, 37, 38, 39, 40].indexOf(e.keyCode) !== -1 ||
                              // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                              (e.ctrlKey === true && [65, 67, 86, 88].indexOf(e.keyCode) !== -1)) {
                            return;
                          }
                          // Ensure that it is a number and stop the keypress
                          if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                            e.preventDefault();
                          }
                        }}
                        onFocus={(e) => {
                          e.target.select(); // Select all text when focused
                        }}
                      />
                    </FormControl>
                     <FormDescription>
                      Estimated total effort needed.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetTimeUnit"
                render={({ field }) => (
                  <FormItem  className="sm:col-span-1">
                    <FormLabel className="flex items-center text-lg">
                       <Hourglass className="mr-2 h-5 w-5" />
                      Effort Unit
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="text-base">
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="days">Days</SelectItem>
                        <SelectItem value="months">Months</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Unit for total task effort.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="hoursPerDayCommitment"
                render={({ field }) => (
                  <FormItem className="sm:col-span-1">
                    <FormLabel className="flex items-center text-lg">
                       <CalendarDays className="mr-2 h-5 w-5" />
                      Daily Commitment
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="2" 
                        {...field}
                        value={field.value !== undefined ? String(field.value) : ''}
                        className="text-base [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield] placeholder:opacity-40 placeholder:text-muted-foreground"
                        min="1"
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            field.onChange(undefined);
                          } else {
                            const numValue = parseInt(value, 10);
                            if (!isNaN(numValue)) {
                              field.onChange(numValue);
                            }
                          }
                        }}
                        onKeyDown={(e) => {
                          // Allow: backspace, delete, tab, escape, enter, decimal point, and arrow keys
                          if ([8, 9, 27, 13, 46, 37, 38, 39, 40].indexOf(e.keyCode) !== -1 ||
                              // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                              (e.ctrlKey === true && [65, 67, 86, 88].indexOf(e.keyCode) !== -1)) {
                            return;
                          }
                          // Ensure that it is a number and stop the keypress
                          if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                            e.preventDefault();
                          }
                        }}
                        onFocus={(e) => {
                          e.target.select(); // Select all text when focused
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Hours you&apos;ll dedicate per day. This determines your weekly time commitment (7 × daily hours).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <FormItem>
                <FormLabel className="flex items-center text-lg">
                    <CheckSquare className="mr-2 h-5 w-5 text-primary" />
                    Plan Structure
                </FormLabel>
                <p className="text-sm text-muted-foreground pt-1">
                    Your tasks will be broken down into a <span className="font-semibold text-foreground">weekly plan</span>.
                </p>
                <FormField
                    control={form.control}
                    name="planGranularity"
                    render={({ field }) => <Input type="hidden" {...field} />}
                />
            </FormItem>
            
            {isOverLimit && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Plan duration exceeds limits:</strong> Your current settings would create a {planDuration?.totalWeeks}-week plan, but the maximum is 52 weeks. 
                  Try reducing the total task effort or increasing your daily commitment.
                </AlertDescription>
              </Alert>
            )}
            
            {isNearLimit && !isOverLimit && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Notice:</strong> Your plan will be {planDuration?.totalWeeks} weeks long. 
                  Consider if this timeline works for your goals.
                </AlertDescription>
              </Alert>
            )}
            
            <Button type="submit" disabled={isLoading || isOverLimit} className="w-full text-lg py-6">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Breaking Down Task...
                </>
              ) : isOverLimit ? (
                <>
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  Plan Exceeds Limits - Adjust Settings
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Detailed Weekly Plan
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
