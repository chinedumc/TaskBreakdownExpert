
"use client";

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BrainCircuit, CalendarDays, ClipboardList, Clock, Hourglass, Loader2, Sparkles, CheckSquare } from 'lucide-react';

import { Button } from '@/components/ui/button';
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
  planGranularity: 'daily',
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
  
  const prevTargetTimeUnit = usePrevious(watchedTargetTimeUnit);

  const [userDefinedDailyCommitment, setUserDefinedDailyCommitment] = React.useState(
    formDefaultValues.hoursPerDayCommitment
  );

  React.useEffect(() => {
    const currentTargetTime = getValues('targetTime'); // Already coerced by Zod if valid

    if (watchedTargetTimeUnit === 'hours') {
      // Entering 'hours' mode or targetTime changed within 'hours' mode
      if (prevTargetTimeUnit !== 'hours' && prevTargetTimeUnit !== undefined) { 
        // Store the current user-set daily commitment if we are just switching to 'hours'
        setUserDefinedDailyCommitment(getValues('hoursPerDayCommitment'));
      }
      
      let newDailyCommitment = 1; // Default to 1 hour
      if (typeof currentTargetTime === 'number' && !isNaN(currentTargetTime) && currentTargetTime > 0) {
        // Ensure commitment is at least 1 and at most 24, and not more than the task itself if task is short
        newDailyCommitment = Math.max(1, Math.min(currentTargetTime, 24));
      }
      setValue('hoursPerDayCommitment', newDailyCommitment, { shouldValidate: true, shouldDirty: true });
    } else {
      // Entering 'days' or 'months' mode
      if (prevTargetTimeUnit === 'hours') {
        // Restore the previously user-defined commitment when switching away from 'hours'
        setValue('hoursPerDayCommitment', userDefinedDailyCommitment, { shouldValidate: true, shouldDirty: true });
      }
      // If always in 'days'/'months' mode, hoursPerDayCommitment is user-controlled via the input field's onChange.
    }
  }, [watchedTargetTimeUnit, watchedTargetTime, setValue, getValues, prevTargetTimeUnit, userDefinedDailyCommitment]);

  const isDailyCommitmentDisabled = watchedTargetTimeUnit === 'hours';

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <BrainCircuit className="h-8 w-8 text-primary" />
          Describe Your Goal
        </CardTitle>
        <CardDescription>
          Let our AI expert help you break down your goal into manageable daily steps based on your commitment.
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
                    <Input placeholder="e.g., Learn Next.js and build a project" {...field} className="text-base"/>
                  </FormControl>
                  <FormDescription>
                    What do you want to achieve? Be specific for better results.
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
                      <Input type="number" placeholder="e.g., 7" {...field} className="text-base"/>
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
                        <SelectItem value="hours">Hours</SelectItem>
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
                        className="text-base"
                        disabled={isDailyCommitmentDisabled}
                        onChange={(e) => {
                          const value = parseInt(e.target.value, 10);
                          field.onChange(value); // Propagate change to RHF
                          if (!isDailyCommitmentDisabled && !isNaN(value)) {
                            setUserDefinedDailyCommitment(value);
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Hours you'll dedicate per day.
                      {isDailyCommitmentDisabled && " (Auto-set for 'hours' unit)"}
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
                    Your tasks will be broken down into a <span className="font-semibold text-foreground">daily plan</span>.
                </p>
                <FormField
                    control={form.control}
                    name="planGranularity"
                    render={({ field }) => <Input type="hidden" {...field} />}
                />
            </FormItem>
            
            <Button type="submit" disabled={isLoading} className="w-full text-lg py-6">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Breaking Down Task...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Detailed Daily Plan
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
