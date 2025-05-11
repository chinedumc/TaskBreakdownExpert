"use client";

import type * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Mail, FileText } from 'lucide-react';

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
import type { EmailExportFormValues } from '@/lib/schemas';
import { EmailExportFormSchema } from '@/lib/schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface EmailExportProps {
  onSubmitEmail: (values: EmailExportFormValues) => Promise<void>;
  isExporting: boolean;
}

export function EmailExport({ onSubmitEmail, isExporting }: EmailExportProps): React.JSX.Element {
  const form = useForm<EmailExportFormValues>({
    resolver: zodResolver(EmailExportFormSchema),
    defaultValues: {
      email: '',
    },
  });

  return (
    <Card className="w-full shadow-lg">
       <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <FileText className="h-7 w-7 text-primary" />
          Export Breakdown
        </CardTitle>
        <CardDescription>
          Get your personalized task breakdown sent to your email as a PDF.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmitEmail)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center text-lg">
                    <Mail className="mr-2 h-5 w-5" />
                    Your Email Address
                  </FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} className="text-base" />
                  </FormControl>
                  <FormDescription>
                    We'll send the PDF to this email. (This is a simulated action)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isExporting} className="w-full text-lg py-6">
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Sending PDF...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-5 w-5" />
                  Send PDF to Email
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
