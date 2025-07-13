'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Mail, RefreshCw, Users } from 'lucide-react';
import { sendEmail, type SendEmailRequest } from '@/lib/email-client';
// Auth removed - demo mode
import { FormSkeleton } from '@/components/skeletons/AuthSkeleton';

export default function EmailForm() {
  const [user, setUser] = useState<any>(null);
  const [currentOrganization, setCurrentOrganization] = useState<any>(null);
  const [formData, setFormData] = useState<SendEmailRequest>({
    to: '',
    subject: '',
    html: '',
    text: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    data?: any;
  } | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await sendEmail(formData);

      if (response.success) {
        setResult({
          success: true,
          message: response.message || 'Email sent successfully!',
          data: response.data,
        });
        
        // Reset form on success
        setFormData({
          to: '',
          subject: '',
          html: '',
          text: '',
        });
      } else {
        setResult({
          success: false,
          message: response.error || 'Failed to send email',
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Send Email via Resend
        </CardTitle>
        {currentOrganization && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>Sending from: {currentOrganization.name}</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {result && (
          <Alert className={`mb-4 ${result.success ? 'border-green-200 bg-green-50' : ''}`} variant={result.success ? 'default' : 'destructive'}>
            {result.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              {result.message}
              {result.data && (
                <div className="mt-2 text-sm">
                  <strong>Email ID:</strong> {result.data.id}
                  <br />
                  <strong>Recipients:</strong> {result.data.recipients?.join(', ')}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="to">To (Email Address)</Label>
            <Input
              id="to"
              name="to"
              type="email"
              placeholder="recipient@example.com"
              value={formData.to}
              onChange={handleInputChange}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              name="subject"
              type="text"
              placeholder="Email subject"
              value={formData.subject}
              onChange={handleInputChange}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="text">Text Content</Label>
            <Textarea
              id="text"
              name="text"
              placeholder="Plain text email content"
              value={formData.text}
              onChange={handleInputChange}
              rows={4}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="html">HTML Content (Optional)</Label>
            <Textarea
              id="html"
              name="html"
              placeholder="<h1>HTML email content</h1>"
              value={formData.html}
              onChange={handleInputChange}
              rows={6}
              disabled={loading}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Sending Email...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-sm mb-2">Quick Examples:</h3>
          <div className="space-y-2 text-xs">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFormData({
                to: 'test@example.com',
                subject: 'Test Email',
                text: 'This is a test email sent via Resend API.',
                html: '<h1>Test Email</h1><p>This is a <strong>test email</strong> sent via Resend API.</p>',
              })}
              disabled={loading}
            >
              Load Test Email
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFormData({
                to: 'welcome@example.com',
                subject: 'Welcome to Our Platform!',
                text: 'Welcome! Thank you for joining our platform. We\'re excited to have you on board.',
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #2563eb;">Welcome to Our Platform!</h1>
                    <p>Thank you for joining our platform. We're excited to have you on board.</p>
                    <a href="#" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Get Started</a>
                  </div>
                `,
              })}
              disabled={loading}
            >
              Load Welcome Email
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
