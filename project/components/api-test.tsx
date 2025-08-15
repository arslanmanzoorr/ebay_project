'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient, API_ENDPOINTS } from '@/lib/api';

export default function ApiTest() {
  const [getResponse, setGetResponse] = useState<string>('');
  const [postResponse, setPostResponse] = useState<string>('');
  const [postData, setPostData] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleGetRequest = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(API_ENDPOINTS.HELLO);
      setGetResponse(JSON.stringify(response, null, 2));
    } catch (error) {
      setGetResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePostRequest = async () => {
    setLoading(true);
    try {
      const response = await apiClient.post(API_ENDPOINTS.TEST_POST, {
        message: postData,
        timestamp: new Date().toISOString(),
      });
      setPostResponse(JSON.stringify(response, null, 2));
    } catch (error) {
      setPostResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-center mb-8">
        Frontend-Backend Connection Test
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* GET Request Test */}
        <Card>
          <CardHeader>
            <CardTitle>GET Request Test</CardTitle>
            <CardDescription>
              Test the connection to the Django backend with a GET request
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleGetRequest} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Loading...' : 'Send GET Request'}
            </Button>
            {getResponse && (
              <div className="mt-4">
                <Label>Response:</Label>
                <pre className="mt-2 p-3 bg-gray-100 rounded-md text-sm overflow-auto">
                  {getResponse}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* POST Request Test */}
        <Card>
          <CardHeader>
            <CardTitle>POST Request Test</CardTitle>
            <CardDescription>
              Test the connection with a POST request and custom data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="postData">Message to send:</Label>
              <Input
                id="postData"
                value={postData}
                onChange={(e) => setPostData(e.target.value)}
                placeholder="Enter a message..."
                className="mt-2"
              />
            </div>
            <Button 
              onClick={handlePostRequest} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Loading...' : 'Send POST Request'}
            </Button>
            {postResponse && (
              <div className="mt-4">
                <Label>Response:</Label>
                <pre className="mt-2 p-3 bg-gray-100 rounded-md text-sm overflow-auto">
                  {postResponse}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
          <CardDescription>
            Backend should be running on http://localhost:8000
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            If you see responses above, the frontend is successfully connected to the Django backend!
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 