"use client";

import * as React from 'react';
import { CheckCircle, ListChecks, Activity, Quote } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { TaskBreakdownOutput } from '@/ai/flows/task-breakdown';
import { getRandomQuote, formatQuote } from '@/utils/quotes';

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
  // Get a random quote when the component mounts
  const [inspirationalQuote] = React.useState(() => getRandomQuote());

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
      {/* Inspirational Quote Card */}
      {(summary || breakdown) && (
        <Card className="shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-blue-900">
              <Quote className="h-6 w-6 text-blue-600" />
              Daily Inspiration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <blockquote className="text-blue-800 italic text-lg leading-relaxed">
              {formatQuote(inspirationalQuote)}
            </blockquote>
          </CardContent>
        </Card>
      )}

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
              Detailed Breakdown ({breakdown.length} weeks)
            </CardTitle>
             <CardDescription>
               Your step-by-step weekly learning plan to achieve your goal. Each week includes daily breakdowns and milestone achievements.
               {breakdown.length > 12 && (
                 <span className="block mt-1 text-sm font-medium text-primary">
                   This is a comprehensive {breakdown.length}-week curriculum - click each week to expand details.
                 </span>
               )}
             </CardDescription>
          </CardHeader>
          <CardContent>
            {breakdown.length > 24 ? (
              // Group by months for very long curricula (>6 months)
              <div className="space-y-6">
                {Array.from({ length: Math.ceil(breakdown.length / 4) }, (_, monthIndex) => {
                  const monthStart = monthIndex * 4;
                  const monthEnd = Math.min(monthStart + 4, breakdown.length);
                  const monthWeeks = breakdown.slice(monthStart, monthEnd);
                  
                  return (
                    <div key={monthIndex} className="border rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-3 text-primary">
                        Month {monthIndex + 1} (Weeks {monthStart + 1}-{monthEnd})
                      </h3>
                      <Accordion type="single" collapsible className="w-full">
                        {monthWeeks.map((item, weekIndex) => {
                          const globalIndex = monthStart + weekIndex;
                          return (
                            <AccordionItem 
                              value={item.unit || `item-${globalIndex}`} 
                              key={item.unit || `item-${globalIndex}`}
                            >
                              <AccordionTrigger className="text-base font-medium hover:no-underline">
                                {item.unit}
                              </AccordionTrigger>
                              <AccordionContent>
                                <ul className="space-y-3 pl-4">
                                  {item.tasks.map((task, taskIndex) => (
                                    <li key={taskIndex} className="flex items-start gap-3">
                                      <CheckCircle className="h-4 w-4 text-accent mt-1 shrink-0" />
                                      <span className="text-sm">{task}</span>
                                    </li>
                                  ))}
                                </ul>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Original display for shorter curricula
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
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
