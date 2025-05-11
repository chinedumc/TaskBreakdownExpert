"use client";

import type * as React from 'react';
import { CheckCircle, ListChecks, Activity } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { TaskBreakdownOutput } from '@/ai/flows/task-breakdown';

interface TaskBreakdownDisplayProps {
  summary: string | null;
  breakdown: TaskBreakdownOutput['breakdown'] | null;
  isLoadingSummary: boolean;
  isLoadingBreakdown: boolean;
}

export function TaskBreakdownDisplay({
  summary,
  breakdown,
  isLoadingSummary,
  isLoadingBreakdown,
}: TaskBreakdownDisplayProps): React.JSX.Element | null {
  if (isLoadingSummary || isLoadingBreakdown) {
    return (
      <div className="space-y-6 w-full">
        <Card className="shadow-lg">
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-6 w-full" />
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <Skeleton className="h-8 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!summary && !breakdown) {
    return null;
  }

  return (
    <div className="space-y-6 w-full">
      {summary && (
        <Card className="shadow-lg bg-secondary/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Activity className="h-7 w-7 text-primary" />
              AI Summary
            </CardTitle>
            <CardDescription>A concise overview of your task breakdown.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg leading-relaxed">{summary}</p>
          </CardContent>
        </Card>
      )}

      {breakdown && breakdown.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <ListChecks className="h-7 w-7 text-primary" />
              Detailed Breakdown
            </CardTitle>
             <CardDescription>Your step-by-step plan to achieve your goal.</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full" defaultValue={breakdown[0]?.unit}>
              {breakdown.map((item, index) => (
                <AccordionItem value={item.unit || `item-${index}`} key={item.unit || `item-${index}`}>
                  <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                    {item.unit}
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-3 pl-4">
                      {item.tasks.map((task, taskIndex) => (
                        <li key={taskIndex} className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-accent mt-1 shrink-0" />
                          <span className="text-base">{task}</span>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
