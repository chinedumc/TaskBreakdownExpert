
"use client";

import * as React from 'react';
import type { ReactNode } from 'react';
import { DownloadCloud, FileText, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { TaskBreakdownOutput } from '@/ai/flows/task-breakdown';
import { useToast } from '@/hooks/use-toast';
import { PDFDocument, rgb } from 'pdf-lib';
import { format } from 'date-fns';

interface DownloadBreakdownProps {
  breakdown: TaskBreakdownOutput['breakdown'] | null;
}

export function DownloadBreakdown({ breakdown }: DownloadBreakdownProps): React.JSX.Element | null {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  if (!breakdown || breakdown.length === 0) {
    return null;
  }

  const trackDownload = async (downloadType: 'pdf' | 'text') => {
    try {
      await fetch('/api/track-download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ downloadType }),
      });
    } catch (error) {
      console.error('Failed to track download:', error);
      // Don't block the download if tracking fails
    }
  };

  const generatePDF = async () => {
    try {
      setIsLoading(true);
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 800]);
      const fontSize = 12;
      const lineHeight = fontSize * 1.5;
      
      // Add title
      page.drawText('Task Breakdown', {
        x: 50,
        y: 750,
        size: 20,
        color: rgb(0, 0, 0),
      });

      // Add date
      page.drawText(format(new Date(), 'MMMM d, yyyy'), {
        x: 50,
        y: 730,
        size: 10,
        color: rgb(0.5, 0.5, 0.5),
      });

      // Add content
      let currentY = 700;
      for (const item of breakdown) {
        if (currentY < 50) {
          page.drawText('... (continued on next page)', {
            x: 50,
            y: currentY,
            size: fontSize,
            color: rgb(0.5, 0.5, 0.5),
          });
          break;
        }

        const font = await pdfDoc.embedFont('Helvetica-Bold');
        page.drawText(item.unit, {
          x: 50,
          y: currentY,
          size: fontSize,
          color: rgb(0, 0, 0),
          font,
        });
        currentY -= lineHeight;

        item.tasks.forEach(task => {
          if (currentY < 50) {
            page.drawText('... (continued on next page)', {
              x: 50,
              y: currentY,
              size: fontSize,
              color: rgb(0.5, 0.5, 0.5),
            });
            return;
          }
          page.drawText(`- ${task}`, {
            x: 60,
            y: currentY,
            size: fontSize,
            color: rgb(0, 0, 0),
          });
          currentY -= lineHeight;
        });
      };

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'task_breakdown.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'PDF Downloaded',
        description: 'Your task breakdown has been saved as a PDF.',
      });

      // Track the download
      await trackDownload('pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!breakdown || breakdown.length === 0) {
      toast({
        title: "No Breakdown Available",
        description: "Cannot download an empty breakdown.",
        variant: "destructive",
      });
      return;
    }

    const filename = "task_breakdown.txt";
    let content = "Task Breakdown\n\n";
    breakdown.forEach(item => {
      content += `${item.unit}\n`;
      item.tasks.forEach(task => {
        content += `  - ${task}\n`;
      });
      content += "\n";
    });

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Text Downloaded',
      description: 'Your task breakdown has been saved as a text file.',
    });
    
    // Track the download
    trackDownload('text');
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Download Breakdown</CardTitle>
        <CardDescription>Save your task breakdown for future reference.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button
            onClick={handleDownload}
            className="w-full"
            disabled={isLoading}
            variant="outline"
          >
            <FileText className="mr-2 h-4 w-4" />
            Download Text
          </Button>
          <Button
            onClick={generatePDF}
            className="w-full"
            disabled={isLoading}
          >
            <FileDown className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
