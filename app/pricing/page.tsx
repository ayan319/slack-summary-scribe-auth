'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, Star } from 'lucide-react';
import { PLANS } from '@/lib/subscription';

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const handleSelectPlan = async (planId: string) => {
    if (planId === 'FREE') {
      router.push('/login');
      return;
    }

    setLoading(planId);

    try {
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan: planId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subscription');
      }

      // Redirect to Cashfree checkout
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      alert('Failed to start subscription. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Transform your Slack conversations into actionable insights with AI-powered summaries
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {Object.entries(PLANS).map(([planId, plan]) => (
            <Card 
              key={planId} 
              className={`relative ${planId === 'PRO' ? 'border-primary shadow-lg scale-105' : ''}`}
            >
              {planId === 'PRO' && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3 py-1">
                    <Star className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-gray-600 dark:text-gray-400">/month</span>
                </div>
                <CardDescription className="mt-2">
                  {planId === 'FREE' && 'Perfect for trying out our service'}
                  {planId === 'PRO' && 'Best for small to medium teams'}
                  {planId === 'ENTERPRISE' && 'For large organizations'}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={planId === 'PRO' ? 'default' : 'outline'}
                  onClick={() => handleSelectPlan(planId)}
                  disabled={loading === planId}
                >
                  {loading === planId ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {planId === 'FREE' ? 'Get Started Free' : `Choose ${plan.name}`}
                    </>
                  )}
                </Button>

                {planId !== 'FREE' && (
                  <p className="text-xs text-center text-gray-500">
                    Cancel anytime • No setup fees
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-8">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
            <div>
              <h3 className="font-semibold mb-2">How does the AI summarization work?</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Our AI analyzes your Slack conversations and creates concise summaries highlighting key decisions, action items, and important discussions.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Can I cancel my subscription anytime?</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Is my Slack data secure?</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Absolutely. We use enterprise-grade security and only access the data necessary to generate summaries. Your data is never shared with third parties.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Do you offer refunds?</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                We offer a 30-day money-back guarantee for all paid plans. Contact support if you're not satisfied.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
