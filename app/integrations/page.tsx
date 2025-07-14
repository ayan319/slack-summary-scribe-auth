import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Slack, 
  Github, 
  Chrome, 
  Zap, 
  ArrowRight,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

const integrations = [
  {
    icon: Slack,
    name: 'Slack',
    description: 'Connect your Slack workspace to automatically summarize conversations',
    status: 'Available',
    features: ['Real-time summarization', 'Channel monitoring', 'Direct message support'],
    connectUrl: '/slack/connect'
  },
  {
    icon: Github,
    name: 'GitHub',
    description: 'Summarize GitHub discussions, issues, and pull request conversations',
    status: 'Coming Soon',
    features: ['Issue summarization', 'PR review summaries', 'Discussion highlights'],
    connectUrl: '#'
  },
  {
    icon: Chrome,
    name: 'Browser Extension',
    description: 'Summarize any web content with our browser extension',
    status: 'Coming Soon',
    features: ['One-click summarization', 'Save summaries', 'Cross-platform sync'],
    connectUrl: '#'
  },
  {
    icon: Zap,
    name: 'Zapier',
    description: 'Connect with 5000+ apps through Zapier automation',
    status: 'Coming Soon',
    features: ['Automated workflows', 'Custom triggers', 'Multi-app integration'],
    connectUrl: '#'
  }
];

export default function IntegrationsPage() {
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Powerful Integrations
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Connect Slack Summary Scribe with your favorite tools and platforms 
            to streamline your workflow and boost productivity.
          </p>
        </div>

        {/* Integrations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {integrations.map((integration, index) => (
            <Card key={index} className="h-full hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <integration.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    integration.status === 'Available' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {integration.status}
                  </span>
                </div>
                <CardTitle className="text-xl">{integration.name}</CardTitle>
                <CardDescription className="text-gray-600">
                  {integration.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {integration.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                {integration.status === 'Available' ? (
                  <Link href={integration.connectUrl}>
                    <Button className="w-full flex items-center">
                      Connect {integration.name}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                ) : (
                  <Button disabled className="w-full">
                    Coming Soon
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* API Section */}
        <div className="bg-white rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Need a Custom Integration?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Use our powerful API to build custom integrations with your existing tools 
            and workflows. Full documentation and SDKs available.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/docs">
              <Button size="lg" variant="outline" className="flex items-center">
                View API Docs
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/support">
              <Button size="lg">
                Contact Support
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
