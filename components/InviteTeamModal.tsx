'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, UserPlus, AlertCircle, CheckCircle, X } from 'lucide-react';
import { inviteUserToOrganization } from '@/lib/auth';
import { sendEmail } from '@/lib/email-client';
import { useAuth } from '@/components/providers/AuthProvider';

interface InviteTeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function InviteTeamModal({
  open,
  onOpenChange,
  onSuccess,
}: InviteTeamModalProps) {
  const { currentOrganization, user } = useAuth();
  const [emails, setEmails] = useState<string[]>([]);
  const [currentEmail, setCurrentEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<string[]>([]);

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const addEmail = () => {
    const email = currentEmail.trim().toLowerCase();
    
    if (!email) return;
    
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    if (emails.includes(email)) {
      setError('This email is already in the list');
      return;
    }
    
    if (email === user?.email) {
      setError('You cannot invite yourself');
      return;
    }
    
    setEmails([...emails, email]);
    setCurrentEmail('');
    setError('');
  };

  const removeEmail = (emailToRemove: string) => {
    setEmails(emails.filter(email => email !== emailToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addEmail();
    }
  };

  const sendInvitationEmail = async (email: string, organizationName: string) => {
    const inviteUrl = `${window.location.origin}/login?invite=${currentOrganization?.id}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Team Invitation</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden;">
            <div style="background: #2563eb; color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">You're Invited!</h1>
            </div>
            <div style="padding: 30px;">
              <p style="font-size: 16px; margin-bottom: 20px;">
                <strong>${user?.name}</strong> has invited you to join <strong>${organizationName}</strong> on Slack Summary Scribe.
              </p>
              <p style="margin-bottom: 30px;">
                Slack Summary Scribe helps teams stay organized with AI-powered conversation summaries and team collaboration tools.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${inviteUrl}" style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
                  Accept Invitation
                </a>
              </div>
              <p style="font-size: 14px; color: #666; margin-top: 30px;">
                If you don't want to receive these emails, you can ignore this invitation.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      You're invited to join ${organizationName}!
      
      ${user?.name} has invited you to join ${organizationName} on Slack Summary Scribe.
      
      Slack Summary Scribe helps teams stay organized with AI-powered conversation summaries and team collaboration tools.
      
      Accept your invitation: ${inviteUrl}
      
      If you don't want to receive these emails, you can ignore this invitation.
    `;

    return sendEmail({
      to: email,
      subject: `Invitation to join ${organizationName} on Slack Summary Scribe`,
      html,
      text,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentOrganization) {
      setError('No organization selected');
      return;
    }

    if (emails.length === 0) {
      setError('Please add at least one email address');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess([]);

    const successfulInvites: string[] = [];

    try {
      for (const email of emails) {
        try {
          // Add user to organization
          await inviteUserToOrganization(email, currentOrganization.id, role);
          
          // Send invitation email
          await sendInvitationEmail(email, currentOrganization.name);
          
          successfulInvites.push(email);
        } catch (error) {
          console.error(`Failed to invite ${email}:`, error);
          // Continue with other invitations
        }
      }

      setSuccess(successfulInvites);
      
      if (successfulInvites.length === emails.length) {
        // All invitations successful
        setTimeout(() => {
          onOpenChange(false);
          onSuccess?.();
          resetForm();
        }, 2000);
      } else {
        // Some failed
        setError(`${emails.length - successfulInvites.length} invitation(s) failed to send`);
      }

    } catch (error) {
      console.error('Error sending invitations:', error);
      setError('Failed to send invitations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmails([]);
    setCurrentEmail('');
    setRole('member');
    setError('');
    setSuccess([]);
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Team Members
          </DialogTitle>
          <DialogDescription>
            Invite people to join {currentOrganization?.name} and collaborate on Slack summaries.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success.length > 0 && (
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Successfully sent {success.length} invitation(s)!
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email Addresses</Label>
            <div className="flex space-x-2">
              <Input
                id="email"
                type="email"
                placeholder="colleague@company.com"
                value={currentEmail}
                onChange={(e) => setCurrentEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
              />
              <Button
                type="button"
                onClick={addEmail}
                disabled={loading || !currentEmail.trim()}
                variant="outline"
              >
                Add
              </Button>
            </div>
          </div>

          {emails.length > 0 && (
            <div className="space-y-2">
              <Label>Invited Emails ({emails.length})</Label>
              <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[40px]">
                {emails.map((email) => (
                  <Badge key={email} variant="secondary" className="flex items-center gap-1">
                    {email}
                    <button
                      type="button"
                      onClick={() => removeEmail(email)}
                      disabled={loading}
                      className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(value: 'admin' | 'member') => setRole(value)} disabled={loading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member - Can view and create summaries</SelectItem>
                <SelectItem value="admin">Admin - Can manage team and settings</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || emails.length === 0}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Invitations...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Send Invitations ({emails.length})
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
