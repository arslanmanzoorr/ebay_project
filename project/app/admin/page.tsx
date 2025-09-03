'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ExternalLink, Image, Calendar, Tag, DollarSign, RefreshCw, Plus, ArrowRight, Users, FileText, Camera, Award, Trash2, X, Edit3 } from 'lucide-react';
import Navbar from '@/components/layout/navbar';
import { dataStore } from '@/services/dataStore';
import { AuctionItem, UserAccount } from '@/types/auction';

interface WebhookItem {
  id: string;
  url_main: string;
  item_name: string;
  lot_number: string;
  description: string;
  lead: string;
  category: string;
  estimate: string;
  auction_name: string;
  all_unique_image_urls: string[];
  main_image_url: string;
  gallery_image_urls: string[];
  broad_search_images: string[];
  tumbnail_images: string[];
  ai_response: string;
  received_at: string;
  status: string;
}

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [webhookItems, setWebhookItems] = useState<WebhookItem[]>([]);
  const [auctionItems, setAuctionItems] = useState<AuctionItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('webhook');
  
  // Image Gallery Modal State
  const [selectedItem, setSelectedItem] = useState<AuctionItem | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  
  // User Management Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [userListKey, setUserListKey] = useState(0); // Force re-render of user list
  const [users, setUsers] = useState<UserAccount[]>([]); // Local state for users
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'researcher' as 'admin' | 'researcher' | 'researcher2' | 'photographer',
    isActive: true
  });

  // Refresh user list
  const refreshUserList = async () => {
    try {
      const userList = await dataStore.getUsers();
      setUsers(userList);
      setUserListKey(prev => prev + 1); // Force re-render
    } catch (error) {
      console.error('Error refreshing user list:', error);
    }
  };

  // Check authentication
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    } else if (user && user.role !== 'admin') {
      router.push('/');
    }
  }, [user, isLoading, router]);

  // Initialize users state
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const userList = await dataStore.getUsers();
        setUsers(userList);
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };
    loadUsers();
  }, []);

  // Load data on component mount
  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchWebhookData();
      loadAuctionItems();
    }
  }, [user]);

  // Debug: Log webhook items when they change
  useEffect(() => {
    console.log('🔄 Webhook items state changed:', webhookItems);
    console.log('🔄 Webhook items length:', webhookItems.length);
  }, [webhookItems]);

  // Debug: Log auction items when they change
  useEffect(() => {
    console.log('🔄 Auction items state changed:', auctionItems);
    console.log('🔄 Auction items length:', auctionItems.length);
  }, [auctionItems]);

  const fetchWebhookData = async () => {
    try {
      setIsLoadingData(true);
      console.log('🔍 Fetching webhook data...');
      const response = await fetch('/api/webhook/receive');
      const data = await response.json();
      
      console.log('📡 Webhook API response:', data);
      
      if (data.status === 'success') {
        console.log('✅ Webhook data fetched successfully');
        console.log('📊 Items count:', data.items?.length || 0);
        console.log('📋 Items data:', data.items);
        setWebhookItems(data.items || []);
      } else {
        console.error('❌ Failed to fetch webhook data:', data.error);
      }
    } catch (error) {
      console.error('❌ Error fetching webhook data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadAuctionItems = async () => {
    console.log('🔍 Loading auction items...');
    const items = await dataStore.getItems();
    console.log('📊 Auction items loaded:', items);
    console.log('📊 Items count:', items.length);
    console.log('📋 Items data:', items);
    setAuctionItems(items);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsSubmitting(true);
    setMessage('');

    try {
      console.log('=== SUBMITTING URL TO N8N ===');
      console.log('URL:', url);
      
      // Send URL to n8n webhook and get immediate response
      const n8nWebhookUrl = 'https://sorcer.app.n8n.cloud/webhook/789023dc-a9bf-459c-8789-d9d0c993d1cb';
      
      console.log('Sending to n8n webhook:', n8nWebhookUrl);
      
      const response = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url_main: url }),
      });

      if (response.ok) {
        // n8n responds with processed data on the same webhook
        console.log('=== N8N RESPONSE RECEIVED ===');
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        try {
          // Get the response data from n8n
          const responseText = await response.text();
          console.log('N8N response text:', responseText);
          
          let responseData = null;
          if (responseText && responseText.trim()) {
            responseData = JSON.parse(responseText);
            console.log('N8N response data:', responseData);
          } else {
            console.log('N8N returned empty response');
          }
          
          if (responseData && Object.keys(responseData).length > 0) {
            // Store the processed data in our SQLite database
            console.log('=== STORING N8N DATA IN SQLITE ===');
            
            const storeResponse = await fetch('/api/webhook/receive', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(responseData),
            });

            if (storeResponse.ok) {
              const storeResult = await storeResponse.json();
              console.log('Data stored successfully:', storeResult);
              
              setMessage('✅ Data processed by n8n and stored successfully!');
              setUrl('');
              
              // Refresh the webhook data display
              setTimeout(() => {
                fetchWebhookData();
              }, 1000);
            } else {
              const errorText = await storeResponse.text();
              console.error('Failed to store data:', errorText);
              setMessage('❌ Data processed by n8n but failed to store. Please try again.');
            }
          } else {
            console.warn('n8n returned empty or invalid data');
            setMessage('❌ n8n processed the URL but returned no data. Please try again.');
          }
        } catch (parseError) {
          console.error('Failed to parse n8n response:', parseError);
          setMessage('❌ Received invalid response from n8n. Please try again.');
        }
      } else {
        const errorText = await response.text();
        console.error('n8n webhook failed. Status:', response.status);
        console.error('Error response:', errorText);
        setMessage(`❌ Failed to process URL with n8n (Status: ${response.status}). Please try again.`);
      }
    } catch (error) {
      console.error('Error processing URL:', error);
      setMessage('❌ Error processing URL. Please check the console for details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const importWebhookItem = async (webhookItem: WebhookItem) => {
    console.log('🔄 Importing webhook item:', webhookItem);
    const importedItem = await dataStore.importFromWebhook(webhookItem);
    console.log('📥 Import result:', importedItem);
    if (importedItem) {
      console.log('✅ Item imported successfully:', importedItem);
      setMessage(`✅ Item "${importedItem.itemName}" imported into auction workflow!`);
      loadAuctionItems();
    } else {
      console.error('❌ Failed to import item');
      setMessage('❌ Failed to import item into workflow.');
    }
  };

  const changeItemStatus = async (itemId: string, newStatus: AuctionItem['status']) => {
    const updatedItem = await dataStore.updateItem(itemId, { status: newStatus });
    if (updatedItem) {
      setMessage(`✅ Item status changed to ${newStatus}!`);
      loadAuctionItems();
    } else {
      setMessage('❌ Failed to change item status.');
    }
  };

  const deleteWebhookItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/webhook/receive/${itemId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setMessage('✅ Webhook item deleted successfully!');
        fetchWebhookData(); // Refresh the list
      } else {
        setMessage('❌ Failed to delete webhook item.');
      }
    } catch (error) {
      console.error('Error deleting webhook item:', error);
      setMessage('❌ Error deleting webhook item.');
    }
  };

  const deleteAuctionItem = async (itemId: string) => {
    const deleted = await dataStore.deleteItem(itemId);
    if (deleted) {
      setMessage('✅ Auction item deleted successfully!');
      loadAuctionItems(); // Refresh the list
    } else {
      setMessage('❌ Failed to delete auction item.');
    }
  };

  // Open image gallery modal
  const openImageGallery = (item: AuctionItem) => {
    setSelectedItem(item);
    setIsImageModalOpen(true);
  };

  // Close image gallery modal
  const closeImageGallery = () => {
    setSelectedItem(null);
    setIsImageModalOpen(false);
  };

  // Open user management modal
  const openUserManagement = () => {
    setIsUserModalOpen(true);
  };

  // Close user management modal
  const closeUserManagement = () => {
    setIsUserModalOpen(false);
  };

  // Open edit user modal
  const openEditUser = (user: UserAccount) => {
    setEditingUser(user);
    setIsEditUserModalOpen(true);
  };

  // Close edit user modal
  const closeEditUser = () => {
    setEditingUser(null);
    setIsEditUserModalOpen(false);
  };

  // Send finalized item data to external webhook
  const sendToExternalWebhook = async (item: AuctionItem) => {
    try {
      console.log('📤 Sending data to external webhook via API route:', item);
      console.log('📸 Photographer images to be sent:', item.photographerImages);

      const response = await fetch('/api/webhook/send-external', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemData: item }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Webhook sent successfully:', result);
        const imageCount = result.imagesSent ? 
          ` (${result.imagesSent.photographerImages} photographer images, ${result.imagesSent.originalImages} original images)` : '';
        setMessage(`✅ Item data sent to external webhook successfully!${imageCount}`);
      } else {
        const errorData = await response.json();
        console.error('❌ Webhook failed:', response.status, errorData);
        setMessage(`❌ Failed to send data to webhook: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error sending to webhook:', error);
      setMessage('❌ Error sending data to webhook. Please check the console.');
    }
  };

  // Delete user
  const deleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        console.log('🗑️ Attempting to delete user:', userId);
        console.log('🗑️ Current users before delete:', users.length);
        
        // Don't allow deleting the current admin user
        if (userId === user?.id) {
          alert('You cannot delete your own account.');
          return;
        }
        
        const result = await dataStore.deleteUser(userId);
        console.log('🗑️ Delete result:', result);
        
        if (result) {
          // Force a re-render
          await refreshUserList();
          console.log('🗑️ User deleted successfully');
          alert('User deleted successfully!');
        } else {
          alert('Failed to delete user. User not found.');
        }
      } catch (error) {
        console.error('❌ Error deleting user:', error);
        alert(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'research': return 'bg-blue-100 text-blue-800';

      case 'winning': return 'bg-green-100 text-green-800';
      case 'photography': return 'bg-purple-100 text-purple-800';
      case 'research2': return 'bg-orange-100 text-orange-800';
      case 'finalized': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'research': return <FileText className="h-4 w-4" />;

      case 'winning': return <Award className="h-4 w-4" />;
      case 'photography': return <Camera className="h-4 w-4" />;
      case 'research2': return <Users className="h-4 w-4" />;
      case 'finalized': return <Tag className="h-4 w-4" />;
      default: return <Tag className="h-4 w-4" />;
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

  // Show access denied if not admin
  if (user && user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don&apos;t have permission to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Bidsquire Admin Dashboard</h1>
          <p className="text-gray-600">Manage auction processing and workflow for bidsquire.com</p>
        </div>

        {/* URL Submission Form */}
        <Card>
          <CardHeader>
            <CardTitle>Submit HiBid URL</CardTitle>
            <CardDescription>
              Enter a HiBid URL. It will be processed by n8n and imported into the auction workflow.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex gap-3">
              <Input
                type="url"
                placeholder="https://hibid.com/lot/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
                required
              />
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Submit URL'
                )}
              </Button>
            </form>
            {message && (
              <p className={`mt-2 text-sm ${message.includes('❌') ? 'text-red-600' : message.includes('✅') ? 'text-green-600' : 'text-blue-600'}`}>
                {message}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="webhook">Webhook Data</TabsTrigger>
            <TabsTrigger value="workflow">Auction Workflow</TabsTrigger>
            <TabsTrigger value="finalized">Finalized Items</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>

          {/* Webhook Data Tab */}
          <TabsContent value="webhook" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-900">Webhook Data</h2>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{webhookItems.length} items</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchWebhookData}
                  disabled={isLoadingData}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoadingData ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>

            {isLoadingData ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading webhook data...</span>
              </div>
            ) : webhookItems.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Image className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No webhook data yet</h3>
                  <p className="text-gray-600">
                    Submit a HiBid URL above to see processed data here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {webhookItems.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    {item.main_image_url && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={item.main_image_url}
                          alt={item.item_name}
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
                          <CardTitle className="text-lg line-clamp-2">{item.item_name}</CardTitle>
                          <CardDescription className="line-clamp-1">
                            {item.auction_name}
                          </CardDescription>
                        </div>
                        <Badge variant="outline">{item.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Key Details */}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-1">
                          <Tag className="h-3 w-3 text-gray-500" />
                          <span className="text-gray-600">Lot {item.lot_number}</span>
                        </div>
                        {item.estimate && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3 text-gray-500" />
                            <span className="text-gray-600">{item.estimate}</span>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      {item.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      {/* AI Response */}
                      {item.ai_response && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-700">AI Analysis:</p>
                          <p className="text-sm text-gray-600 line-clamp-3">
                            {item.ai_response}
                          </p>
                        </div>
                      )}

                      {/* Image Counts */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {item.main_image_url && (
                          <span>Main Image ✓</span>
                        )}
                        {item.gallery_image_urls.length > 0 && (
                          <span>{item.gallery_image_urls.length} Gallery Images</span>
                        )}
                        {item.all_unique_image_urls.length > 0 && (
                          <span>{item.all_unique_image_urls.length} Total Images</span>
                        )}
                      </div>

                      {/* Timestamp */}
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Calendar className="h-3 w-3" />
                        <span>{item.received_at ? formatDate(item.received_at) : 'N/A'}</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => importWebhookItem(item)}
                        >
                          <Plus className="mr-2 h-3 w-3" />
                          Import to Workflow
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (item.url_main) {
                              window.open(item.url_main, '_blank');
                            } else {
                              alert('No URL available for this item');
                            }
                          }}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteWebhookItem(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Auction Workflow Tab */}
          <TabsContent value="workflow" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Auction Workflow</h2>
                <p className="text-sm text-gray-600 mt-1">Click on any item to view all images</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{auctionItems.length} items</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadAuctionItems}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {auctionItems.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No auction items yet</h3>
                  <p className="text-gray-600">
                    Import webhook data or create items manually to see them here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {auctionItems.map((item) => (
                  <Card key={item.id} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow" onClick={() => openImageGallery(item)}>
                    {/* Image Display */}
                    {(item.mainImageUrl || (item.images && item.images.length > 0) || (item.photographerImages && item.photographerImages.length > 0)) && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={item.mainImageUrl || (item.images && item.images.length > 0 ? item.images[0] : '') || (item.photographerImages && item.photographerImages.length > 0 ? item.photographerImages[0] : '')}
                          alt={item.itemName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg line-clamp-2">{item.itemName}</CardTitle>
                          <CardDescription className="line-clamp-1">
                            {item.auctionName} - {item.lotNumber}
                          </CardDescription>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Badge className={getStatusColor(item.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(item.status)}
                              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                            </div>
                          </Badge>
                          {item.priority && (
                            <Badge variant="outline" className={
                              item.priority === 'high' ? 'border-red-300 text-red-700' :
                              item.priority === 'medium' ? 'border-yellow-300 text-yellow-700' :
                              'border-green-300 text-green-700'
                            }>
                              {item.priority}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3 pt-0">
                      {/* Two Column Layout */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column: Item Information */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-900">Item Information</h4>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-700">SKU:</span>
                              <span className="text-gray-600">{item.sku || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-700">Category:</span>
                              <span className="text-gray-600">{item.category || 'Uncategorized'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-700">Lead:</span>
                              <span className="text-gray-600">{item.lead || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-700">Auction Site Estimate:</span>
                              <span className="text-gray-600">{item.auctionSiteEstimate || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-700">Researcher Estimate:</span>
                              <span className="text-gray-600">{item.researcherEstimate || 'N/A'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Right Column: Research Analysis */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-900">Research Analysis</h4>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-700">AI Estimate:</span>
                              <span className="text-gray-600">{item.aiEstimate || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-700">AI Description:</span>
                              <span className="text-gray-600 line-clamp-3">{item.aiDescription || 'N/A'}</span>
                            </div>
                            {item.referenceUrls && item.referenceUrls.length > 0 && (
                              <div>
                                <span className="font-medium text-gray-700">Reference URLs:</span>
                                <div className="mt-1 space-y-1">
                                  {item.referenceUrls.map((url, index) => (
                                    <a
                                      key={index}
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block text-blue-600 hover:text-blue-800 text-xs truncate"
                                    >
                                      {url}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2 pt-4 border-t">
                        {/* Status Change Dropdown */}
                        <Select
                          value={item.status}
                          onValueChange={(newStatus) => changeItemStatus(item.id, newStatus as AuctionItem['status'])}
                        >
                          <SelectTrigger className="w-full" onClick={(e) => e.stopPropagation()}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="research">Research</SelectItem>

                            <SelectItem value="winning">Winning</SelectItem>
                            <SelectItem value="photography">Photography</SelectItem>
                            <SelectItem value="research2">Research 2</SelectItem>
                            <SelectItem value="finalized">Finalized</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {/* Action Buttons Row */}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              const url = item.url || (item as any).url_main;
                              if (url) {
                                window.open(url, '_blank');
                              } else {
                                alert('No URL available for this item');
                              }
                            }}
                          >
                            <ExternalLink className="mr-2 h-3 w-3" />
                            View Original
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteAuctionItem(item.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Finalized Items Tab */}
          <TabsContent value="finalized" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Finalized Items</h2>
                <p className="text-sm text-gray-600 mt-1">Click on any item to view all images</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {auctionItems.filter(item => item.status === 'finalized').length} finalized items
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadAuctionItems}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {auctionItems.filter(item => item.status === 'finalized').length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Award className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No finalized items yet</h3>
                  <p className="text-gray-600">
                    Items will appear here once they reach the finalized status.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {auctionItems
                  .filter(item => item.status === 'finalized')
                  .map((item) => (
                  <Card key={item.id} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow" onClick={() => openImageGallery(item)}>
                    {(item.mainImageUrl || (item.images && item.images.length > 0) || (item.photographerImages && item.photographerImages.length > 0)) && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={item.mainImageUrl || (item.images && item.images.length > 0 ? item.images[0] : '') || (item.photographerImages && item.photographerImages.length > 0 ? item.photographerImages[0] : '')}
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
                        <Badge className="bg-green-100 text-green-800">
                          <Award className="mr-2 h-3 w-3" />
                          Finalized
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Two Column Layout */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column: Item Information */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-900">Item Information</h4>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-700">SKU:</span>
                              <span className="text-gray-600">{item.sku || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-700">Category:</span>
                              <span className="text-gray-600">{item.category || 'Uncategorized'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-700">Lead:</span>
                              <span className="text-gray-600">{item.lead || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-700">Auction Site Estimate:</span>
                              <span className="text-gray-600">{item.auctionSiteEstimate || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-700">Researcher Estimate:</span>
                              <span className="text-gray-600">{item.researcherEstimate || 'N/A'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Right Column: Research Analysis */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-900">Research Analysis</h4>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-700">AI Estimate:</span>
                              <span className="text-gray-600">{item.aiEstimate || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-700">AI Description:</span>
                              <span className="text-gray-600 line-clamp-3">{item.aiDescription || 'N/A'}</span>
                            </div>
                            {item.referenceUrls && item.referenceUrls.length > 0 && (
                              <div>
                                <span className="font-medium text-gray-700">Reference URLs:</span>
                                <div className="mt-1 space-y-1">
                                  {item.referenceUrls.map((url, index) => (
                                    <a
                                      key={index}
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block text-blue-600 hover:text-blue-800 text-xs truncate"
                                    >
                                      {url}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4 border-t">
                        {/* Status Change Dropdown */}
                        <Select
                          value={item.status}
                          onValueChange={(newStatus) => changeItemStatus(item.id, newStatus as AuctionItem['status'])}
                        >
                          <SelectTrigger className="w-48" onClick={(e) => e.stopPropagation()}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="research">Research</SelectItem>

                            <SelectItem value="winning">Winning</SelectItem>
                            <SelectItem value="photography">Photography</SelectItem>
                            <SelectItem value="research2">Research 2</SelectItem>
                            <SelectItem value="finalized">Finalized</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            const url = item.url || (item as any).url_main;
                            if (url) {
                              window.open(url, '_blank');
                            } else {
                              alert('No URL available for this item');
                            }
                          }}
                        >
                          <ExternalLink className="mr-2 h-3 w-3" />
                          View Original
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            sendToExternalWebhook(item);
                          }}
                        >
                          <RefreshCw className="mr-2 h-3 w-3" />
                          Send To Ebay
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAuctionItem(item.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">System Overview</h2>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                  <FileText className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{auctionItems.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Webhook Items</CardTitle>
                  <Image className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{webhookItems.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{users.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Production Status</CardTitle>
                  <Award className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    {(() => {
                      const status = dataStore.getProductionStatus();
                      return (
                        <div className="space-y-1">
                          <div className={`text-xs px-2 py-1 rounded-full ${status.isClean ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {status.isClean ? 'Clean' : 'Has Data'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {status.userCount} users, {status.itemCount} items
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {auctionItems.slice(0, 5).map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{item.itemName}</p>
                          <p className="text-xs text-gray-500">{item.status}</p>
                        </div>
                        <Badge className={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button className="w-full" onClick={() => setActiveTab('webhook')}>
                      <Plus className="mr-2 h-4 w-4" />
                      Process New URL
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => setActiveTab('workflow')}>
                      <FileText className="mr-2 h-4 w-4" />
                      View Workflow
                    </Button>
                    <Button variant="outline" className="w-full" onClick={openUserManagement}>
                      <Users className="mr-2 h-4 w-4" />
                      Manage Users
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Production Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600">
                      <p>Current Status: {(() => {
                        const status = dataStore.getProductionStatus();
                        return (
                          <span className={`font-medium ${status.isClean ? 'text-green-600' : 'text-yellow-600'}`}>
                            {status.isClean ? 'Production Ready' : 'Contains Data'}
                          </span>
                        );
                      })()}</p>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      className="w-full text-orange-600 hover:text-orange-700"
                      onClick={() => {
                        if (window.confirm('⚠️ This will clear ALL data except admin user. Are you sure you want to reset the system for production?')) {
                          dataStore.clearAllData();
                          window.location.reload();
                        }
                      }}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reset System for Production
                    </Button>
                    
                    <div className="text-xs text-gray-500 text-center">
                      This will remove all items, workflow data, and non-admin users
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Image Gallery Modal */}
      {isImageModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-gray-900">
                  {selectedItem.itemName} - Image Gallery
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={closeImageGallery}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Item Details */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Auction:</span>
                    <p className="text-gray-600">{selectedItem.auctionName || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <p className="text-gray-600">{selectedItem.status}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">SKU:</span>
                    <p className="text-gray-600">{selectedItem.sku || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Priority:</span>
                    <p className="text-gray-600">{selectedItem.priority || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Auction Site Estimate:</span>
                    <p className="text-gray-600">{selectedItem.auctionSiteEstimate || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">AI Estimate:</span>
                    <p className="text-gray-600">{selectedItem.aiEstimate || 'N/A'}</p>
                  </div>
                </div>

                {/* Original Webhook Data */}
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-medium text-gray-700 mb-2">📋 Original Webhook Data</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Category:</span>
                      <p className="text-gray-500">{selectedItem.category || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Lot Number:</span>
                      <p className="text-gray-500">{selectedItem.lotNumber || 'N/A'}</p>
                    </div>
                  </div>
                  {selectedItem.aiDescription && (
                    <div className="mt-2">
                      <span className="font-medium text-gray-600">AI Analysis:</span>
                      <p className="text-gray-500 text-sm mt-1">{selectedItem.aiDescription}</p>
                    </div>
                  )}
                </div>

                {/* Research Data */}
                {selectedItem.researcherEstimate && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-medium text-gray-700 mb-2">🔍 Research Stage</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Researcher Estimate:</span>
                        <p className="text-gray-500">{selectedItem.researcherEstimate}</p>
                      </div>
                    </div>
                    {selectedItem.researcherDescription && (
                      <div className="mt-2">
                        <span className="font-medium text-gray-600">Research Notes:</span>
                        <p className="text-gray-500 text-sm mt-1">{selectedItem.researcherDescription}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Photography Data */}
                {(selectedItem.photographerImages && selectedItem.photographerImages.length > 0) && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-medium text-gray-700 mb-2">📸 Photography Stage</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Images Taken:</span>
                        <p className="text-gray-500">{selectedItem.photographerImages.length}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Quantity:</span>
                        <p className="text-gray-500">{selectedItem.photographerQuantity || 'N/A'}</p>
                      </div>
                    </div>
                    {selectedItem.notes && (
                      <div className="mt-2">
                        <span className="font-medium text-gray-600">Photographer Notes:</span>
                        <p className="text-gray-500 text-sm mt-1">{selectedItem.notes}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Lead/Notes */}
                {selectedItem.lead && (
                  <div className="mt-4 pt-4 border-t">
                    <span className="font-medium text-gray-700">Lead/Notes:</span>
                    <p className="text-gray-600 mt-1">{selectedItem.lead}</p>
                  </div>
                )}
              </div>

              {/* Image Gallery */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">All Images ({(selectedItem.images?.length || 0) + (selectedItem.photographerImages?.length || 0)})</h3>
                
                {selectedItem.mainImageUrl && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Main Image</h4>
                    <div className="aspect-video overflow-hidden rounded-lg">
                      <img
                        src={selectedItem.mainImageUrl}
                        alt={`${selectedItem.itemName} - Main Image`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}

                {selectedItem.images && selectedItem.images.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Original Images</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedItem.images.map((imageUrl, index) => (
                        <div key={index} className="aspect-video overflow-hidden rounded-lg">
                          <img
                            src={imageUrl}
                            alt={`${selectedItem.itemName} - Image ${index + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                            onClick={() => window.open(imageUrl, '_blank')}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedItem.photographerImages && selectedItem.photographerImages.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">📸 Photography Images</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedItem.photographerImages.map((imageUrl, index) => (
                        <div key={`photo-${index}`} className="aspect-video overflow-hidden rounded-lg">
                          <img
                            src={imageUrl}
                            alt={`${selectedItem.itemName} - Photography ${index + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                            onClick={() => window.open(imageUrl, '_blank')}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(!selectedItem.mainImageUrl && (!selectedItem.images || selectedItem.images.length === 0) && (!selectedItem.photographerImages || selectedItem.photographerImages.length === 0)) && (
                  <div className="text-center py-8 text-gray-500">
                    <Image className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p>No images available for this item</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    const url = selectedItem.url || (selectedItem as any).url_main;
                    if (url) {
                      window.open(url, '_blank');
                    } else {
                      alert('No URL available for this item');
                    }
                  }}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Original
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    closeImageGallery();
                    // You can add navigation to edit the item here
                  }}
                >
                  <Edit3 className="mr-2 h-4 w-4" />
                  Edit Item
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Management Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">User Management</h2>
                                  <div className="flex items-center gap-2">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      dataStore.getProductionStatus().isClean 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {dataStore.getProductionStatus().isClean ? 'Production Ready' : 'Contains Data'}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (window.confirm('⚠️ WARNING: This will reset the entire system!\n\n• All users will be deleted\n• All auction items will be cleared\n• All workflow data will be removed\n• Only admin user will remain\n\nAre you sure you want to continue?')) {
                          try {
                            const response = await fetch('/api/system/reset', { method: 'POST' });
                            if (response.ok) {
                              alert('✅ System reset complete! All data cleared.');
                              window.location.reload();
                            } else {
                              alert('❌ Failed to reset system. Please try again.');
                            }
                          } catch (error) {
                            console.error('Reset error:', error);
                            alert('❌ Error resetting system. Please check console.');
                          }
                        }
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <RefreshCw className="mr-2 h-3 w-3" />
                      Reset System
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={closeUserManagement}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
              </div>

              {/* User List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">All Users ({users.length})</h3>
                  <Button size="sm" onClick={() => setIsAddUserModalOpen(true)}>
                    <Plus className="mr-2 h-3 w-3" />
                    Add User
                  </Button>
                </div>

                <div className="space-y-3" key={userListKey}>
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={
                          user.role === 'admin' ? 'bg-red-100 text-red-800' :
                          user.role === 'researcher' ? 'bg-blue-100 text-blue-800' :
                          user.role === 'researcher2' ? 'bg-orange-100 text-orange-800' :
                          'bg-purple-100 text-purple-800'
                        }>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                        <Badge variant={user.isActive ? "default" : "secondary"}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditUser(user)}>
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => deleteUser(user.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {users.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p>No users found</p>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium text-gray-900 mb-3">User Statistics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{users.filter(u => u.role === 'admin').length}</div>
                    <div className="text-sm text-gray-500">Admins</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{users.filter(u => u.role === 'researcher').length}</div>
                    <div className="text-sm text-gray-500">Researchers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{users.filter(u => u.role === 'researcher2').length}</div>
                    <div className="text-sm text-gray-500">Research 2</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{users.filter(u => u.role === 'photographer').length}</div>
                    <div className="text-sm text-gray-500">Photographers</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Add New User</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddUserModalOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await dataStore.addUser(newUserForm);
                  setIsAddUserModalOpen(false);
                  setNewUserForm({
                    name: '',
                    email: '',
                    password: '',
                    role: 'researcher' as 'admin' | 'researcher' | 'researcher2' | 'photographer',
                    isActive: true
                  });
                  // Force a re-render by updating state
                  await refreshUserList();
                } catch (error) {
                  console.error('Error adding user:', error);
                  alert('Failed to add user. Please try again.');
                }
              }} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                  <Input
                    id="name"
                    type="text"
                    value={newUserForm.name}
                    onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                  <Input
                    id="email"
                    type="email"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                  <Input
                    id="password"
                    type="password"
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
                  <Select
                    value={newUserForm.role}
                    onValueChange={(value) => setNewUserForm({ ...newUserForm, role: value as 'admin' | 'researcher' | 'researcher2' | 'photographer' })}
                  >
                    <SelectTrigger id="role" className="w-full">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="researcher">Researcher</SelectItem>
                      <SelectItem value="researcher2">Research 2</SelectItem>
                      <SelectItem value="photographer">Photographer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={newUserForm.isActive}
                    onChange={(e) => setNewUserForm({ ...newUserForm, isActive: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                    Is Active
                  </label>
                </div>
                <Button type="submit" className="w-full">
                  Add User
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditUserModalOpen && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Edit User</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={closeEditUser}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await dataStore.updateUser(editingUser.id, editingUser);
                  setIsEditUserModalOpen(false);
                  await refreshUserList();
                  alert('User updated successfully!');
                } catch (error) {
                  console.error('Error updating user:', error);
                  alert('Failed to update user. Please try again.');
                }
              }} className="space-y-4">
                <div>
                  <label htmlFor="editName" className="block text-sm font-medium text-gray-700">Name</label>
                  <Input
                    id="editName"
                    type="text"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="editEmail" className="block text-sm font-medium text-gray-700">Email</label>
                  <Input
                    id="editEmail"
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="editRole" className="block text-sm font-medium text-gray-700">Role</label>
                  <Select
                    value={editingUser.role}
                    onValueChange={(value) => setEditingUser({ ...editingUser, role: value as 'admin' | 'researcher' | 'researcher2' | 'photographer' })}
                  >
                    <SelectTrigger id="editRole" className="w-full">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="researcher">Researcher</SelectItem>
                      <SelectItem value="researcher2">Research 2</SelectItem>
                      <SelectItem value="photographer">Photographer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="editIsActive"
                    checked={editingUser.isActive}
                    onChange={(e) => setEditingUser({ ...editingUser, isActive: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="editIsActive" className="ml-2 text-sm text-gray-700">
                    Is Active
                  </label>
                </div>
                <Button type="submit" className="w-full">
                  Save Changes
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}