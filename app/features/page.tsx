import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MessageSquare, 
  Zap, 
  Shield, 
  Users, 
  BarChart3, 
  FileText,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

const features = [
  {
    icon: MessageSquare,
    title: 'AI-Powered Summarization',
    description: 'Transform lengthy Slack conversations into concise, actionable summaries using advanced AI technology.',
    benefits: ['Save 80% of reading time', 'Never miss important decisions', 'Automatic key point extraction']
  },
  {
    icon: Zap,
    title: 'Real-time Processing',
    description: 'Get instant summaries as conversations happen, keeping your team aligned and informed.',
    benefits: ['Instant notifications', 'Live conversation tracking', 'Real-time insights']
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Bank-grade security with end-to-end encryption and compliance with industry standards.',
    benefits: ['SOC 2 compliant', 'GDPR ready', 'Data encryption at rest']
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Share summaries across teams, assign action items, and track follow-ups seamlessly.',
    benefits: ['Team workspaces', 'Action item tracking', 'Collaborative editing']
  },
  {
    icon: BarChart3,
    title: 'Analytics & Insights',
    description: 'Gain valuable insights into team communication patterns and productivity metrics.',
    benefits: ['Communication analytics', 'Productivity insights', 'Custom reports']
  },
  {
    icon: FileText,
    title: 'Export & Integration',
    description: 'Export summaries to your favorite tools like Notion, Google Docs, or download as PDF.',
    benefits: ['Multiple export formats', 'API integrations', 'Automated workflows']
  }
];

export default function FeaturesPage() {
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
              <Link href="/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Powerful Features for Modern Teams
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover how Slack Summary Scribe transforms your team communication with AI-powered 
            summarization and intelligent insights.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="h-full hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
                <CardDescription className="text-gray-600">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, benefitIndex) => (
                    <li key={benefitIndex} className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center bg-blue-50 rounded-2xl p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Transform Your Team Communication?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of teams already using Slack Summary Scribe to stay organized, 
            save time, and never miss important information.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="flex items-center">
                Start Free Trial
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" size="lg">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
