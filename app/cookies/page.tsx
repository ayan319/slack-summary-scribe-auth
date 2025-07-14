import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Shield, 
  Cookie, 
  Settings, 
  Eye,
  CheckCircle,
  XCircle
} from 'lucide-react';

const cookieTypes = [
  {
    name: 'Essential Cookies',
    icon: Shield,
    required: true,
    description: 'These cookies are necessary for the website to function and cannot be switched off.',
    examples: [
      'Authentication tokens',
      'Session management',
      'Security preferences',
      'Load balancing'
    ]
  },
  {
    name: 'Analytics Cookies',
    icon: Eye,
    required: false,
    description: 'These cookies help us understand how visitors interact with our website.',
    examples: [
      'Page views and traffic',
      'User behavior patterns',
      'Performance metrics',
      'Error tracking'
    ]
  },
  {
    name: 'Functional Cookies',
    icon: Settings,
    required: false,
    description: 'These cookies enable enhanced functionality and personalization.',
    examples: [
      'Language preferences',
      'Theme settings',
      'Saved preferences',
      'Feature toggles'
    ]
  }
];

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              Slack Summary Scribe
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/dashboard">
                <Button>Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Cookie className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Cookie Policy
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Learn about how we use cookies and similar technologies to improve your experience 
            on Slack Summary Scribe.
          </p>
        </div>

        {/* What are Cookies */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">What are Cookies?</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <p>
              Cookies are small text files that are stored on your device when you visit our website. 
              They help us provide you with a better experience by remembering your preferences, 
              keeping you signed in, and helping us understand how you use our service.
            </p>
            <p>
              We use cookies and similar technologies like local storage and session storage to 
              enhance functionality, analyze usage, and personalize your experience.
            </p>
          </CardContent>
        </Card>

        {/* Cookie Types */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Types of Cookies We Use</h2>
          <div className="space-y-6">
            {cookieTypes.map((type, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                        <type.icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{type.name}</CardTitle>
                        <CardDescription>{type.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {type.required ? (
                        <div className="flex items-center text-red-600">
                          <XCircle className="w-5 h-5 mr-1" />
                          <span className="text-sm font-medium">Required</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="w-5 h-5 mr-1" />
                          <span className="text-sm font-medium">Optional</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <h4 className="font-semibold text-gray-900 mb-2">Examples:</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    {type.examples.map((example, exampleIndex) => (
                      <li key={exampleIndex}>{example}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Third Party Cookies */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Third-Party Services</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <p>
              We use several third-party services that may set their own cookies:
            </p>
            <ul>
              <li><strong>Supabase:</strong> For authentication and database services</li>
              <li><strong>Vercel:</strong> For hosting and analytics</li>
              <li><strong>PostHog:</strong> For product analytics (if enabled)</li>
              <li><strong>Sentry:</strong> For error tracking and performance monitoring</li>
            </ul>
            <p>
              These services have their own privacy policies and cookie practices. 
              We recommend reviewing their policies for more information.
            </p>
          </CardContent>
        </Card>

        {/* Managing Cookies */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Managing Your Cookie Preferences</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <h3>Browser Settings</h3>
            <p>
              You can control cookies through your browser settings. Most browsers allow you to:
            </p>
            <ul>
              <li>View and delete existing cookies</li>
              <li>Block cookies from specific sites</li>
              <li>Block third-party cookies</li>
              <li>Clear all cookies when you close the browser</li>
            </ul>
            
            <h3>Our Cookie Preferences</h3>
            <p>
              You can manage your cookie preferences for optional cookies through our 
              cookie banner or by visiting your account settings. Essential cookies 
              cannot be disabled as they are necessary for the service to function.
            </p>
            
            <h3>Impact of Disabling Cookies</h3>
            <p>
              Disabling certain cookies may affect your experience:
            </p>
            <ul>
              <li>You may need to sign in more frequently</li>
              <li>Your preferences may not be saved</li>
              <li>Some features may not work properly</li>
              <li>We may not be able to provide personalized experiences</li>
            </ul>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Questions About Cookies?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              If you have any questions about our use of cookies or this policy, 
              please contact us:
            </p>
            <div className="space-y-2 text-gray-900">
              <p><strong>Email:</strong> privacy@slacksummaryscribe.com</p>
              <p><strong>Address:</strong> 123 Innovation Drive, San Francisco, CA 94105</p>
            </div>
          </CardContent>
        </Card>

        {/* Last Updated */}
        <div className="text-center text-gray-500 text-sm">
          <p>This Cookie Policy was last updated on January 14, 2025.</p>
          <p className="mt-2">
            <Link href="/privacy" className="text-blue-600 hover:text-blue-800">
              View our Privacy Policy
            </Link>
            {' | '}
            <Link href="/terms" className="text-blue-600 hover:text-blue-800">
              View our Terms of Service
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
