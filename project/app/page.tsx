'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gavel, Users, Camera, Search, BarChart3 } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem('currentUser');
    if (user) {
      const userData = JSON.parse(user);
      router.push(`/${userData.role}`);
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Gavel className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">AuctionFlow</h1>
            </div>
            <div className="space-x-4">
              <Button 
                variant="outline" 
                onClick={() => router.push('/auth/signin')}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 sm:text-6xl">
            Professional Auction
            <span className="text-blue-600"> Management System</span>
          </h2>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            Streamline your auction workflow from research to final listing with our comprehensive management platform.
          </p>
          <div className="mt-10">
            <Button 
              size="lg" 
              className="px-8 py-3 text-lg"
              onClick={() => router.push('/auth/signin')}
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <BarChart3 className="h-12 w-12 text-blue-600 mx-auto" />
              <CardTitle>Admin Control</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Comprehensive dashboard with analytics, item management, and workflow oversight.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Search className="h-12 w-12 text-green-600 mx-auto" />
              <CardTitle>Research Hub</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Two-tier research system for thorough item analysis and valuation.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Camera className="h-12 w-12 text-purple-600 mx-auto" />
              <CardTitle>Photography</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Professional photo management with quantity tracking and quality control.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="h-12 w-12 text-orange-600 mx-auto" />
              <CardTitle>Role-Based Access</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Secure, role-specific interfaces for admins, researchers, and photographers.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2025 AuctionFlow. Professional auction management made simple.</p>
          </div>
        </div>
      </div>
    </div>
  );
}