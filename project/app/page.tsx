'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, FileText, Camera, Users, ArrowRight, Gavel } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getDashboardInfo = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          title: 'Admin Dashboard',
          description: 'Manage the entire auction workflow, view webhook data, and oversee all operations.',
          icon: Shield,
          color: 'bg-red-100 text-red-800',
          href: '/admin'
        };
      case 'researcher':
        return {
          title: 'Research Dashboard',
          description: 'Conduct research on auction items, analyze market trends, and prepare item assessments.',
          icon: FileText,
          color: 'bg-blue-100 text-blue-800',
          href: '/researcher'
        };
      case 'photographer':
        return {
          title: 'Photography Dashboard',
          description: 'Manage item photography, organize image galleries, and ensure visual quality.',
          icon: Camera,
          color: 'bg-purple-100 text-purple-800',
          href: '/photographer'
        };
      case 'researcher2':
        return {
          title: 'Research 2 Dashboard',
          description: 'Secondary research tasks, market analysis, and detailed item investigations.',
          icon: Users,
          color: 'bg-green-100 text-green-800',
          href: '/researcher2'
        };
      default:
        return {
          title: 'Dashboard',
          description: 'Access your personalized dashboard.',
          icon: Shield,
          color: 'bg-gray-100 text-gray-800',
          href: '/'
        };
    }
  };

  const dashboardInfo = getDashboardInfo(user.role);
  const Icon = dashboardInfo.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Header */}
        <div className="text-center mb-12">
          <div className="mx-auto h-20 w-20 bg-blue-600 rounded-full flex items-center justify-center mb-6">
            <Gavel className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome back, {user.name}! 👋
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            You&apos;re logged in as a <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${dashboardInfo.color}`}>
              <Icon className="h-4 w-4 mr-1" />
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </span>
          </p>
        </div>

        {/* Main Dashboard Card */}
        <Card className="max-w-4xl mx-auto mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center space-x-2">
              <Icon className="h-6 w-6" />
              <span>{dashboardInfo.title}</span>
            </CardTitle>
            <CardDescription className="text-lg">
              {dashboardInfo.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href={dashboardInfo.href}>
              <Button size="lg" className="px-8">
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-red-600" />
                <span>Admin Panel</span>
              </CardTitle>
              <CardDescription>
                Access administrative functions and system overview
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin">
                <Button variant="outline" className="w-full">
                  Access Admin
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span>Research Tools</span>
              </CardTitle>
              <CardDescription>
                Research auction items and market trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/researcher">
                <Button variant="outline" className="w-full">
                  Start Research
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Camera className="h-5 w-5 text-purple-600" />
                <span>Photography</span>
              </CardTitle>
              <CardDescription>
                Manage item photography and image galleries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/photographer">
                <Button variant="outline" className="w-full">
                  View Photos
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            AuctionFlow System • Version 2.0 • All systems operational
          </p>
        </div>
      </div>
    </div>
  );
}