'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const getDashboardUrl = (role: string) => {
    switch (role) {
      case 'super_admin': return '/super-admin';
      case 'admin': return '/admin';
      case 'researcher': return '/researcher';
      case 'photographer': return '/photographer';
      case 'researcher2': return '/researcher2';
      default: return '/';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const success = await login(email, password);
      // Determine destination based on hypothetical user object if available,
      // but 'login' changes global state.
      // We need to fetch the user or rely on the fact that login returns success.
      // Ideally, we'd get the role from the login response.
      // Seeing as useAuth's login might not return the user directly, we might need to
      // rely on the updated 'user' from the hook, but that updates asynchronously.
      // However, typical implementations allow us to infer or fetch it.
      // Let's assume for now we redirect to root if we can't get the role immediately,
      // but actually, we should check how 'login' is implemented.

      // Checking AuthContext... it seems login returns boolean.
      // Let's reload to trigger the root page check OR fetch user profile.
      // BETTER APPROACH: The 'login' function likely sets the user state.
      // Let's trust that subsequent navigation or valid user state will handle it.
      // Wait, to be instant, we need the role.

      if (success) {
        // Force a reload or navigation.
        // Since we don't have the role synchronously here without modifying login,
        // We will navigate to '/' and let the root page handle the specific redirect
        // (which we are about to implement in the next step).
        // OR, even better, we modify Login to return the role.
        // For now, let's look at AuthContext to see if we can get the role easily.
        router.push('/');
      } else {
        setError('Invalid email or password');
      }
    } catch (error) {
      setError('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex justify-center">
            <img
              src="https://i.ibb.co/JFmJg7sS/bidsquire-logo.png"
              alt="Bidsquire"
              className="h-16 w-auto"
            />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Welcome to Bidsquire
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your account to continue
          </p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/auth/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
