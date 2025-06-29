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
          Email export is temporarily disabled. Please use the download option to save your learning plan.
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
                    <Input 
                      type="email" 
                      placeholder="Email feature temporarily disabled" 
                      {...field} 
                      className="text-base bg-gray-100 text-gray-500 cursor-not-allowed" 
                      disabled={true}
                    />
                  </FormControl>
                  <FormDescription>
                    Email functionality is temporarily disabled. Please use the download option below to save your learning plan.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={true} className="w-full text-lg py-6 opacity-50 cursor-not-allowed">
              <Mail className="mr-2 h-5 w-5" />
              Email Feature Temporarily Disabled
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
