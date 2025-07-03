
"use client";

import type { NextPage } from 'next';
import * as React from 'react';

import { TaskInputForm } from '@/components/task-input-form';
import { TaskBreakdownDisplay } from '@/components/task-breakdown-display';
import { EmailExport } from '@/components/email-export';
import { DownloadBreakdown } from '@/components/download-breakdown';
import { ErrorBoundary } from '@/components/error-boundary';
import { useToast } from '@/hooks/use-toast';
import type { TaskBreakdownFormValues, EmailExportFormValues } from '@/lib/schemas';
import { taskBreakdown, type TaskBreakdownOutput } from '@/ai/flows/task-breakdown';
import { logger } from '@/utils/client-logger';
import { summarizeTaskBreakdown } from '@/ai/flows/task-summary';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";


const Home: NextPage = () => {
  const { toast } = useToast();
  
  const [taskSummary, setTaskSummary] = React.useState<string | null>(null);
  const [taskBreakdownResult, setTaskBreakdownResult] = React.useState<TaskBreakdownOutput | null>(null);
  const [isLoadingBreakdown, setIsLoadingBreakdown] = React.useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = React.useState(false);
  const [isSubmittingEmail, setIsSubmittingEmail] = React.useState(false);
  const [aiError, setAiError] = React.useState<string | null>(null);

  const handleTaskSubmit = async (values: TaskBreakdownFormValues) => {
    await logger.logUserAction('Task Submission', values);
    setIsLoadingBreakdown(true);
    setIsLoadingSummary(true);
    setTaskSummary(null);
    setTaskBreakdownResult(null);
    setAiError(null);

    try {
      await logger.logUserAction('Task Breakdown Request', {
        task: values.task,
        targetTime: values.targetTime,
        targetTimeUnit: values.targetTimeUnit,
        hoursPerDayCommitment: values.hoursPerDayCommitment
      });

      let breakdownOutput;
      try {
        breakdownOutput = await taskBreakdown(values);
        await logger.logOpenAIResponse('Task Breakdown', breakdownOutput);

        if (!breakdownOutput) {
          throw new Error('No response received from AI');
        }
        
        if (!breakdownOutput.breakdown) {
          throw new Error('Breakdown data is missing from AI response');
        }
        
        if (breakdownOutput.breakdown.length === 0) {
          throw new Error('AI returned empty breakdown - please try again with a different task description');
        }
        
        // Validate breakdown structure
        const invalidItems = breakdownOutput.breakdown.filter(item => !item.unit || !item.tasks || item.tasks.length === 0);
        if (invalidItems.length > 0) {
          throw new Error(`AI returned incomplete breakdown data - ${invalidItems.length} items are missing details`);
        }

        // Log successful breakdown
        await logger.logUserAction('Task Breakdown Success', {
          task: values.task,
          breakdownLength: breakdownOutput.breakdown.length
        });

      } catch (breakdownError) {
        const errorMessage = breakdownError instanceof Error ? breakdownError.message : 'Unknown error occurred';
        await logger.logUserAction('Task Breakdown Error', {
          task: values.task,
          error: errorMessage
        });
        throw breakdownError;
      }

      setTaskBreakdownResult(breakdownOutput);
      setIsLoadingBreakdown(false);
      
      toast({
        title: "Task Breakdown Generated!",
        description: "Your detailed plan is ready.",
        variant: "default",
      });

      // Generate summary separately - don't let summary failure affect breakdown display
      try {
        const breakdownText = breakdownOutput.breakdown
          .map(unit => `${unit.unit}:\n- ${unit.tasks.join('\n- ')}\n`)
          .join('\n');
        
        await logger.logUserAction('Summary Request', { breakdownText });
        
        const summaryOutput = await summarizeTaskBreakdown({ taskBreakdown: breakdownText });
        await logger.logOpenAIResponse('Summary', summaryOutput);

        if (summaryOutput.summary) {
          setTaskSummary(summaryOutput.summary);
          toast({
            title: "Summary Ready!",
            description: "A concise overview of your plan is available.",
            variant: "default",
          });
        }
      } catch (summaryError) {
        console.warn("Summary generation failed, but breakdown is still available:", summaryError);
        // Don't throw - allow breakdown to display without summary
      }
    } catch (error) {
      console.error("Error processing task:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      
      // Provide more specific guidance based on the error type
      let userFriendlyMessage = errorMessage;
      if (errorMessage.includes("too long for a single generation")) {
        userFriendlyMessage = `${errorMessage}\n\nTip: Try reducing your target time, or increase your daily hours commitment to complete the goal faster.`;
      } else if (errorMessage.includes("JSON") || errorMessage.includes("parse")) {
        userFriendlyMessage = "AI response formatting error. Please try again - this is usually temporary.";
      } else if (errorMessage.includes("token") || errorMessage.includes("limit")) {
        userFriendlyMessage = "Your request is too complex for the AI to process. Please try breaking it into smaller goals or reducing the time frame.";
      } else if (errorMessage.includes("rate") || errorMessage.includes("429") || errorMessage.includes("high demand") || errorMessage.includes("upstream")) {
        userFriendlyMessage = "The AI service is currently experiencing high demand. Please wait a moment and try again. This is usually temporary.";
      } else if (errorMessage.includes("503") || errorMessage.includes("502") || errorMessage.includes("504") || errorMessage.includes("temporarily unavailable")) {
        userFriendlyMessage = "The AI service is temporarily unavailable. Please try again in a few minutes.";
      } else if (errorMessage.includes("network") || errorMessage.includes("connection")) {
        userFriendlyMessage = "Network connection issue. Please check your internet connection and try again.";
      }
      
      setAiError(userFriendlyMessage);
      toast({
        title: "Error",
        description: userFriendlyMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const handleEmailSubmit = async (values: EmailExportFormValues) => {
    await logger.logUserAction('Email Export Request', values);
    setIsSubmittingEmail(true);
    setAiError(null);
    
    try {
      if (!taskBreakdownResult) {
        throw new Error('No task breakdown available to send');
      }

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: values.email,
          taskBreakdown: {
            task: taskBreakdownResult.breakdown.length > 0 ? 
              `Learning plan with ${taskBreakdownResult.breakdown.length} weeks` : 
              'Your learning plan',
            breakdown: taskBreakdownResult.breakdown,
            summary: taskSummary || undefined
          }
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send email');
      }

      toast({
        title: "Email Sent Successfully! 📧",
        description: `Your personalized learning plan has been sent to ${values.email}.`,
        variant: "default",
      });
      
      await logger.logUserAction('Email Export Success', { 
        email: values.email, 
        messageId: result.messageId 
      });
      
    } catch (error) {
      console.error('Failed to send email:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: "Email Failed to Send",
        description: `Failed to send email: ${errorMessage}. Please try again.`,
        variant: "destructive",
      });
      
      await logger.logUserAction('Email Export Error', { 
        email: values.email, 
        error: errorMessage 
      });
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  return (
    <>
      <div className="container mx-auto flex min-h-screen flex-col items-center px-4 py-8 sm:py-12 md:py-16">
        <header className="mb-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-14 w-14 text-primary">
              <path d="M12.75 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM7.5 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM8.25 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM9.75 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM10.5 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM12.75 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM14.25 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM15 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM16.5 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM15 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM16.5 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" />
              <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3A.75.75 0 0 1 18 3v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5Z" clipRule="evenodd" />
            </svg>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Task Breakdown <span className="text-primary">Expert</span>
            </h1>
          </div>
          <p className="mt-3 text-lg text-muted-foreground sm:text-xl md:mt-5 md:text-2xl">
            Turn your ambitious goals into actionable steps with AI.
          </p>
        </header>

        <main className="w-full max-w-4xl space-y-12">
          <ErrorBoundary>
            <TaskInputForm onSubmit={handleTaskSubmit} isLoading={isLoadingBreakdown || isLoadingSummary} />
          </ErrorBoundary>

          {aiError && (
             <Alert variant="destructive" className="shadow-md">
              <Terminal className="h-4 w-4" />
              <AlertTitle>AI Processing Error</AlertTitle>
              <AlertDescription className="whitespace-pre-line">{aiError}</AlertDescription>
            </Alert>
          )}

          <ErrorBoundary>
            {isLoadingBreakdown || isLoadingSummary ? (
               <TaskBreakdownDisplay
                 summary={null}
                 breakdown={null}
                 isLoadingSummary={isLoadingSummary}
                 isLoadingBreakdown={isLoadingBreakdown}
               />
             ) : taskBreakdownResult ? (
               <TaskBreakdownDisplay
                 summary={taskSummary}
                 breakdown={taskBreakdownResult.breakdown}
                 isLoadingSummary={isLoadingSummary}
                 isLoadingBreakdown={isLoadingBreakdown}
               />
             ) : null}
          </ErrorBoundary>

          <ErrorBoundary>
            {taskBreakdownResult && !isLoadingBreakdown && !isLoadingSummary && (
              <div className="space-y-6">
                <EmailExport onSubmitEmail={handleEmailSubmit} isExporting={isSubmittingEmail} />
                <DownloadBreakdown 
                  breakdown={taskBreakdownResult?.breakdown ?? []} 
                  onDownload={() => {}} 
                />
              </div>
            )}
          </ErrorBoundary>
        </main>
        <footer className="mt-16 w-full max-w-4xl border-t pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Task Breakdown Expert. Powered by AI.
          </p>
        </footer>
      </div>
    </>
  );
};

export default Home;
