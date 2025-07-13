import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  HelpCircle, 
  MessageSquare, 
  Settings, 
  CreditCard, 
  Shield,
  ExternalLink,
  Search,
  BookOpen
} from 'lucide-react';

const helpCategories = [
  {
    icon: MessageSquare,
    title: 'Getting Started',
    description: 'Learn the basics of Slack Summary Scribe',
    articles: [
      'How to connect your Slack workspace',
      'Creating your first summary',
      'Understanding AI-generated summaries',
      'Setting up team workspaces'
    ]
  },
  {
    icon: Settings,
    title: 'Configuration',
    description: 'Customize your experience',
    articles: [
      'Configuring notification settings',
      'Managing team permissions',
      'Setting up automated summaries',
      'Customizing summary templates'
    ]
  },
  {
    icon: CreditCard,
    title: 'Billing & Plans',
    description: 'Manage your subscription',
    articles: [
      'Understanding pricing plans',
      'Upgrading your subscription',
      'Managing payment methods',
      'Canceling your subscription'
    ]
  },
  {
    icon: Shield,
    title: 'Security & Privacy',
    description: 'Keep your data safe',
    articles: [
      'Data encryption and security',
      'Privacy policy overview',
      'GDPR compliance',
      'Managing data retention'
    ]
  }
];

const faqs = [
  {
    question: 'How does AI summarization work?',
    answer: 'Our AI analyzes conversation patterns, identifies key topics, and extracts the most important information to create concise summaries while preserving context and meaning.'
  },
  {
    question: 'Is my Slack data secure?',
    answer: 'Yes, we use enterprise-grade encryption and follow strict security protocols. Your data is encrypted in transit and at rest, and we never store more than necessary for summarization.'
  },
  {
    question: 'Can I customize summary formats?',
    answer: 'Absolutely! You can choose from different summary styles, set custom templates, and configure what information to include or exclude from summaries.'
  },
  {
    question: 'How much does it cost?',
    answer: 'We offer a free plan for small teams and paid plans starting at $29/month. Check our pricing page for detailed information about features and limits.'
  }
];

export default function HelpPage() {
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
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <HelpCircle className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            How can we help you?
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Find answers to common questions, learn how to use our features, 
            and get the most out of Slack Summary Scribe.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search help articles..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Help Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {helpCategories.map((category, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                    <category.icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{category.title}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {category.articles.map((article, articleIndex) => (
                    <li key={articleIndex}>
                      <Link 
                        href="#" 
                        className="text-blue-600 hover:text-blue-800 flex items-center group"
                      >
                        <BookOpen className="w-4 h-4 mr-2 text-gray-400 group-hover:text-blue-600" />
                        {article}
                        <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <div className="text-center bg-blue-50 rounded-2xl p-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Still need help?
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Can't find what you're looking for? Our support team is here to help you 
            get the most out of Slack Summary Scribe.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/support">
              <Button size="lg">
                Contact Support
              </Button>
            </Link>
            <Link href="mailto:support@slacksummaryscribe.com">
              <Button variant="outline" size="lg">
                Email Us
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
