'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Gavel, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SignIn() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with:', formData);
    
    if (!formData.email || !formData.password || !formData.role) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      // Admin authentication - check against environment or secure storage
      if (formData.role === 'admin') {
        console.log('Checking admin credentials...');
        // TODO: Implement secure admin authentication
        // For now, redirect to admin page (credentials will be checked by Django)
        const userData = {
          email: formData.email,
          role: formData.role,
          name: 'Admin User'
        };
        localStorage.setItem('currentUser', JSON.stringify(userData));
        console.log('User data stored in localStorage');
        router.push('/admin');
        return;
      }

      // Check for other role accounts created by admin
      console.log('Checking user accounts...');
      const accounts = JSON.parse(localStorage.getItem('userAccounts') || '[]');
      console.log('Found accounts:', accounts);
      
      const account = accounts.find((acc: any) => 
        acc.email === formData.email && 
        acc.password === formData.password && 
        acc.role === formData.role
      );

      if (account) {
        console.log('User account found, redirecting...');
        const userData = {
          email: account.email,
          role: account.role,
          name: account.name
        };
        localStorage.setItem('currentUser', JSON.stringify(userData));
        console.log('User data stored in localStorage');
        router.push(`/${account.role}`);
      } else {
        setError('Invalid credentials or account not found');
      }
    } catch (err) {
      console.error('Error during sign in:', err);
      setError('An error occurred during sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestClick = () => {
    console.log('Test button clicked');
    console.log('Current form data:', formData);
    console.log('localStorage available:', typeof window !== 'undefined' && window.localStorage);
    
    // Test localStorage
    try {
      localStorage.setItem('test', 'working');
      const testValue = localStorage.getItem('test');
      console.log('localStorage test:', testValue);
      localStorage.removeItem('test');
    } catch (err) {
      console.error('localStorage error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Gavel className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold">AuctionFlow</h1>
          </div>
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          


          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select onValueChange={(value) => setFormData({...formData, role: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="researcher">Researcher</SelectItem>
                  <SelectItem value="photographer">Photographer</SelectItem>
                  <SelectItem value="researcher2">Researcher 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          {/* Debug button */}
          <Button 
            type="button" 
            variant="outline" 
            className="w-full mt-2"
            onClick={handleTestClick}
          >
            Test Debug
          </Button>

          <div className="mt-4">
            <Link href="/" className="flex items-center justify-center text-sm text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}