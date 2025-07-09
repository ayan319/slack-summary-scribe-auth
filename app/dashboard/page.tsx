'use client';

import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    console.log('🎯 Dashboard page mounted successfully');
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🎉 Dashboard Loaded Successfully!
        </h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
          <div className="space-y-2 text-sm">
            <p>✅ Dashboard page is rendering correctly</p>
            <p>✅ React component mounted successfully</p>
            <p>✅ No routing issues detected</p>
            <p>🕐 Timestamp: {new Date().toISOString()}</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Next Steps for Full Dashboard
          </h3>
          <ul className="text-blue-800 space-y-1">
            <li>• Add session authentication check</li>
            <li>• Integrate with AuthProvider</li>
            <li>• Load user data and organizations</li>
            <li>• Display Slack integrations</li>
            <li>• Show recent summaries</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Total Summaries</h3>
            <p className="text-3xl font-bold text-blue-600">42</p>
            <p className="text-sm text-gray-500">Mock data</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Slack Workspaces</h3>
            <p className="text-3xl font-bold text-green-600">1</p>
            <p className="text-sm text-gray-500">Connected</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-2">This Month</h3>
            <p className="text-3xl font-bold text-purple-600">12</p>
            <p className="text-sm text-gray-500">New summaries</p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <a
            href="/login"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    </div>
  );
}
