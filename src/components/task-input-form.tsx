"use client";

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BrainCircuit, CalendarDays, ClipboardList, Clock, Hourglass, Loader2, Sparkles, CheckSquare, AlertTriangle } from 'lucide-react';

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

const formDefaultValues: TaskBreakdownFormValues = {
  task: '',
  targetTime: 7,
  targetTimeUnit: 'days',
  planGranularity: 'weekly',
  hoursPerDayCommitment: 2,
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

  const { watch, setValue, getValues } = form;
  const watchedTargetTimeUnit = watch('targetTimeUnit');
  const watchedTargetTime = watch('targetTime');
  const watchedHoursPerDayCommitment = watch('hoursPerDayCommitment');
  
  const prevTargetTimeUnit = usePrevious(watchedTargetTimeUnit);

  const [userDefinedDailyCommitment, setUserDefinedDailyCommitment] = React.useState(
    formDefaultValues.hoursPerDayCommitment
  );

  React.useEffect(() => {
  }, [watchedTargetTimeUnit, watchedTargetTime, setValue, getValues, prevTargetTimeUnit, userDefinedDailyCommitment]);

  // Calculate if the current inputs would exceed plan duration limits
  const calculatePlanDuration = () => {
    const targetTime = watchedTargetTime;
    const targetTimeUnit = watchedTargetTimeUnit;
    const hoursPerDay = watchedHoursPerDayCommitment;
    
    // Check for valid numeric values
    if (!targetTime || !targetTimeUnit || !hoursPerDay || 
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
                    <Input placeholder="e.g., Learn Next.js and build projects each step of the way" {...field} className="text-base"/>
                  </FormControl>
                  <FormDescription>
                    What do you want to achieve? Be specific for better weekly planning results.
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
                        placeholder="e.g., 7" 
                        {...field} 
                        value={field.value !== undefined ? String(field.value) : ''}
                        className="text-base" 
                        min="1"
                        onChange={(e) => {
                          const value = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                          field.onChange(value);
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
                        placeholder="e.g., 2" 
                        {...field}
                        value={field.value !== undefined ? String(field.value) : ''}
                        className="text-base"
                        min="1"
                        onChange={(e) => {
                          const value = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                          field.onChange(value); // Propagate change to RHF
                          if (value && !isNaN(value)) {
                            setUserDefinedDailyCommitment(value);
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Hours you'll dedicate per day. This determines your weekly time commitment (7 × daily hours).
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
            
            {isNearLimit && !isOverLimit && (
              <div className="rounded-md bg-yellow-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12.79V22H3V2h9.21M21 12.79L12.79 3M3 12.79L11.21 21" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-yellow-800">
                      Your plan is approaching the maximum duration limit of 52 weeks.
                    </p>
                    <p className="mt-1 text-sm text-yellow-600">
                      Consider reviewing your task breakdown and commitments.
                    </p>
                  </div>
                </div>
              </div>
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
