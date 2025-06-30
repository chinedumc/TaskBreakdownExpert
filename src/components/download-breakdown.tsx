
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
      const fontSize = 12;
      const lineHeight = fontSize * 1.5;
      const pageWidth = 600;
      const pageHeight = 800;
      const marginX = 50;
      const marginY = 50;
      const headerHeight = 100; // Space for title and date
      
      // Helper function to add a new page with header
      const addNewPage = (pageNum: number) => {
        const page = pdfDoc.addPage([pageWidth, pageHeight]);
        
        if (pageNum === 1) {
          // First page title
          page.drawText('Task Breakdown', {
            x: marginX,
            y: pageHeight - 50,
            size: 20,
            color: rgb(0, 0, 0),
          });

          // Add date
          page.drawText(format(new Date(), 'MMMM d, yyyy'), {
            x: marginX,
            y: pageHeight - 70,
            size: 10,
            color: rgb(0.5, 0.5, 0.5),
          });
          
          return { page, startY: pageHeight - headerHeight };
        } else {
          // Subsequent page header
          page.drawText(`Task Breakdown (Page ${pageNum})`, {
            x: marginX,
            y: pageHeight - 30,
            size: 14,
            color: rgb(0, 0, 0),
          });
          
          return { page, startY: pageHeight - 60 };
        }
      };
      
      let pageNum = 1;
      let { page, startY } = addNewPage(pageNum);
      let currentY = startY;
      
      // Pre-load fonts
      const boldFont = await pdfDoc.embedFont('Helvetica-Bold');
      const regularFont = await pdfDoc.embedFont('Helvetica');
      
      for (let itemIndex = 0; itemIndex < breakdown.length; itemIndex++) {
        const item = breakdown[itemIndex];
        
        // Check if we need a new page for the item header
        if (currentY < marginY + lineHeight * 3) { // Need space for header + at least one task
          pageNum++;
          const newPageData = addNewPage(pageNum);
          page = newPageData.page;
          currentY = newPageData.startY;
        }

        // Draw the week/unit header
        page.drawText(item.unit, {
          x: marginX,
          y: currentY,
          size: fontSize,
          color: rgb(0, 0, 0),
          font: boldFont,
        });
        currentY -= lineHeight * 1.5; // Extra space after header

        // Draw each task
        for (let taskIndex = 0; taskIndex < item.tasks.length; taskIndex++) {
          const task = item.tasks[taskIndex];
          
          // Check if we need a new page for this task
          if (currentY < marginY + lineHeight) {
            pageNum++;
            const newPageData = addNewPage(pageNum);
            page = newPageData.page;
            currentY = newPageData.startY;
          }
          
          // Handle long task text that might need to wrap
          const maxWidth = pageWidth - marginX - 70; // Account for bullet point indent
          const words = task.split(' ');
          let currentLine = '';
          
          for (const word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const textWidth = testLine.length * (fontSize * 0.6); // Approximate text width
            
            if (textWidth > maxWidth && currentLine) {
              // Draw current line and start new line
              page.drawText(`• ${currentLine}`, {
                x: marginX + 10,
                y: currentY,
                size: fontSize,
                color: rgb(0, 0, 0),
                font: regularFont,
              });
              currentY -= lineHeight;
              
              // Check if we need a new page for the next line
              if (currentY < marginY + lineHeight) {
                pageNum++;
                const newPageData = addNewPage(pageNum);
                page = newPageData.page;
                currentY = newPageData.startY;
              }
              
              currentLine = word;
            } else {
              currentLine = testLine;
            }
          }
          
          // Draw the last line
          if (currentLine) {
            const prefix = taskIndex === 0 && currentLine === task ? `• ${task}` : `  ${currentLine}`;
            page.drawText(prefix, {
              x: marginX + 10,
              y: currentY,
              size: fontSize,
              color: rgb(0, 0, 0),
              font: regularFont,
            });
            currentY -= lineHeight;
          }
        }
        
        // Add extra space between weeks
        currentY -= lineHeight * 0.5;
      }

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
