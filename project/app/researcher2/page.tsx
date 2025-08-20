'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ExternalLink, Image, Calendar, Tag, DollarSign, RefreshCw, Plus, ArrowRight, Users, Edit3, Save, X, FileText, Search, Trash2 } from 'lucide-react';
import Navbar from '@/components/layout/navbar';
import { dataStore } from '@/services/dataStore';
import { AuctionItem } from '@/types/auction';

export default function Researcher2Page() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<AuctionItem>>({});
  const [activeTab, setActiveTab] = useState('research2');

  // Check authentication
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    } else if (user && user.role !== 'researcher2') {
      router.push('/');
    }
  }, [user, isLoading, router]);

  // Load data on component mount
  useEffect(() => {
    if (user && user.role === 'researcher2') {
      loadItems();
    }
  }, [user]);

  const loadItems = async () => {
    try {
      const allItems = await dataStore.getItems();
      const research2Items = allItems.filter(item => 
        item.status === 'research2' || item.assignedTo === user?.id
      );
      setItems(research2Items);
      setIsLoadingData(false);
    } catch (error) {
      console.error('Error loading items:', error);
      setIsLoadingData(false);
    }
  };

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    try {
      const allItems = await dataStore.getItems();
      const research2Items = allItems.filter(item => 
        item.status === 'research2' || item.assignedTo === user?.id
      );
      
      if (term.trim()) {
        const filtered = research2Items.filter(item =>
          item.itemName?.toLowerCase().includes(term.toLowerCase()) ||
          item.description?.toLowerCase().includes(term.toLowerCase()) ||
          item.category?.toLowerCase().includes(term.toLowerCase()) ||
          item.auctionName?.toLowerCase().includes(term.toLowerCase())
        );
        setItems(filtered);
      } else {
        setItems(research2Items);
      }
    } catch (error) {
      console.error('Error searching items:', error);
    }
  };

  const startEditing = (item: AuctionItem) => {
    setEditingItem(item.id);
    setEditForm({
      itemName: item.itemName,
      description: item.description,
      category: item.category,
      notes: item.notes,
      priority: item.priority
    });
  };

  const saveEdit = async (itemId: string) => {
    try {
      const updatedItem = await dataStore.updateItem(itemId, editForm);
      if (updatedItem) {
        setEditingItem(null);
        setEditForm({});
        await loadItems();
      }
    } catch (error) {
      console.error('Error saving item:', error);
    }
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditForm({});
  };

  const moveToNextStatus = async (itemId: string) => {
    try {
      if (await dataStore.moveItemToNextStatus(itemId, user?.id || '', user?.name || '')) {
        await loadItems();
      }
    } catch (error) {
      console.error('Error moving item to next status:', error);
    }
  };

  const assignToMe = async (itemId: string) => {
    try {
      await dataStore.updateItem(itemId, { assignedTo: user?.id });
      await loadItems();
    } catch (error) {
      console.error('Error assigning item:', error);
    }
  };

  const deleteItem = async (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await dataStore.deleteItem(itemId);
        await loadItems();
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-300 text-red-700';
      case 'medium': return 'border-yellow-300 text-yellow-700';
      case 'low': return 'border-green-300 text-green-700';
      default: return 'border-gray-300 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
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

  // Show access denied if not researcher2
  if (user && user.role !== 'researcher2') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access the researcher2 dashboard.</p>
        </div>
      </div>
    );
  }

  const research2Items = items.filter(item => item.status === 'research2');
  const myAssignedItems = items.filter(item => item.assignedTo === user?.id);
  const stats = dataStore.getDashboardStats(user?.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Research 2 Dashboard</h1>
          <p className="text-gray-600">Secondary research and final preparation for auction items</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Research 2 Items</CardTitle>
              <FileText className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.research2}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Items</CardTitle>
              <Tag className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.myItems}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <Calendar className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overdue}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>Search Items</CardTitle>
            <CardDescription>
              Search through research2 items by name, description, category, or auction
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  loadItems();
                }}
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="research2">Research 2 Items</TabsTrigger>
            <TabsTrigger value="assigned">My Assigned Items</TabsTrigger>
            <TabsTrigger value="completed">Completed Research 2</TabsTrigger>
          </TabsList>

          {/* Research 2 Items Tab */}
          <TabsContent value="research2" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-900">Research 2 Items</h2>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{research2Items.length} items</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadItems}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {isLoadingData ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading items...</span>
              </div>
            ) : research2Items.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No research2 items</h3>
                  <p className="text-gray-600">
                    All items have been completed or there are no items in the research2 stage.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {research2Items.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    {(item.mainImageUrl || (item.images && item.images.length > 0)) && (
                      <div className="h-32 overflow-hidden rounded-t-lg">
                        <img
                          src={item.mainImageUrl || (item.images && item.images.length > 0 ? item.images[0] : '')}
                          alt={item.itemName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg line-clamp-2">{item.itemName}</CardTitle>
                          <CardDescription className="line-clamp-1">
                            {item.auctionName} - {item.lotNumber}
                          </CardDescription>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Badge className={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                          {item.priority && (
                            <Badge variant="outline" className={getPriorityColor(item.priority)}>
                              {item.priority}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {item.description}
                      </p>

                      {/* Original Webhook Data */}
                      <div className="bg-blue-50 p-2 rounded border-l-2 border-blue-400">
                        <h4 className="text-xs font-medium text-blue-900 mb-1">📋 Original Data</h4>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          <div>
                            <span className="font-medium text-blue-700">Category:</span> {item.category}
                          </div>
                          <div>
                            <span className="font-medium text-blue-700">Estimate:</span> {item.auctionSiteEstimate || 'N/A'}
                          </div>
                        </div>
                        {item.aiDescription && (
                          <div className="mt-1">
                            <span className="font-medium text-blue-700">AI Analysis:</span>
                            <p className="text-blue-600 text-xs line-clamp-2">{item.aiDescription}</p>
                          </div>
                        )}
                      </div>

                      {/* First Researcher Data */}
                      {item.researcherEstimate && (
                        <div className="bg-green-50 p-2 rounded border-l-2 border-green-400">
                          <h4 className="text-xs font-medium text-green-900 mb-1">🔍 First Research</h4>
                          <div className="text-xs">
                            <span className="font-medium text-green-700">Estimate:</span>
                            <span className="text-green-600 ml-1">{item.researcherEstimate}</span>
                          </div>
                          {item.researcherDescription && (
                            <div className="mt-1">
                              <span className="font-medium text-green-700">Notes:</span>
                              <p className="text-green-600 text-xs line-clamp-2">{item.researcherDescription}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Photography Data */}
                      {(item.photographerImages && item.photographerImages.length > 0) && (
                        <div className="bg-purple-50 p-2 rounded border-l-2 border-purple-400">
                          <h4 className="text-xs font-medium text-purple-900 mb-1">📸 Photography</h4>
                          <div className="text-xs">
                            <span className="font-medium text-purple-700">Images:</span>
                            <span className="text-purple-600 ml-1">{item.photographerImages.length}</span>
                          </div>
                          {item.photographerQuantity && (
                            <div className="text-xs">
                              <span className="font-medium text-purple-700">Quantity:</span>
                              <span className="text-purple-600 ml-1">{item.photographerQuantity}</span>
                            </div>
                          )}
                          {item.notes && (
                            <div className="mt-1">
                              <span className="font-medium text-purple-700">Notes:</span>
                              <p className="text-purple-600 text-xs line-clamp-2">{item.notes}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Current Research2 Data */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Category:</span> {item.category}
                        </div>
                        <div>
                          <span className="font-medium">Estimate:</span> {item.auctionSiteEstimate || 'N/A'}
                        </div>
                      </div>

                      {item.researcherEstimate && (
                        <div className="bg-orange-50 p-2 rounded border-l-2 border-orange-400">
                          <h4 className="text-xs font-medium text-orange-900 mb-1">🔬 Your Research 2</h4>
                          <div className="text-xs">
                            <span className="font-medium text-orange-700">Your Estimate:</span>
                            <span className="text-orange-600 ml-1">{item.researcherEstimate}</span>
                          </div>
                          {item.researcherDescription && (
                            <div className="mt-1">
                              <span className="font-medium text-orange-700">Your Notes:</span>
                              <p className="text-orange-600 text-xs line-clamp-2">{item.researcherDescription}</p>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => startEditing(item)}
                        >
                          <Edit3 className="mr-2 h-3 w-3" />
                          Edit Research 2
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(item.url, '_blank')}
                        >
                          <ExternalLink className="mr-2 h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* My Assigned Items Tab */}
          <TabsContent value="assigned" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-900">My Assigned Items</h2>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{myAssignedItems.length} items</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadItems}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {myAssignedItems.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Tag className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No assigned items</h3>
                  <p className="text-gray-600">
                    You haven't been assigned any items yet. Assign items to yourself from the research2 tab.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {myAssignedItems.map((item) => (
                  <Card key={item.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{item.itemName}</CardTitle>
                          <CardDescription>
                            {item.auctionName} - {item.lotNumber}
                          </CardDescription>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Badge className={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                          {item.priority && (
                            <Badge variant="outline" className={getPriorityColor(item.priority)}>
                              {item.priority}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {editingItem === item.id ? (
                        // Edit Form
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">Item Name</label>
                              <Input
                                value={editForm.itemName || ''}
                                onChange={(e) => setEditForm({...editForm, itemName: e.target.value})}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Category</label>
                              <Input
                                value={editForm.category || ''}
                                onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                                className="mt-1"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium">Description</label>
                            <Textarea
                              value={editForm.description || ''}
                              onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                              className="mt-1"
                              rows={3}
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium">Priority</label>
                            <Select
                              value={editForm.priority || 'medium'}
                              onValueChange={(value) => setEditForm({...editForm, priority: value as any})}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="text-sm font-medium">Research 2 Notes</label>
                            <Textarea
                              value={editForm.notes || ''}
                              onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                              className="mt-1"
                              rows={3}
                              placeholder="Add your secondary research notes, final recommendations..."
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button onClick={() => saveEdit(item.id)}>
                              <Save className="mr-2 h-4 w-4" />
                              Save Changes
                            </Button>
                            <Button variant="outline" onClick={cancelEdit}>
                              <X className="mr-2 h-4 w-4" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // Display Mode
                        <div className="space-y-3">
                          <p className="text-sm text-gray-600">{item.description}</p>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Category:</span> {item.category}
                            </div>
                            <div>
                              <span className="font-medium">Estimate:</span> {item.auctionSiteEstimate || 'N/A'}
                            </div>
                            <div>
                              <span className="font-medium">Created:</span> {item.createdAt ? formatDate(item.createdAt.toString()) : 'N/A'}
                            </div>
                            <div>
                              <span className="font-medium">Updated:</span> {item.updatedAt ? formatDate(item.updatedAt.toString()) : 'N/A'}
                            </div>
                          </div>

                          {item.researcherEstimate && (
                            <div>
                              <span className="text-sm font-medium text-green-700">Researcher Estimate: </span>
                              <span className="text-sm text-green-600">{item.researcherEstimate}</span>
                            </div>
                          )}

                          {item.photographerImages && item.photographerImages.length > 0 && (
                            <div>
                              <span className="text-sm font-medium text-purple-700">Photography Images: </span>
                              <span className="text-sm text-purple-600">{item.photographerImages.length}</span>
                            </div>
                          )}

                          {item.notes && (
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-gray-700">Notes:</p>
                              <p className="text-sm text-gray-600">{item.notes}</p>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => startEditing(item)}
                            >
                              <Edit3 className="mr-2 h-4 w-4" />
                              Edit Research 2
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(item.url, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteItem(item.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Move to Next Status Button */}
                      {item.status === 'research2' && (
                        <div className="pt-4 border-t">
                          <Button
                            className="w-full"
                            onClick={() => moveToNextStatus(item.id)}
                          >
                            <ArrowRight className="mr-2 h-4 w-4" />
                            Complete Research 2 & Finalize Item
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Completed Research 2 Tab */}
          <TabsContent value="completed" className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">Completed Research 2</h2>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.filter(item => item.status !== 'research2' && item.assignedTo === user?.id).map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{item.itemName}</CardTitle>
                        <CardDescription>
                          {item.auctionName} - {item.lotNumber}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {item.description}
                    </p>

                    {item.notes && (
                      <div className="text-sm">
                        <span className="font-medium text-orange-700">Final Notes: </span>
                        <span className="text-orange-600">{item.notes}</span>
                      </div>
                    )}

                    <div className="text-xs text-gray-500">
                      Completed: {item.updatedAt ? formatDate(item.updatedAt.toString()) : 'N/A'}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}