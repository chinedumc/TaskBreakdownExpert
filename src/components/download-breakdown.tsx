
"use client";

import type * as React from 'react';
import { DownloadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { TaskBreakdownOutput } from '@/ai/flows/task-breakdown';
import { useToast } from '@/hooks/use-toast';

interface DownloadBreakdownProps {
  breakdown: TaskBreakdownOutput['breakdown'] | null;
}

export function DownloadBreakdown({ breakdown }: DownloadBreakdownProps): React.JSX.Element | null {
  const { toast } = useToast();

  if (!breakdown || breakdown.length === 0) {
    // Do not render the card if there's no breakdown data
    return null;
  }

  const handleDownload = () => {
    if (!breakdown || breakdown.length === 0) {
      toast({
        title: "No Breakdown Available",
        description: "Cannot download an empty breakdown.",
        variant: "destructive",
      });
      return;
    }

    let content = "My Task Breakdown\n\n";
    breakdown.forEach(item => {
      content += `${item.unit}\n`;
      item.tasks.forEach(task => {
        content += `  - ${task}\n`;
      });
      content += "\n";
    });

    const filename = "task_breakdown.txt";
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Clean up

    toast({
      title: "Download Started",
      description: `${filename} is being downloaded.`,
      variant: "default",
    });
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <DownloadCloud className="h-7 w-7 text-primary" />
          Download Your Breakdown
        </CardTitle>
        <CardDescription>
          Save your personalized task breakdown as a plain text (.txt) file.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleDownload} className="w-full text-lg py-6">
          <DownloadCloud className="mr-2 h-5 w-5" />
          Download as .txt File
        </Button>
      </CardContent>
    </Card>
  );
}
