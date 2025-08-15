'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Eye, Trash2, Award, BarChart3, Users, Camera, FileText } from 'lucide-react';
import Navbar from '@/components/layout/navbar';
import { apiClient, API_ENDPOINTS } from '@/lib/api';

interface AuctionItem {
  id: string;
  url?: string;
  auctionName?: string;
  lotNumber?: string;
  images?: string[];
  sku?: string;
  itemName?: string;
  category?: string;
  description?: string;
  lead?: string;
  auctionSiteEstimate?: string;
  aiDescription?: string;
  aiEstimate?: string;
  status: 'research' | 'waiting' | 'winning' | 'photography' | 'research2' | 'finalized';
  researcherEstimate?: string;
  researcherDescription?: string;
  referenceUrls?: string[];
  photographerQuantity?: number;
  photographerImages?: string[];
  finalData?: any;
  createdAt: Date;
}

interface UserAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'researcher' | 'photographer' | 'researcher2';
  createdAt: Date;
}

export default function AdminDashboard() {
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [newItem, setNewItem] = useState({
    url: '',
    auctionName: '',
    lotNumber: ''
  });
  const [newAccount, setNewAccount] = useState({
    name: '',
    email: '',
    password: '',
    role: 'researcher' as 'researcher' | 'photographer' | 'researcher2'
  });
  const [searchType, setSearchType] = useState<'url' | 'auction'>('url');

  useEffect(() => {
    const savedItems = localStorage.getItem('auctionItems');
    if (savedItems) {
      setItems(JSON.parse(savedItems));
    }
    
    const savedAccounts = localStorage.getItem('userAccounts');
    if (savedAccounts) {
      setAccounts(JSON.parse(savedAccounts));
    }
  }, []);





  const saveItems = (updatedItems: AuctionItem[]) => {
    localStorage.setItem('auctionItems', JSON.stringify(updatedItems));
    setItems(updatedItems);
  };

  const saveAccounts = (updatedAccounts: UserAccount[]) => {
    localStorage.setItem('userAccounts', JSON.stringify(updatedAccounts));
    setAccounts(updatedAccounts);
  };

  const handleSearch = async () => {
    if ((searchType === 'url' && !newItem.url) || 
        (searchType === 'auction' && (!newItem.auctionName || !newItem.lotNumber))) {
      return;
    }

    let webhookData: any = null;

    // If search type is URL, call the webhook
    if (searchType === 'url' && newItem.url) {
      try {
        console.log('Calling webhook with URL:', newItem.url);
        const response = await apiClient.post(API_ENDPOINTS.CALL_WEBHOOK, {
          url_main: newItem.url
        });
        console.log('Webhook response:', response);
        webhookData = (response.data as any)?.webhook_response;
      } catch (error) {
        console.error('Webhook call failed:', error);
      }
    }

    // Create item with webhook data if available
    const mockResponse: AuctionItem = {
      id: Date.now().toString(),
      url: searchType === 'url' ? newItem.url : undefined,
      auctionName: searchType === 'auction' ? newItem.auctionName : (webhookData?.auction_name || 'Heritage Auctions'),
      lotNumber: searchType === 'auction' ? newItem.lotNumber : (webhookData?.lot_number || 'LOT-' + Math.floor(Math.random() * 10000)),
      images: webhookData?.all_unique_image_urls ? webhookData.all_unique_image_urls.split(',') : [
        'https://images.pexels.com/photos/1616403/pexels-photo-1616403.jpeg',
        'https://images.pexels.com/photos/1070850/pexels-photo-1070850.jpeg'
      ],
      sku: 'SKU-' + Math.floor(Math.random() * 100000),
      itemName: webhookData?.item_name || 'Vintage Art Piece Collection',
      category: webhookData?.category || 'Art & Collectibles',
      description: webhookData?.description || 'Beautiful vintage art piece from renowned artist',
      lead: webhookData?.lead || 'Excellent condition, authenticated piece',
      auctionSiteEstimate: webhookData?.estimate || '$2,000 - $3,500',
      aiDescription: webhookData?.ai_response || 'AI-generated detailed description of the artwork including style, period, and condition assessment',
      aiEstimate: webhookData?.ai_response ? 'Based on AI analysis' : '$2,800 (AI Confidence: 85%)',
      status: 'research',
      createdAt: new Date()
    };

    const updatedItems = [...items, mockResponse];
    saveItems(updatedItems);
    
    setNewItem({ url: '', auctionName: '', lotNumber: '' });
  };

  const handleCreateAccount = () => {
    if (!newAccount.name || !newAccount.email || !newAccount.password || !newAccount.role) {
      return;
    }

    const account: UserAccount = {
      id: Date.now().toString(),
      name: newAccount.name,
      email: newAccount.email,
      password: newAccount.password,
      role: newAccount.role,
      createdAt: new Date()
    };

    const updatedAccounts = [...accounts, account];
    saveAccounts(updatedAccounts);
    
    setNewAccount({ name: '', email: '', password: '', role: 'researcher' });
  };

  const deleteAccount = (id: string) => {
    const updatedAccounts = accounts.filter(account => account.id !== id);
    saveAccounts(updatedAccounts);
  };

  const updateItemStatus = (id: string, status: AuctionItem['status']) => {
    const updatedItems = items.map(item => 
      item.id === id ? { ...item, status } : item
    );
    saveItems(updatedItems);
  };

  const deleteItem = (id: string) => {
    const updatedItems = items.filter(item => item.id !== id);
    saveItems(updatedItems);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'research': return 'bg-blue-100 text-blue-800';
      case 'waiting': return 'bg-yellow-100 text-yellow-800';
      case 'winning': return 'bg-green-100 text-green-800';
      case 'photography': return 'bg-purple-100 text-purple-800';
      case 'research2': return 'bg-orange-100 text-orange-800';
      case 'finalized': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = {
    research: items.filter(item => item.status === 'research').length,
    waiting: items.filter(item => item.status === 'waiting').length,
    winning: items.filter(item => item.status === 'winning').length,
    photography: items.filter(item => item.status === 'photography').length,
    research2: items.filter(item => item.status === 'research2').length,
    finalized: items.filter(item => item.status === 'finalized').length,
    total: items.length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Manage auction items and monitor workflow progress</p>
          

        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="add-item">Add Item</TabsTrigger>
            <TabsTrigger value="manage-items">Manage Items</TabsTrigger>
            <TabsTrigger value="waiting-items">Waiting Items</TabsTrigger>
            <TabsTrigger value="manage-users">Manage Users</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Research</CardTitle>
                  <FileText className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.research}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Waiting</CardTitle>
                  <Award className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.waiting}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Winning</CardTitle>
                  <Award className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.winning}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Photography</CardTitle>
                  <Camera className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.photography}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Research 2</CardTitle>
                  <Users className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.research2}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Finalized</CardTitle>
                  <BarChart3 className="h-4 w-4 text-gray-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.finalized}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Items</CardTitle>
                <CardDescription>Latest items added to the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.slice(-5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{item.itemName}</h3>
                        <p className="text-sm text-gray-600">{item.auctionName} - {item.lotNumber}</p>
                      </div>
                      <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add-item">
            <Card>
              <CardHeader>
                <CardTitle>Add New Item</CardTitle>
                <CardDescription>Search for items using URL or auction details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label>Search Method</Label>
                  <Select value={searchType} onValueChange={(value: 'url' | 'auction') => setSearchType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="url">By URL</SelectItem>
                      <SelectItem value="auction">By Auction & Lot Number</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {searchType === 'url' ? (
                  <div className="space-y-2">
                    <Label htmlFor="url">Item URL</Label>
                    <Input
                      id="url"
                      placeholder="Enter the auction item URL"
                      value={newItem.url}
                      onChange={(e) => setNewItem({...newItem, url: e.target.value})}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="auctionName">Auction Name</Label>
                      <Input
                        id="auctionName"
                        placeholder="Enter auction name"
                        value={newItem.auctionName}
                        onChange={(e) => setNewItem({...newItem, auctionName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lotNumber">Lot Number</Label>
                      <Input
                        id="lotNumber"
                        placeholder="Enter lot number"
                        value={newItem.lotNumber}
                        onChange={(e) => setNewItem({...newItem, lotNumber: e.target.value})}
                      />
                    </div>
                  </div>
                )}

                <Button onClick={handleSearch} className="w-full">
                  <Search className="mr-2 h-4 w-4" />
                  Search & Add Item
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage-items">
            <Card>
              <CardHeader>
                <CardTitle>Manage Items</CardTitle>
                <CardDescription>View and manage all auction items</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{item.itemName}</h3>
                          <p className="text-gray-600">{item.auctionName} - {item.lotNumber}</p>
                          <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                            {item.aiEstimate && <span className="text-sm text-gray-600">AI Estimate: {item.aiEstimate}</span>}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>{item.itemName}</DialogTitle>
                                <DialogDescription>Item Details</DialogDescription>
                              </DialogHeader>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-medium">Basic Info</h4>
                                  <p><strong>SKU:</strong> {item.sku}</p>
                                  <p><strong>Category:</strong> {item.category}</p>
                                  <p><strong>Status:</strong> {item.status}</p>
                                </div>
                                <div>
                                  <h4 className="font-medium">Estimates</h4>
                                  <p><strong>Auction Site:</strong> {item.auctionSiteEstimate}</p>
                                  <p><strong>AI Estimate:</strong> {item.aiEstimate}</p>
                                  {item.researcherEstimate && <p><strong>Researcher:</strong> {item.researcherEstimate}</p>}
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          

                          
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => deleteItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="waiting-items">
            <Card>
              <CardHeader>
                <CardTitle>Waiting Items</CardTitle>
                <CardDescription>Items completed by researchers, ready for admin approval</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.filter(item => item.status === 'waiting').map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{item.itemName}</h3>
                          <p className="text-gray-600">{item.auctionName} - {item.lotNumber}</p>
                          <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <Badge className="bg-yellow-100 text-yellow-800">Waiting</Badge>
                            {item.researcherEstimate && <span className="text-sm text-gray-600">Researcher Estimate: {item.researcherEstimate}</span>}
                          </div>
                          {item.researcherDescription && (
                            <div className="mt-2">
                              <p className="text-sm"><strong>Researcher Notes:</strong> {item.researcherDescription}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>{item.itemName}</DialogTitle>
                                <DialogDescription>Item Details</DialogDescription>
                              </DialogHeader>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-medium">Basic Info</h4>
                                  <p><strong>SKU:</strong> {item.sku}</p>
                                  <p><strong>Category:</strong> {item.category}</p>
                                  <p><strong>Status:</strong> {item.status}</p>
                                  <p><strong>Researcher Estimate:</strong> {item.researcherEstimate}</p>
                                </div>
                                <div>
                                  <h4 className="font-medium">Estimates</h4>
                                  <p><strong>Auction Site:</strong> {item.auctionSiteEstimate}</p>
                                  <p><strong>AI Estimate:</strong> {item.aiEstimate}</p>
                                  <p><strong>Researcher:</strong> {item.researcherEstimate}</p>
                                </div>
                              </div>
                              {item.researcherDescription && (
                                <div className="mt-4">
                                  <h4 className="font-medium">Researcher Analysis</h4>
                                  <p className="text-sm">{item.researcherDescription}</p>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          
                          <Button 
                            size="sm" 
                            onClick={() => updateItemStatus(item.id, 'winning')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Mark as Winning
                          </Button>
                          
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => deleteItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {items.filter(item => item.status === 'waiting').length === 0 && (
                    <p className="text-gray-500 text-center py-8">No items waiting for approval</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage-users">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Create New User Account</CardTitle>
                  <CardDescription>Add accounts for researchers and photographers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="userName">Full Name</Label>
                      <Input
                        id="userName"
                        placeholder="Enter full name"
                        value={newAccount.name}
                        onChange={(e) => setNewAccount({...newAccount, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="userEmail">Email</Label>
                      <Input
                        id="userEmail"
                        type="email"
                        placeholder="Enter email address"
                        value={newAccount.email}
                        onChange={(e) => setNewAccount({...newAccount, email: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="userPassword">Password</Label>
                      <Input
                        id="userPassword"
                        type="password"
                        placeholder="Enter password"
                        value={newAccount.password}
                        onChange={(e) => setNewAccount({...newAccount, password: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="userRole">Role</Label>
                      <Select value={newAccount.role} onValueChange={(value: 'researcher' | 'photographer' | 'researcher2') => setNewAccount({...newAccount, role: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="researcher">Researcher</SelectItem>
                          <SelectItem value="photographer">Photographer</SelectItem>
                          <SelectItem value="researcher2">Researcher 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button onClick={handleCreateAccount} className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Account
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Existing User Accounts</CardTitle>
                  <CardDescription>Manage all user accounts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {accounts.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No user accounts created yet</p>
                    ) : (
                      accounts.map((account) => (
                        <div key={account.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">{account.name}</h3>
                              <p className="text-gray-600">{account.email}</p>
                              <Badge className={
                                account.role === 'researcher' ? 'bg-blue-100 text-blue-800' :
                                account.role === 'photographer' ? 'bg-purple-100 text-purple-800' :
                                'bg-green-100 text-green-800'
                              }>
                                {account.role.charAt(0).toUpperCase() + account.role.slice(1)}
                              </Badge>
                            </div>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => deleteAccount(account.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Workflow Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(stats).filter(([key]) => key !== 'total').map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <span className="capitalize">{status}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Completion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600">
                      {stats.total > 0 ? Math.round((stats.finalized / stats.total) * 100) : 0}%
                    </div>
                    <p className="text-gray-600">of items completed</p>
                    <div className="mt-4">
                      <p className="text-sm text-gray-500">
                        {stats.finalized} out of {stats.total} items finalized
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}