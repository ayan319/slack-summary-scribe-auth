'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Crown, Zap, Building, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface SubscriptionData {
  plan: string;
  status: string;
  features: string[];
  limits: {
    workspaces: number;
    summariesPerMonth: number;
  };
  currentPeriodEnd?: string;
  daysUntilRenewal?: number;
  isActive: boolean;
  canUpgrade: boolean;
  canDowngrade: boolean;
}

const PLAN_ICONS = {
  FREE: Crown,
  PRO: Zap,
  ENTERPRISE: Building
};

const PLAN_COLORS = {
  FREE: 'bg-gray-100 text-gray-800',
  PRO: 'bg-blue-100 text-blue-800',
  ENTERPRISE: 'bg-purple-100 text-purple-800'
};

const PLAN_PRICES = {
  FREE: 0,
  PRO: 29,
  ENTERPRISE: 99
};

export default function SubscriptionManager() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch('/api/subscription/status');
      const data = await response.json();

      if (data.success) {
        setSubscription(data.subscription);
      } else {
        toast.error('Failed to load subscription status');
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      toast.error('Failed to load subscription status');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (plan: string) => {
    setUpgrading(plan);
    
    try {
      const response = await fetch('/api/cashfree/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan }),
      });

      const data = await response.json();

      if (data.success) {
        if (plan === 'FREE') {
          toast.success('Downgraded to Free plan successfully');
          await fetchSubscriptionStatus();
        } else if (data.payment_url) {
          // Redirect to Cashfree payment page
          window.location.href = data.payment_url;
        } else {
          toast.error('Failed to create payment session');
        }
      } else {
        toast.error(data.error || 'Failed to process upgrade');
      }
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      toast.error('Failed to process upgrade');
    } finally {
      setUpgrading(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features.')) {
      return;
    }

    try {
      const response = await fetch('/api/subscription/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'cancel' }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Subscription cancelled successfully');
        await fetchSubscriptionStatus();
      } else {
        toast.error(data.error || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading subscription...</span>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-gray-500">Failed to load subscription information</p>
        </CardContent>
      </Card>
    );
  }

  const PlanIcon = PLAN_ICONS[subscription.plan as keyof typeof PLAN_ICONS];

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlanIcon className="h-5 w-5" />
            Current Plan
          </CardTitle>
          <CardDescription>
            Manage your subscription and billing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Badge className={PLAN_COLORS[subscription.plan as keyof typeof PLAN_COLORS]}>
                {subscription.plan}
              </Badge>
              <span className="text-2xl font-bold">
                ${PLAN_PRICES[subscription.plan as keyof typeof PLAN_PRICES]}/month
              </span>
            </div>
            <Badge variant={subscription.isActive ? 'default' : 'destructive'}>
              {subscription.status}
            </Badge>
          </div>

          {subscription.currentPeriodEnd && (
            <p className="text-sm text-gray-600 mb-4">
              {subscription.daysUntilRenewal && subscription.daysUntilRenewal > 0
                ? `Renews in ${subscription.daysUntilRenewal} days`
                : 'Subscription expired'
              }
            </p>
          )}

          <div className="space-y-2 mb-6">
            <h4 className="font-medium">Plan Features:</h4>
            <ul className="space-y-1">
              {subscription.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2 mb-6">
            <h4 className="font-medium">Usage Limits:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Workspaces:</span>
                <span className="ml-2 font-medium">
                  {subscription.limits.workspaces === -1 ? 'Unlimited' : subscription.limits.workspaces}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Summaries/month:</span>
                <span className="ml-2 font-medium">
                  {subscription.limits.summariesPerMonth === -1 ? 'Unlimited' : subscription.limits.summariesPerMonth}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {subscription.canUpgrade && subscription.plan !== 'ENTERPRISE' && (
              <Button
                onClick={() => handleUpgrade(subscription.plan === 'FREE' ? 'PRO' : 'ENTERPRISE')}
                disabled={upgrading !== null}
              >
                {upgrading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Upgrade to {subscription.plan === 'FREE' ? 'Pro' : 'Enterprise'}
              </Button>
            )}
            
            {subscription.plan !== 'FREE' && subscription.isActive && (
              <Button
                variant="outline"
                onClick={handleCancelSubscription}
              >
                Cancel Subscription
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div className="grid md:grid-cols-3 gap-6">
        {Object.entries(PLAN_PRICES).map(([planName, price]) => {
          const isCurrentPlan = subscription.plan === planName;
          const PlanIcon = PLAN_ICONS[planName as keyof typeof PLAN_ICONS];
          
          return (
            <Card key={planName} className={isCurrentPlan ? 'ring-2 ring-blue-500' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlanIcon className="h-5 w-5" />
                  {planName}
                </CardTitle>
                <CardDescription>
                  <span className="text-2xl font-bold">${price}</span>/month
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isCurrentPlan ? (
                  <Badge className="w-full justify-center">Current Plan</Badge>
                ) : (
                  <Button
                    className="w-full"
                    variant={planName === 'FREE' ? 'outline' : 'default'}
                    onClick={() => handleUpgrade(planName)}
                    disabled={upgrading !== null}
                  >
                    {upgrading === planName ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {planName === 'FREE' ? 'Downgrade' : 'Upgrade'}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
