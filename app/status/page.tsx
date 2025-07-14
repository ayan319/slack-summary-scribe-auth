import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock,
  Activity,
  Server,
  Database,
  Zap
} from 'lucide-react';

const services = [
  {
    name: 'API Services',
    status: 'operational',
    uptime: '99.9%',
    responseTime: '120ms',
    icon: Server,
    description: 'Core API endpoints and authentication'
  },
  {
    name: 'AI Summarization',
    status: 'operational',
    uptime: '99.8%',
    responseTime: '2.1s',
    icon: Zap,
    description: 'AI-powered text summarization engine'
  },
  {
    name: 'Database',
    status: 'operational',
    uptime: '99.9%',
    responseTime: '45ms',
    icon: Database,
    description: 'User data and summary storage'
  },
  {
    name: 'Slack Integration',
    status: 'operational',
    uptime: '99.7%',
    responseTime: '180ms',
    icon: Activity,
    description: 'Slack workspace connections and webhooks'
  }
];

const incidents = [
  {
    date: '2024-01-13',
    title: 'Temporary API slowdown',
    status: 'resolved',
    description: 'Brief increase in response times due to high traffic. Resolved by scaling infrastructure.',
    duration: '23 minutes'
  },
  {
    date: '2024-01-10',
    title: 'Slack integration maintenance',
    status: 'resolved',
    description: 'Scheduled maintenance for Slack webhook improvements.',
    duration: '1 hour'
  }
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'operational':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'degraded':
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    case 'outage':
      return <XCircle className="w-5 h-5 text-red-500" />;
    default:
      return <Clock className="w-5 h-5 text-gray-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'operational':
      return 'text-green-600 bg-green-100';
    case 'degraded':
      return 'text-yellow-600 bg-yellow-100';
    case 'outage':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

export default function StatusPage() {
  const overallStatus = services.every(s => s.status === 'operational') ? 'operational' : 'degraded';

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

      {/* Status Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            System Status
          </h1>
          <div className="flex items-center justify-center mb-6">
            {getStatusIcon(overallStatus)}
            <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(overallStatus)}`}>
              {overallStatus === 'operational' ? 'All Systems Operational' : 'Some Systems Degraded'}
            </span>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Real-time status and performance metrics for all Slack Summary Scribe services.
          </p>
        </div>

        {/* Services Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {services.map((service, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                      <service.icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      <CardDescription>{service.description}</CardDescription>
                    </div>
                  </div>
                  {getStatusIcon(service.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Uptime (30 days)</p>
                    <p className="text-lg font-semibold text-gray-900">{service.uptime}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Response Time</p>
                    <p className="text-lg font-semibold text-gray-900">{service.responseTime}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                    {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Incidents */}
        <div className="bg-white rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Recent Incidents
          </h2>
          
          {incidents.length > 0 ? (
            <div className="space-y-6">
              {incidents.map((incident, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-6 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{incident.title}</h3>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-500">{incident.date}</span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {incident.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-2">{incident.description}</p>
                  <p className="text-sm text-gray-500">Duration: {incident.duration}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Recent Incidents</h3>
              <p className="text-gray-600">All systems have been running smoothly.</p>
            </div>
          )}
        </div>

        {/* Subscribe to Updates */}
        <div className="text-center bg-blue-50 rounded-2xl p-12 mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Stay Updated
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Subscribe to status updates and get notified about incidents, 
            maintenance windows, and service improvements.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg">
              Subscribe to Updates
            </Button>
            <Link href="/support">
              <Button variant="outline" size="lg">
                Contact Support
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
