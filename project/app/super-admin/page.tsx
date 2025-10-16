'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, 
  Users, 
  CreditCard, 
  Settings, 
  Plus, 
  Trash2, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';
import Navbar from '@/components/layout/navbar';
import { UserAccount, CreditBalance, CreditTransaction, CreditSettings } from '@/types/auction';

export default function SuperAdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  
  // State management
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  // User management state
  const [allUsers, setAllUsers] = useState<UserAccount[]>([]);
  const [admins, setAdmins] = useState<UserAccount[]>([]);
  const [photographers, setPhotographers] = useState<UserAccount[]>([]);
  const [researchers, setResearchers] = useState<UserAccount[]>([]);
  const [researchers2, setResearchers2] = useState<UserAccount[]>([]);
  
  // Credit management state
  const [adminCredits, setAdminCredits] = useState<{ [userId: string]: CreditBalance }>({});
  const [creditTransactions, setCreditTransactions] = useState<{ [userId: string]: CreditTransaction[] }>({});
  const [creditSettings, setCreditSettings] = useState<CreditSettings[]>([]);
  
  // Form state
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isTopupModalOpen, setIsTopupModalOpen] = useState(false);
  const [selectedUserForTopup, setSelectedUserForTopup] = useState<string>('');
  const [topupAmount, setTopupAmount] = useState<number>(0);
  
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin' as 'admin' | 'photographer' | 'researcher' | 'researcher2'
  });

  // Check authentication and role
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    } else if (user && user.role !== 'super_admin') {
      router.push('/admin');
    }
  }, [user, isLoading, router]);

  // Load all data
  useEffect(() => {
    if (user && user.role === 'super_admin') {
      loadAllData();
    }
  }, [user]);

  const loadAllData = async () => {
    setIsLoadingData(true);
    try {
      await Promise.all([
        loadUsers(),
        loadCreditSettings()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data');
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadUsers = async () => {
    try {
      const [adminsRes, photographersRes, researchersRes, researchers2Res] = await Promise.all([
        fetch('/api/users/by-role?role=admin'),
        fetch('/api/users/by-role?role=photographer'),
        fetch('/api/users/by-role?role=researcher'),
        fetch('/api/users/by-role?role=researcher2')
      ]);

      const adminsData = await adminsRes.json();
      const photographersData = await photographersRes.json();
      const researchersData = await researchersRes.json();
      const researchers2Data = await researchers2Res.json();

      if (adminsData.success) setAdmins(adminsData.users);
      if (photographersData.success) setPhotographers(photographersData.users);
      if (researchersData.success) setResearchers(researchersData.users);
      if (researchers2Data.success) setResearchers2(researchers2Data.users);

      // Load credits for all admins
      await loadAdminCredits(adminsData.users);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadAdminCredits = async (adminUsers: UserAccount[]) => {
    const creditsPromises = adminUsers.map(async (admin) => {
      try {
        const response = await fetch(`/api/credits/balance?userId=${admin.id}`);
        const data = await response.json();
        
        if (data.success) {
          return { userId: admin.id, credits: data.credits };
        }
      } catch (error) {
        console.error(`Error loading credits for ${admin.id}:`, error);
      }
      return null;
    });

    const creditsResults = await Promise.all(creditsPromises);
    const creditsMap: { [userId: string]: CreditBalance } = {};
    
    creditsResults.forEach(result => {
      if (result) {
        creditsMap[result.userId] = result.credits;
      }
    });
    
    setAdminCredits(creditsMap);
  };

  const loadCreditSettings = async () => {
    try {
      const response = await fetch('/api/credits/settings');
      const data = await response.json();
      
      if (data.success) {
        const settingsArray = Object.entries(data.settings).map(([name, value]) => ({
          id: name,
          settingName: name,
          settingValue: value as number,
          description: name === 'item_fetch_cost' ? 'Credits deducted per item fetched' : 'Credits deducted when item reaches research2 stage',
          updatedAt: new Date()
        }));
        setCreditSettings(settingsArray);
      }
    } catch (error) {
      console.error('Error loading credit settings:', error);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingData(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/users/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userData: newUserForm,
          createdBy: user?.id
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage('User created successfully!');
        setNewUserForm({ name: '', email: '', password: '', role: 'admin' });
        setIsAddUserModalOpen(false);
        await loadUsers();
      } else {
        setError(result.error || 'Failed to create user');
      }
    } catch (error) {
      setError('An error occurred while creating user');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    setIsLoadingData(true);
    try {
      const response = await fetch(`/api/users/manage?userId=${userId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setMessage('User deleted successfully!');
        await loadUsers();
      } else {
        setError(result.error || 'Failed to delete user');
      }
    } catch (error) {
      setError('An error occurred while deleting user');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleTopupCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForTopup || topupAmount <= 0) return;

    setIsLoadingData(true);
    try {
      const response = await fetch('/api/credits/topup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUserForTopup,
          amount: topupAmount,
          description: `Credit top-up by Super Admin`
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage(`Credits topped up successfully!`);
        setTopupAmount(0);
        setSelectedUserForTopup('');
        setIsTopupModalOpen(false);
        await loadUsers(); // This will reload credits
      } else {
        setError(result.error || 'Failed to top up credits');
      }
    } catch (error) {
      setError('An error occurred while topping up credits');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleUpdateCreditSettings = async (settingName: string, newValue: number) => {
    setIsLoadingData(true);
    try {
      const updatedSettings = { [settingName]: newValue };
      
      const response = await fetch('/api/credits/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: updatedSettings,
          updatedBy: user?.id
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage('Credit settings updated successfully!');
        await loadCreditSettings();
      } else {
        setError(result.error || 'Failed to update credit settings');
      }
    } catch (error) {
      setError('An error occurred while updating credit settings');
    } finally {
      setIsLoadingData(false);
    }
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  // Show access denied if not authenticated or not super admin
  if (!user || user.role !== 'super_admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
          <p className="text-gray-600">Manage users, credits, and system settings</p>
        </div>

        {/* Messages */}
        {message && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{message}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="credits">Credit Management</TabsTrigger>
            <TabsTrigger value="settings">Credit Settings</TabsTrigger>
          </TabsList>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Admins */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Admins ({admins.length})
                  </CardTitle>
                  <CardDescription>Manage admin users</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button 
                      onClick={() => {
                        setNewUserForm({ ...newUserForm, role: 'admin' });
                        setIsAddUserModalOpen(true);
                      }}
                      className="w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Admin
                    </Button>
                    
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {admins.map((admin) => (
                        <div key={admin.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <p className="font-medium">{admin.name}</p>
                            <p className="text-sm text-gray-500">{admin.email}</p>
                            {adminCredits[admin.id] && (
                              <Badge variant={adminCredits[admin.id].isLowBalance ? "destructive" : "default"}>
                                {adminCredits[admin.id].currentCredits} credits
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(admin.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Photographers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Photographers ({photographers.length})
                  </CardTitle>
                  <CardDescription>Manage photographer users</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button 
                      onClick={() => {
                        setNewUserForm({ ...newUserForm, role: 'photographer' });
                        setIsAddUserModalOpen(true);
                      }}
                      className="w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Photographer
                    </Button>
                    
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {photographers.map((photographer) => (
                        <div key={photographer.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <p className="font-medium">{photographer.name}</p>
                            <p className="text-sm text-gray-500">{photographer.email}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(photographer.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Researcher 1 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Researcher 1 ({researchers.length})
                  </CardTitle>
                  <CardDescription>Primary research and initial item analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button 
                      onClick={() => {
                        setNewUserForm({ ...newUserForm, role: 'researcher' });
                        setIsAddUserModalOpen(true);
                      }}
                      className="w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Researcher 1
                    </Button>
                    
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {researchers.map((researcher) => (
                        <div key={researcher.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <p className="font-medium">{researcher.name}</p>
                            <p className="text-sm text-gray-500">{researcher.email}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(researcher.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Researcher 2 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Researcher 2 ({researchers2.length})
                  </CardTitle>
                  <CardDescription>Secondary research and final validation</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button 
                      onClick={() => {
                        setNewUserForm({ ...newUserForm, role: 'researcher2' });
                        setIsAddUserModalOpen(true);
                      }}
                      className="w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Researcher 2
                    </Button>
                    
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {researchers2.map((researcher) => (
                        <div key={researcher.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <p className="font-medium">{researcher.name}</p>
                            <p className="text-sm text-gray-500">{researcher.email}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(researcher.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Credit Management Tab */}
          <TabsContent value="credits" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Admin Credit Balances
                </CardTitle>
                <CardDescription>View and manage admin credit balances</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {admins.map((admin) => {
                    const credits = adminCredits[admin.id];
                    return (
                      <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="font-medium">{admin.name}</p>
                            <p className="text-sm text-gray-500">{admin.email}</p>
                          </div>
                          {credits && (
                            <div className="flex items-center gap-2">
                              <Badge variant={credits.isLowBalance ? "destructive" : "default"}>
                                {credits.currentCredits} credits
                              </Badge>
                              <span className="text-sm text-gray-500">
                                Total: {credits.totalPurchased}
                              </span>
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={() => {
                            setSelectedUserForTopup(admin.id);
                            setIsTopupModalOpen(true);
                          }}
                          variant="outline"
                        >
                          <DollarSign className="mr-2 h-4 w-4" />
                          Top Up
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Credit Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Credit Pricing Settings
                </CardTitle>
                <CardDescription>Configure credit costs for different actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {creditSettings.map((setting) => (
                    <div key={setting.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">
                          {setting.settingName === 'item_fetch_cost' ? 'Item Fetch Cost' : 'Research2 Stage Cost'}
                        </p>
                        <p className="text-sm text-gray-500">{setting.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={setting.settingValue}
                          onChange={(e) => {
                            const newValue = parseInt(e.target.value);
                            if (!isNaN(newValue) && newValue >= 0) {
                              handleUpdateCreditSettings(setting.settingName, newValue);
                            }
                          }}
                          className="w-20"
                          min="0"
                        />
                        <span className="text-sm text-gray-500">credits</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add User Modal */}
        {isAddUserModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Add New User</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddUserModalOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newUserForm.name}
                    onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={newUserForm.role.charAt(0).toUpperCase() + newUserForm.role.slice(1)}
                    disabled
                    className="bg-gray-50"
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isLoadingData} className="flex-1">
                    {isLoadingData ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create User'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddUserModalOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Top Up Credits Modal */}
        {isTopupModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Top Up Credits</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTopupModalOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <form onSubmit={handleTopupCredits} className="space-y-4">
                <div>
                  <Label>Admin</Label>
                  <Input
                    value={admins.find(a => a.id === selectedUserForTopup)?.name || ''}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(parseInt(e.target.value) || 0)}
                    min="1"
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isLoadingData || topupAmount <= 0} className="flex-1">
                    {isLoadingData ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Topping Up...
                      </>
                    ) : (
                      'Top Up Credits'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsTopupModalOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
