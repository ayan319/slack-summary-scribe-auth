'use client';

import Link from 'next/link';
import {
  Zap,
  Check,
  ArrowRight,
  Brain,
  FileText,
  Shield,
  MessageSquare,
  Crown,
  Building2,
  Tags,
  CreditCard,
  Sparkles
} from 'lucide-react';
import { Logo } from '@/components/ui/logo';
// import { SimpleThemeToggle } from '@/components/ui/theme-toggle';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <nav className="flex items-center justify-between">
            <Logo />
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/pricing" className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                Pricing
              </Link>
              {/* <SimpleThemeToggle /> */}
              <Link href="/login" className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors" data-testid="nav-sign-in">
                Sign In
              </Link>
              <Link href="/signup" className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors" data-testid="nav-get-started">
                Get Started
              </Link>
            </div>
            <div className="md:hidden flex items-center space-x-2">
              {/* <SimpleThemeToggle /> */}
              <Link href="/login" className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors text-sm" data-testid="mobile-nav-sign-in">
                Sign In
              </Link>
              <Link href="/signup" className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm" data-testid="mobile-nav-get-started">
                Get Started
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="w-full bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center px-3 py-1 mb-4 text-sm bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full">
            <Crown className="w-3 h-3 mr-1" />
            Premium AI-Powered Summaries
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            Smart Slack Summaries with
            <span className="text-purple-600 dark:text-purple-400"> GPT-4o-mini</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            AI-powered premium summarization with smart tagging, CRM auto-sync, and global payments via Stripe.
            Transform your Slack conversations into actionable insights with advanced features.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard" className="inline-flex items-center px-8 py-3 text-lg bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors">
              Open Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link href="/pricing" className="inline-flex items-center px-8 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors">
              View Pricing
            </Link>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Free trial • No credit card required • Cancel anytime
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Teams Love Slack Summary Scribe
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Save hours every week and never miss important information again
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 bg-purple-50 rounded-lg hover:shadow-md transition-shadow border border-purple-200">
              <Crown className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Premium AI Models</h3>
              <p className="text-gray-600">
                GPT-4o-mini for Pro users with intelligent fallback to DeepSeek for reliability
              </p>
            </div>

            <div className="text-center p-6 bg-blue-50 rounded-lg hover:shadow-md transition-shadow border border-blue-200">
              <Tags className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Smart Tagging</h3>
              <p className="text-gray-600">
                AI extracts skills, technologies, action items, and sentiments automatically
              </p>
            </div>

            <div className="text-center p-6 bg-green-50 rounded-lg hover:shadow-md transition-shadow border border-green-200">
              <MessageSquare className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Slack Auto-Post</h3>
              <p className="text-gray-600">
                Automatically post summaries back to Slack channels or DMs for seamless workflow
              </p>
            </div>

            <div className="text-center p-6 bg-orange-50 rounded-lg hover:shadow-md transition-shadow border border-orange-200">
              <Building2 className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900">CRM Auto-Sync</h3>
              <p className="text-gray-600">
                Push summaries to HubSpot, Salesforce, and Notion automatically
              </p>
            </div>

            <div className="text-center p-6 bg-gray-50 rounded-lg hover:shadow-md transition-shadow">
              <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Enterprise Security</h3>
              <p className="text-gray-600">
                Bank-grade security ensures your sensitive conversations stay private
              </p>
            </div>
          </div>

          {/* Advanced Features Section */}
          <div className="mt-20 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-8">Advanced Features for Premium Users</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                <Sparkles className="h-10 w-10 text-purple-600 mx-auto mb-4" />
                <h4 className="text-lg font-semibold mb-2 text-gray-900">Premium AI Models</h4>
                <p className="text-gray-600 text-sm">
                  Access to GPT-4o-mini and GPT-4o for superior summarization quality
                </p>
              </div>
              <div className="p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border border-green-200">
                <CreditCard className="h-10 w-10 text-green-600 mx-auto mb-4" />
                <h4 className="text-lg font-semibold mb-2 text-gray-900">Global Payments</h4>
                <p className="text-gray-600 text-sm">
                  Stripe integration with Apple Pay, Google Pay, and worldwide payment support
                </p>
              </div>
              <div className="p-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border border-orange-200">
                <Shield className="h-10 w-10 text-orange-600 mx-auto mb-4" />
                <h4 className="text-lg font-semibold mb-2 text-gray-900">Enterprise Security</h4>
                <p className="text-gray-600 text-sm">
                  Advanced encryption, audit logs, and compliance features for enterprise teams
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="w-full bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Get started in minutes, not hours
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Connect Your Slack</h3>
              <p className="text-gray-600">
                Securely connect your Slack workspace with our OAuth integration
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">AI Analyzes Conversations</h3>
              <p className="text-gray-600">
                Our AI processes your channel messages and identifies key information
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Get Actionable Summaries</h3>
              <p className="text-gray-600">
                Receive concise summaries with decisions, action items, and key insights
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="w-full bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that fits your team size and needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Free</h3>
                <div className="text-3xl font-bold text-gray-900">$0<span className="text-lg text-gray-500">/month</span></div>
              </div>
              <div className="space-y-4">
                <ul className="space-y-2">
                  <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" />1 Slack workspace</li>
                  <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" />Basic summaries</li>
                  <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" />Email support</li>
                </ul>
                <Link href="/dashboard" className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  Open Dashboard
                </Link>
              </div>
            </div>

            <div className="bg-white border-2 border-blue-600 rounded-lg shadow-lg p-6 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="inline-block px-3 py-1 text-xs bg-blue-600 text-white rounded-full">Most Popular</div>
              </div>
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Pro</h3>
                <div className="text-3xl font-bold text-gray-900">$29<span className="text-lg text-gray-500">/month</span></div>
              </div>
              <div className="space-y-4">
                <ul className="space-y-2">
                  <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" />3 Slack workspaces</li>
                  <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" />Advanced AI summaries</li>
                  <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" />Export options</li>
                  <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" />Priority support</li>
                </ul>
                <Link href="/pricing" className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  Choose Pro
                </Link>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Enterprise</h3>
                <div className="text-3xl font-bold text-gray-900">$99<span className="text-lg text-gray-500">/month</span></div>
              </div>
              <div className="space-y-4">
                <ul className="space-y-2">
                  <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" />Unlimited workspaces</li>
                  <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" />Custom AI models</li>
                  <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" />Team management</li>
                  <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" />24/7 support</li>
                </ul>
                <Link href="/pricing" className="block w-full text-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                  Choose Enterprise
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full bg-blue-600 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Team Communication?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of teams who are already saving hours every week with AI-powered summaries
          </p>
          <Link href="/dashboard" className="inline-flex items-center px-8 py-3 text-lg bg-white text-blue-600 rounded-md hover:bg-gray-50 transition-colors font-semibold">
            Open Dashboard
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <Logo size="sm" className="mb-4 md:mb-0" />
            <div className="flex space-x-6 text-sm text-gray-600">
              <Link href="/terms" className="hover:text-blue-600 transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-blue-600 transition-colors">Privacy</Link>
              <Link href="/support" className="hover:text-blue-600 transition-colors">Support</Link>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t text-center text-sm text-gray-500">
            © 2024 Slack Summary Scribe. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
