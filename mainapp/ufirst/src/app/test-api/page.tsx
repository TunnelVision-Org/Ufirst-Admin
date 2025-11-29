'use client';

import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { GADGET_API_URL } from '@/config/api';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiResult = Record<string, any> | null;

export default function TestApiPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResult>(null);
  const [error, setError] = useState<string | null>(null);

  const testGetAllTrainers = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🧪 Testing /api/trainers/getAll...');
      const response = await fetch('/api/trainers/getAll', {
        method: 'GET',
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response ok:', response.ok);

      const data = await response.json();
      console.log('📦 Response data:', data);

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to fetch trainers');
      }
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const testDirectGraphQL = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🧪 Testing direct GraphQL...');
      console.log('🔗 Using URL:', GADGET_API_URL);

      const response = await fetch(GADGET_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query GetAllTrainers {
              trainers {
                edges {
                  node {
                    id
                    user {
                      id
                      firstName
                      lastName
                      email
                    }
                    client {
                      edges {
                        node {
                          id
                        }
                      }
                    }
                    createdAt
                    updatedAt
                  }
                }
              }
            }
          `,
        }),
      });

      console.log('📥 Response status:', response.status);
      const data = await response.json();
      console.log('📦 Response data:', data);

      if (response.ok) {
        setResult(data);
      } else {
        setError('Failed to fetch from GraphQL');
      }
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>API Testing Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Configuration Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-700 font-semibold mb-2">Current Configuration:</p>
            <p className="text-sm text-blue-600 font-mono break-all">
              {GADGET_API_URL}
            </p>
          </div>

          {/* Test Buttons */}
          <div className="space-y-3">
            <Button
              onClick={testGetAllTrainers}
              disabled={loading}
              className="w-full bg-[#3C4526] hover:bg-[#2d331c] text-white"
              size="lg"
            >
              {loading ? 'Testing...' : '🧪 Test API Route: /api/trainers/getAll'}
            </Button>

            <Button
              onClick={testDirectGraphQL}
              disabled={loading}
              variant="outline"
              className="w-full"
              size="lg"
            >
              {loading ? 'Testing...' : '🔗 Test Direct GraphQL Query'}
            </Button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3C4526]"></div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 font-semibold">❌ Error:</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          )}

          {/* Success Result Display */}
          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-700 font-semibold mb-2">✅ Success!</p>
              
              {/* Summary */}
              {result.trainers && (
                <div className="mb-3 p-3 bg-white rounded border">
                  <p className="font-semibold text-gray-900">
                    Found {result.trainers.length} trainer{result.trainers.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}

              {result.data?.trainers && (
                <div className="mb-3 p-3 bg-white rounded border">
                  <p className="font-semibold text-gray-900">
                    Found {result.data.trainers.edges?.length || 0} trainer{result.data.trainers.edges?.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}

              {/* Raw Data */}
              <details className="cursor-pointer">
                <summary className="text-green-700 font-medium mb-2">
                  View Full Response
                </summary>
                <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-96 text-gray-800">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
            <p className="text-yellow-800 font-semibold mb-2">📋 Debugging Steps:</p>
            <ol className="list-decimal list-inside space-y-1 text-yellow-700">
              <li>Click "Test API Route" to test your Next.js API endpoint</li>
              <li>Click "Test Direct GraphQL" to test Gadget.app directly</li>
              <li>Open browser DevTools Console (F12) for detailed logs</li>
              <li>Check terminal/server logs for backend output</li>
              <li>If direct GraphQL works but API route fails, check API route code</li>
              <li>If both fail, check Gadget.app connection and schema</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
