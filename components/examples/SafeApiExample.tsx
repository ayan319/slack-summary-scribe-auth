'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api-client';

/**
 * Example component demonstrating safe API calls
 * Shows proper error handling and prevents JSON parsing of HTML error pages
 */
export function SafeApiExample() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const testSignupAPI = async () => {
    setLoading(true);
    setError('');
    setResult('');

    try {
      const response = await api.auth.signup({
        name: 'Test User',
        email: `test${Date.now()}@example.com`,
        password: 'password123'
      });

      if (response.success) {
        setResult(`✅ Success: ${(response.data as { message?: string })?.message || 'User created successfully'}`);
      } else {
        setError(`❌ Error: ${response.error || 'Unknown error'}`);
      }
    } catch (err) {
      setError(`❌ Network Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testSubscriptionAPI = async () => {
    setLoading(true);
    setError('');
    setResult('');

    try {
      const response = await api.subscription.create({
        userId: 'test-user-123',
        plan: 'PRO',
        paymentMethodId: 'pm_test_123',
        billingCycle: 'monthly'
      });

      if (response.success) {
        setResult(`✅ Success: ${(response.data as { message?: string })?.message || 'Subscription created successfully'}`);
      } else {
        setError(`❌ Error: ${response.error || 'Unknown error'}`);
      }
    } catch (err) {
      setError(`❌ Network Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testNonExistentAPI = async () => {
    setLoading(true);
    setError('');
    setResult('');

    try {
      const response = await api.auth.login({
        email: 'test@example.com',
        password: 'password123'
      });

      if (response.success) {
        setResult(`✅ Success: ${(response.data as { message?: string })?.message || 'Login successful'}`);
      } else {
        setError(`❌ Error: ${response.error || 'Unknown error'} (Status: ${response.status})`);
      }
    } catch (err) {
      setError(`❌ Network Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg border">
      <h2 className="text-2xl font-bold mb-6">Safe API Testing</h2>
      
      <div className="space-y-4 mb-6">
        <button
          onClick={testSignupAPI}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Testing...' : 'Test Signup API (Should Work)'}
        </button>

        <button
          onClick={testSubscriptionAPI}
          disabled={loading}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Testing...' : 'Test Subscription API (Should Work)'}
        </button>

        <button
          onClick={testNonExistentAPI}
          disabled={loading}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Testing...' : 'Test Non-Existent API (Should Fail Safely)'}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md mb-4">
          <p className="text-green-800">{result}</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md mb-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Code Example */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Example Usage:</h3>
        <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">
{`// ✅ Safe API call with proper error handling
const response = await api.auth.signup({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password123'
});

if (response.success) {
  // Handle success
  console.log('User created:', response.data);
} else {
  // Handle error (won't try to parse HTML as JSON)
  console.error('Error:', response.error);
  console.error('Status:', response.status);
}`}
        </pre>
      </div>
    </div>
  );
}
