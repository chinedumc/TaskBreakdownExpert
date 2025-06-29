
"use client";

import type { NextPage } from 'next';
// Image component is no longer used for the logo
// import Image from 'next/image'; 
import * as React from 'react';
// BrainCircuit is not used, but kept to avoid breaking imports if re-added.
// import { BrainCircuit } from 'lucide-react'; 

import { TaskInputForm } from '@/components/task-input-form';
import { TaskBreakdownDisplay } from '@/components/task-breakdown-display';
import { EmailExport } from '@/components/email-export';
import { DownloadBreakdown } from '@/components/download-breakdown'; // Added import
// Toaster import removed as it's handled in layout.tsx
import { useToast } from '@/hooks/use-toast';
import type { TaskBreakdownFormValues, EmailExportFormValues } from '@/lib/schemas';
import { ai } from '@/ai/openai';
import { taskBreakdown, type TaskBreakdownOutput } from '@/ai/flows/task-breakdown';
import { logger } from '@/utils/logger';
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

        if (!breakdownOutput.breakdown || breakdownOutput.breakdown.length === 0) {
          throw new Error('No breakdown data received from AI');
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
      toast({
        title: "Task Breakdown Generated!",
        description: "Your detailed plan is ready.",
        variant: "default",
      });
      setIsLoadingBreakdown(false);

      const breakdownText = breakdownOutput.breakdown
        .map(unit => `${unit.unit}:\n- ${unit.tasks.join('\n- ')}\n`)
        .join('\n');
      
      await logger.logUserAction('Summary Request', { breakdownText });
      
      const summaryOutput = await summarizeTaskBreakdown({ taskBreakdown: breakdownText });
      await logger.logOpenAIResponse('Summary', summaryOutput);

      if (!summaryOutput.summary) {
        throw new Error('No summary received from AI');
      }

      setTaskSummary(summaryOutput.summary);
      toast({
        title: "Summary Ready!",
        description: "A concise overview of your plan is available.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error processing task:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      setAiError(`Failed to generate task breakdown: ${errorMessage}. Please try again.`);
      toast({
        title: "Error",
        description: `Failed to generate task breakdown. ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoadingBreakdown(false);
      setIsLoadingSummary(false);
    }
  };

  const handleEmailSubmit = async (values: EmailExportFormValues) => {
    await logger.logUserAction('Email Export Request', values);
    setIsSubmittingEmail(true);
    setAiError(null);
    console.log("Simulating email export to:", values.email);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: "Email Sent (Simulated)",
      description: `Task breakdown would be sent to ${values.email}.`,
      variant: "default",
    });
    setIsSubmittingEmail(false);
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

        <main className="w-full max-w-3xl space-y-12">
          <TaskInputForm onSubmit={handleTaskSubmit} isLoading={isLoadingBreakdown || isLoadingSummary} />

          {aiError && (
             <Alert variant="destructive" className="shadow-md">
              <Terminal className="h-4 w-4" />
              <AlertTitle>AI Processing Error</AlertTitle>
              <AlertDescription>{aiError}</AlertDescription>
            </Alert>
          )}

          {isLoadingBreakdown || isLoadingSummary ? (
             <TaskBreakdownDisplay
               summary={null}
               breakdown={null}
               isLoadingSummary={isLoadingSummary}
               isLoadingBreakdown={isLoadingBreakdown}
             />
           ) : taskBreakdownResult || taskSummary ? (
             <TaskBreakdownDisplay
               summary={taskSummary}
               breakdown={taskBreakdownResult?.breakdown ?? []}
               isLoadingSummary={false}
               isLoadingBreakdown={false}
             />
           ) : null}

          {taskBreakdownResult && !isLoadingBreakdown && !isLoadingSummary && (
            <div className="space-y-6"> {/* Wrapper for consistent spacing */}
              <EmailExport onSubmitEmail={handleEmailSubmit} isExporting={isSubmittingEmail} />
              <DownloadBreakdown breakdown={taskBreakdownResult?.breakdown ?? []} />
            </div>
          )}
        </main>
        <footer className="mt-16 w-full max-w-3xl border-t pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Task Breakdown Expert. Powered by AI.
          </p>
        </footer>
      </div>
      {/* Toaster component removed from here, as it's in layout.tsx */}
    </>
  );
};

export default Home;
