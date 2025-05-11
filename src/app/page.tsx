"use client";

import type { NextPage } from 'next';
import Image from 'next/image';
import * as React from 'react';
import { BrainCircuit } from 'lucide-react';

import { TaskInputForm } from '@/components/task-input-form';
import { TaskBreakdownDisplay } from '@/components/task-breakdown-display';
import { EmailExport } from '@/components/email-export';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import type { TaskBreakdownFormValues, EmailExportFormValues } from '@/lib/schemas';
import { taskBreakdown, type TaskBreakdownOutput } from '@/ai/flows/task-breakdown';
import { summarizeTaskBreakdown } from '@/ai/flows/task-summary';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";


const Home: NextPage = () => {
  const { toast } = useToast();
  const [taskSummary, setTaskSummary] = React.useState<string | null>(null);
  const [taskBreakdownResult, setTaskBreakdownResult] = React.useState<TaskBreakdownOutput['breakdown'] | null>(null);
  const [isLoadingBreakdown, setIsLoadingBreakdown] = React.useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = React.useState(false);
  const [isSubmittingEmail, setIsSubmittingEmail] = React.useState(false);
  const [aiError, setAiError] = React.useState<string | null>(null);

  const handleTaskSubmit = async (values: TaskBreakdownFormValues) => {
    setIsLoadingBreakdown(true);
    setIsLoadingSummary(true);
    setTaskSummary(null);
    setTaskBreakdownResult(null);
    setAiError(null);

    try {
      const breakdownOutput = await taskBreakdown(values);
      setTaskBreakdownResult(breakdownOutput.breakdown);
      toast({
        title: "Task Breakdown Generated!",
        description: "Your detailed plan is ready.",
        variant: "default",
      });
      setIsLoadingBreakdown(false);

      // Summarize the breakdown
      if (breakdownOutput.breakdown && breakdownOutput.breakdown.length > 0) {
        const breakdownText = breakdownOutput.breakdown
          .map(unit => `${unit.unit}:\n${unit.tasks.join('\n- ')}\n`)
          .join('\n');
        
        const summaryOutput = await summarizeTaskBreakdown({ taskBreakdown: breakdownText });
        setTaskSummary(summaryOutput.summary);
         toast({
          title: "Summary Ready!",
          description: "A concise overview of your plan is available.",
        });
      }
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
    setIsSubmittingEmail(true);
    setAiError(null);
    console.log("Simulating email export to:", values.email);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // This is where actual PDF generation and email sending logic would go.
    // For now, we'll just show a success toast.
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
             <Image src="https://picsum.photos/80/80" alt="Task Breakdown Expert Logo" width={60} height={60} className="rounded-full" data-ai-hint="productivity brain" />
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

          {(isLoadingBreakdown || isLoadingSummary || taskBreakdownResult || taskSummary) && (
            <TaskBreakdownDisplay
              summary={taskSummary}
              breakdown={taskBreakdownResult}
              isLoadingSummary={isLoadingSummary}
              isLoadingBreakdown={isLoadingBreakdown}
            />
          )}

          {taskBreakdownResult && !isLoadingBreakdown && !isLoadingSummary && (
            <EmailExport onSubmitEmail={handleEmailSubmit} isExporting={isSubmittingEmail} />
          )}
        </main>
        <footer className="mt-16 w-full max-w-3xl border-t pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Task Breakdown Expert. Powered by AI.
          </p>
        </footer>
      </div>
      <Toaster />
    </>
  );
};

export default Home;
