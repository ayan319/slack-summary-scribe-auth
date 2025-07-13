'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Star, Send, MessageSquare, Bug, Lightbulb, Heart } from 'lucide-react';
import { toast } from 'sonner';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  trigger?: 'manual' | 'auto' | 'post_summary' | 'post_upload' | 'satisfaction_survey';
  context?: {
    page?: string;
    feature?: string;
    summaryId?: string;
    userId?: string;
  };
}

export default function FeedbackModal({ isOpen, onClose, trigger = 'manual', context }: FeedbackModalProps) {
  const [step, setStep] = useState(1);
  const [feedbackType, setFeedbackType] = useState<'general' | 'bug' | 'feature' | 'satisfaction'>('general');
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');
  const [allowContact, setAllowContact] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const feedbackTypes = [
    {
      id: 'general',
      label: 'General Feedback',
      description: 'Share your thoughts about the app',
      icon: MessageSquare,
      color: 'text-blue-500'
    },
    {
      id: 'bug',
      label: 'Report a Bug',
      description: 'Something isn\'t working as expected',
      icon: Bug,
      color: 'text-red-500'
    },
    {
      id: 'feature',
      label: 'Feature Request',
      description: 'Suggest a new feature or improvement',
      icon: Lightbulb,
      color: 'text-yellow-500'
    },
    {
      id: 'satisfaction',
      label: 'Rate Your Experience',
      description: 'How satisfied are you with our service?',
      icon: Heart,
      color: 'text-pink-500'
    }
  ];

  const handleSubmit = async () => {
    if (!feedback.trim() && feedbackType !== 'satisfaction') {
      toast.error('Please provide some feedback');
      return;
    }

    if (feedbackType === 'satisfaction' && rating === 0) {
      toast.error('Please provide a rating');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: feedbackType,
          rating: feedbackType === 'satisfaction' ? rating : undefined,
          feedback: feedback.trim(),
          email: email.trim(),
          allowContact,
          trigger,
          context,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      toast.success('Thank you for your feedback! 🙏');
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setFeedbackType('general');
    setRating(0);
    setHoveredRating(0);
    setFeedback('');
    setEmail('');
    setAllowContact(false);
  };

  const renderStars = () => {
    return (
      <div className="flex justify-center space-x-1 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`p-1 transition-colors ${
              star <= (hoveredRating || rating)
                ? 'text-yellow-400'
                : 'text-gray-300 hover:text-yellow-300'
            }`}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            onClick={() => setRating(star)}
          >
            <Star className="h-8 w-8 fill-current" />
          </button>
        ))}
      </div>
    );
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return 'Very Dissatisfied 😞';
      case 2: return 'Dissatisfied 😕';
      case 3: return 'Neutral 😐';
      case 4: return 'Satisfied 😊';
      case 5: return 'Very Satisfied 🤩';
      default: return 'Rate your experience';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-blue-500" />
            <span>Share Your Feedback</span>
          </DialogTitle>
          <DialogDescription>
            Help us improve Slack Summary Scribe with your valuable feedback
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <Label className="text-base font-medium">What type of feedback do you have?</Label>
              <RadioGroup
                value={feedbackType}
                onValueChange={(value) => setFeedbackType(value as any)}
                className="space-y-3"
              >
                {feedbackTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <div key={type.id} className="flex items-center space-x-3">
                      <RadioGroupItem value={type.id} id={type.id} />
                      <Label
                        htmlFor={type.id}
                        className="flex items-center space-x-3 cursor-pointer flex-1 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                      >
                        <Icon className={`h-5 w-5 ${type.color}`} />
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-sm text-gray-500">{type.description}</div>
                        </div>
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>

              <div className="flex justify-end">
                <Button onClick={() => setStep(2)}>
                  Next
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {feedbackType === 'satisfaction' && (
                <div className="text-center">
                  <Label className="text-base font-medium block mb-4">
                    How would you rate your overall experience?
                  </Label>
                  {renderStars()}
                  <p className="text-sm text-gray-600 mb-4">
                    {getRatingText(hoveredRating || rating)}
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="feedback" className="text-base font-medium">
                  {feedbackType === 'bug' && 'Describe the bug you encountered'}
                  {feedbackType === 'feature' && 'Describe the feature you\'d like to see'}
                  {feedbackType === 'general' && 'Share your thoughts'}
                  {feedbackType === 'satisfaction' && 'Tell us more about your experience (optional)'}
                </Label>
                <Textarea
                  id="feedback"
                  placeholder={
                    feedbackType === 'bug'
                      ? 'Please describe what happened, what you expected, and steps to reproduce...'
                      : feedbackType === 'feature'
                      ? 'Describe the feature and how it would help you...'
                      : feedbackType === 'satisfaction'
                      ? 'What did you like? What could be improved?'
                      : 'Your feedback helps us improve...'
                  }
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-base font-medium">
                  Email (optional)
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="contact"
                  checked={allowContact}
                  onCheckedChange={(checked) => setAllowContact(checked === true)}
                />
                <Label htmlFor="contact" className="text-sm">
                  It's okay to contact me about this feedback
                </Label>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Feedback
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
