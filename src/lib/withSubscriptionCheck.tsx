import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { Lock, CreditCard, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SubscriptionStatus {
  isPaid: boolean;
  planType: string;
  expiresAt?: string;
  paymentId?: string;
}

interface WithSubscriptionCheckProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
  allowFreeTier?: boolean;
}

export function withSubscriptionCheck<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: {
    redirectTo?: string;
    allowFreeTier?: boolean;
    showUpgradeModal?: boolean;
  } = {}
) {
  return function WithSubscriptionCheckComponent(props: P) {
    const router = useRouter();
    const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      checkSubscriptionStatus();
    }, []);

    const checkSubscriptionStatus = async () => {
      try {
        setLoading(true);
        
        // Get user ID from session/auth (replace with your auth system)
        const userId = 'demo-user-id'; // Replace with actual user ID from auth
        
        const response = await fetch(`/api/subscription/status?userId=${userId}`);
        const data = await response.json();
        
        if (response.ok) {
          setSubscriptionStatus(data);
        } else {
          throw new Error(data.message || 'Failed to check subscription status');
        }
      } catch (err) {
        console.error('Error checking subscription status:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        
        // Default to free tier if check fails
        setSubscriptionStatus({
          isPaid: false,
          planType: 'FREE'
        });
      } finally {
        setLoading(false);
      }
    };

    const handleUpgrade = () => {
      router.push('/pricing');
    };

    const handleRetry = () => {
      setError(null);
      checkSubscriptionStatus();
    };

    // Loading state
    if (loading) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Checking subscription status...</p>
          </div>
        </div>
      );
    }

    // Error state
    if (error) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-destructive">Error</CardTitle>
              <CardDescription>
                Failed to verify your subscription status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                {error}
              </p>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={handleRetry} className="flex-1">
                  Try Again
                </Button>
                <Button onClick={handleUpgrade} className="flex-1">
                  Upgrade Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Check subscription status
    const { isPaid, planType, expiresAt } = subscriptionStatus!;
    
    // Allow free tier if specified
    if (options.allowFreeTier && planType === 'FREE') {
      return <WrappedComponent {...props} />;
    }

    // Redirect if not paid and redirect option is set
    if (!isPaid && options.redirectTo) {
      router.push(options.redirectTo);
      return null;
    }

    // Show upgrade modal if not paid
    if (!isPaid) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-lg"
          >
            <Card className="shadow-2xl border-0 bg-card/80 backdrop-blur-sm">
              <CardHeader className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">Upgrade Required</CardTitle>
                  <CardDescription className="mt-2">
                    This feature requires a paid subscription to access
                  </CardDescription>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Current Plan</h3>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{planType}</Badge>
                    <span className="text-sm text-muted-foreground">
                      Limited access
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold">Unlock with Pro or Enterprise:</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                      <span>Unlimited AI summaries</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                      <span>Advanced Slack integration</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                      <span>Export to Notion & PDF</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                      <span>Priority support</span>
                    </li>
                  </ul>
                </div>

                <div className="flex space-x-3">
                  <Button variant="outline" onClick={() => router.back()} className="flex-1">
                    Go Back
                  </Button>
                  <Button onClick={handleUpgrade} className="flex-1">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Upgrade Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  Start with a 14-day free trial • Cancel anytime
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      );
    }

    // Check if subscription is expired
    if (expiresAt && new Date() > new Date(expiresAt)) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-amber-600">Subscription Expired</CardTitle>
              <CardDescription>
                Your subscription expired on {new Date(expiresAt).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Renew your subscription to continue accessing premium features
              </p>
              <Button onClick={handleUpgrade} className="w-full">
                <CreditCard className="mr-2 h-4 w-4" />
                Renew Subscription
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    // User has valid subscription, render the component
    return <WrappedComponent {...props} />;
  };
}

// Hook version for use within components
export function useSubscriptionCheck() {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      setLoading(true);
      
      // Get user ID from session/auth (replace with your auth system)
      const userId = 'demo-user-id'; // Replace with actual user ID from auth
      
      const response = await fetch(`/api/subscription/status?userId=${userId}`);
      const data = await response.json();
      
      if (response.ok) {
        setSubscriptionStatus(data);
      } else {
        throw new Error(data.message || 'Failed to check subscription status');
      }
    } catch (err) {
      console.error('Error checking subscription status:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      
      // Default to free tier if check fails
      setSubscriptionStatus({
        isPaid: false,
        planType: 'FREE'
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    subscriptionStatus,
    loading,
    error,
    refetch: checkSubscriptionStatus
  };
}
