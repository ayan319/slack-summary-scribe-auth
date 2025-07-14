import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BookOpen, 
  Code, 
  Zap, 
  Shield, 
  ArrowRight,
  ExternalLink,
  Search,
  FileText
} from 'lucide-react';

const docSections = [
  {
    icon: Zap,
    title: 'Quick Start',
    description: 'Get up and running in minutes',
    articles: [
      'Installation & Setup',
      'First Slack Integration',
      'Creating Your First Summary',
      'Understanding AI Outputs'
    ]
  },
  {
    icon: Code,
    title: 'API Reference',
    description: 'Complete API documentation',
    articles: [
      'Authentication',
      'Endpoints Overview',
      'Rate Limiting',
      'Error Handling',
      'Webhooks'
    ]
  },
  {
    icon: Shield,
    title: 'Security',
    description: 'Security best practices',
    articles: [
      'API Key Management',
      'OAuth Implementation',
      'Data Encryption',
      'Compliance Standards'
    ]
  },
  {
    icon: BookOpen,
    title: 'Guides',
    description: 'Step-by-step tutorials',
    articles: [
      'Advanced Summarization',
      'Custom Workflows',
      'Team Management',
      'Integration Patterns'
    ]
  }
];

const apiEndpoints = [
  {
    method: 'POST',
    endpoint: '/api/v1/summarize',
    description: 'Create a new summary from text or conversation'
  },
  {
    method: 'GET',
    endpoint: '/api/v1/summaries',
    description: 'Retrieve all summaries for authenticated user'
  },
  {
    method: 'GET',
    endpoint: '/api/v1/summaries/{id}',
    description: 'Get a specific summary by ID'
  },
  {
    method: 'DELETE',
    endpoint: '/api/v1/summaries/{id}',
    description: 'Delete a summary'
  }
];

export default function DocsPage() {
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
            <BookOpen className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Documentation
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Everything you need to integrate and use Slack Summary Scribe effectively. 
            From quick start guides to detailed API references.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search documentation..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Documentation Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {docSections.map((section, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                    <section.icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {section.articles.map((article, articleIndex) => (
                    <li key={articleIndex}>
                      <Link 
                        href="#" 
                        className="text-blue-600 hover:text-blue-800 flex items-center group"
                      >
                        <FileText className="w-4 h-4 mr-2 text-gray-400 group-hover:text-blue-600" />
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

        {/* API Reference */}
        <div className="bg-white rounded-2xl p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            API Reference
          </h2>
          <p className="text-gray-600 mb-8">
            RESTful API endpoints for integrating Slack Summary Scribe into your applications.
          </p>
          
          <div className="space-y-4">
            {apiEndpoints.map((endpoint, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      endpoint.method === 'GET' ? 'bg-green-100 text-green-800' :
                      endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {endpoint.method}
                    </span>
                    <code className="text-sm font-mono text-gray-800">
                      {endpoint.endpoint}
                    </code>
                  </div>
                  <Link href="#" className="text-blue-600 hover:text-blue-800">
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
                <p className="text-gray-600 text-sm mt-2">{endpoint.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Support Section */}
        <div className="text-center bg-blue-50 rounded-2xl p-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Need Help?
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
            <Link href="/help">
              <Button variant="outline" size="lg">
                Browse FAQ
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
