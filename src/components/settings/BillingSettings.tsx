import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, ExternalLink, Crown } from "lucide-react";

export const BillingSettings = () => {
  const handleManageBilling = () => {
    // In a real app, this would redirect to Stripe customer portal
    window.open("https://stripe.com", "_blank");
  };

  const handleUpgrade = () => {
    // In a real app, this would start the upgrade flow
    console.log("Upgrade to Pro");
  };

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-600" />
            Current Plan
          </CardTitle>
          <CardDescription>
            Manage your subscription and billing information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Free Plan</h4>
              <p className="text-sm text-gray-500">
                Up to 10 summaries per month
              </p>
            </div>
            <Badge variant="secondary">Active</Badge>
          </div>

          <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border">
            <h4 className="font-medium text-purple-900 mb-2">Upgrade to Pro</h4>
            <p className="text-purple-700 text-sm mb-3">
              Get unlimited summaries, priority support, and advanced
              integrations.
            </p>
            <Button
              onClick={handleUpgrade}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Upgrade Now - $29/month
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Billing & Invoices
          </CardTitle>
          <CardDescription>
            View your billing history and manage payment methods
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8">
            <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No billing history
            </h3>
            <p className="text-gray-500 mb-4">
              You're currently on the free plan
            </p>
          </div>

          <Button
            variant="outline"
            onClick={handleManageBilling}
            className="w-full"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Manage Billing Portal
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
