"use client";

import type * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BrainCircuit, CalendarDays, ClipboardList, Clock, Loader2, Sparkles } from 'lucide-react';

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

export function TaskInputForm({ onSubmit, isLoading }: TaskInputFormProps): React.JSX.Element {
  const form = useForm<TaskBreakdownFormValues>({
    resolver: zodResolver(TaskBreakdownFormSchema),
    defaultValues: {
      task: '',
      targetTime: 1,
      breakdownUnit: 'daily',
    },
  });

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <BrainCircuit className="h-8 w-8 text-primary" />
          Describe Your Goal
        </CardTitle>
        <CardDescription>
          Let our AI expert help you break down your goal into manageable steps.
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

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="targetTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-lg">
                      <Clock className="mr-2 h-5 w-5" />
                      Target Time
                    </FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 7" {...field} className="text-base"/>
                    </FormControl>
                     <FormDescription>
                      How long do you have to complete it? (e.g. 7 for 7 days/weeks/hours)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="breakdownUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-lg">
                       <CalendarDays className="mr-2 h-5 w-5" />
                      Breakdown Unit
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="text-base">
                          <SelectValue placeholder="Select a unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      How should the task be broken down?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Button type="submit" disabled={isLoading} className="w-full text-lg py-6">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Breaking Down Task...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Breakdown
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
