'use client';

import Link from 'next/link';
import {
  MessageSquare,
  Zap,
  Check,
  ArrowRight,
  Brain,
  FileText,
  Shield
} from 'lucide-react';
// import { SimpleThemeToggle } from '@/components/ui/theme-toggle';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <span className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Slack Summary Scribe</span>
            </div>
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
          <div className="inline-flex items-center px-3 py-1 mb-4 text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
            <Zap className="w-3 h-3 mr-1" />
            AI-Powered Summaries
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            Transform Your Slack Conversations Into
            <span className="text-blue-600 dark:text-blue-400"> Actionable Insights</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Stop drowning in endless Slack messages. Our AI analyzes your team conversations
            and creates concise summaries highlighting key decisions, action items, and important discussions.
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
            <div className="text-center p-6 bg-gray-50 rounded-lg hover:shadow-md transition-shadow">
              <Brain className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900">AI-Powered Analysis</h3>
              <p className="text-gray-600">
                Advanced AI understands context and extracts key insights from your conversations
              </p>
            </div>

            <div className="text-center p-6 bg-gray-50 rounded-lg hover:shadow-md transition-shadow">
              <MessageSquare className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Seamless Integration</h3>
              <p className="text-gray-600">
                Connect your Slack workspace in seconds with our secure OAuth integration
              </p>
            </div>

            <div className="text-center p-6 bg-gray-50 rounded-lg hover:shadow-md transition-shadow">
              <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Multiple Export Options</h3>
              <p className="text-gray-600">
                Export summaries to PDF, Notion, or your favorite productivity tools
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
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <MessageSquare className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-semibold text-gray-900">Slack Summary Scribe</span>
            </div>
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
