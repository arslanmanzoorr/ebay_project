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
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ExternalLink, Image, Calendar, Tag, DollarSign, RefreshCw, Plus, ArrowRight, Users, FileText, Camera, Award, Trash2, X, Edit3, CheckCircle, Save } from 'lucide-react';
import Navbar from '@/components/layout/navbar';
import { dataStore } from '@/services/dataStore';
import { AuctionItem, UserAccount } from '@/types/auction';


export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [auctionItems, setAuctionItems] = useState<AuctionItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('workflow');
  
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
  const [isEditFinalizedModalOpen, setIsEditFinalizedModalOpen] = useState(false);
  const [editingFinalizedItem, setEditingFinalizedItem] = useState<AuctionItem | null>(null);
  const [finalizedEditForm, setFinalizedEditForm] = useState<Partial<AuctionItem>>({});
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'photographer' as 'photographer', // Only photographers allowed
    isActive: true,
    updatedAt: new Date()
  });
  
  // Credit management state
  const [creditBalance, setCreditBalance] = useState<{ currentCredits: number; totalPurchased: number; isLowBalance: boolean } | null>(null);

  // Manual Item Creation Modal State
  const [isManualItemModalOpen, setIsManualItemModalOpen] = useState(false);
  const [manualItemForm, setManualItemForm] = useState({
    itemName: '',
    description: '',
    category: '',
    auctionName: '',
    lotNumber: '',
    auctionSiteEstimate: '',
    url: '',
    urlMain: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    assignedTo: 'photographer' as 'admin' | 'researcher' | 'researcher2' | 'photographer'
  });

  // eBay Draft Modal State
  const [isEbayDraftModalOpen, setIsEbayDraftModalOpen] = useState(false);
  const [selectedItemForDraft, setSelectedItemForDraft] = useState<AuctionItem | null>(null);
  const [ebayDraft, setEbayDraft] = useState({
    title: '',
    description: '',
    condition: 'Used',
    listingType: 'auction' as 'auction' | 'fixed',
    startingPrice: '',
    fixedPrice: '',
    categoryId: '',
    categoryId2: '',
    categoryId3: ''
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

  // Reusable function to refresh credit balance
  const refreshCreditBalance = async () => {
    if (user?.id) {
      try {
        const response = await fetch(`/api/credits/balance?userId=${user.id}`);
        const data = await response.json();
        if (data.success) {
          setCreditBalance(data.credits);
        }
      } catch (error) {
        console.error('Error refreshing credit balance:', error);
      }
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

  // Initialize users state and load credits
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load only photographers created by this admin
        const response = await fetch(`/api/users/photographers?adminId=${user?.id}`);
        const data = await response.json();
        if (data.success) {
          setUsers(data.photographers);
        }
        
        // Load credit balance
        if (user?.id) {
          const creditResponse = await fetch(`/api/credits/balance?userId=${user.id}`);
          const creditData = await creditResponse.json();
          if (creditData.success) {
            setCreditBalance(creditData.credits);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    if (user?.id) {
      loadData();
    }
  }, [user]);

  // Load data on component mount
  useEffect(() => {
    if (user && user.role === 'admin') {
      loadAuctionItems();
    }
  }, [user]);

  // Debug: Log auction items when they change
  useEffect(() => {
    console.log('🔄 Auction items state changed:', auctionItems);
    console.log('🔄 Auction items length:', auctionItems.length);
  }, [auctionItems]);


  const loadAuctionItems = async () => {
    console.log('🔍 Loading auction items...');
    const items = await dataStore.getItems(user?.id, user?.role);
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
      // Send URL to internal proxy API which forwards to n8n
      const proxyUrl = '/api/webhook/send-url';
      console.log('Sending to n8n via proxy:', proxyUrl);
      
      const response = await fetch(proxyUrl, {
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
          // Get the response data from the proxy (which forwards n8n response)
          const responseText = await response.text();
          console.log('Proxy response text:', responseText);
          
          let proxyResult: any = null;
          if (responseText && responseText.trim()) {
            try {
              proxyResult = JSON.parse(responseText);
            } catch (jsonError) {
              console.warn('Proxy response was not JSON, returning raw text');
              proxyResult = { data: responseText };
            }
          }
          
          const responseData = proxyResult?.data;
          if (!responseData || (typeof responseData === 'object' && Object.keys(responseData).length === 0)) {
            console.warn('Proxy returned empty data payload');
            setMessage('? n8n processed the URL but returned no data. Please try again.');
            return;
          }
          
          if (responseData && Object.keys(responseData).length > 0) {
            // Store the processed data in our PostgreSQL database
            console.log('=== STORING N8N DATA IN POSTGRESQL ===');
            
            const storeResponse = await fetch('/api/webhook/receive', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ...(typeof responseData === 'object' && responseData !== null ? responseData : {}),
                adminId: user?.id // Include admin ID for item allotment
              }),
            });

            if (storeResponse.ok) {
              const storeResult = await storeResponse.json();
              console.log('Data stored successfully:', storeResult);
              
              setMessage('✅ Data processed by n8n and stored successfully!');
              setUrl('');
              
              // Refresh the auction items display and credit balance
              setTimeout(async () => {
                await loadAuctionItems();
                await refreshCreditBalance();
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

  const handleManualItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/auction-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...manualItemForm,
          status: 'photography', // Start at photographer stage
          assignedTo: 'photographer',
          images: [],
          photographerImages: [],
          mainImageUrl: null,
          researcherEstimate: null,
          researcherDescription: null,
          referenceUrls: [],
          similarUrls: [],
          photographerQuantity: 1,
          isMultipleItems: false,
          multipleItemsCount: 1,
          finalData: null,
          notes: '',
          tags: [],
          parentItemId: null,
          subItemNumber: null,
          adminId: user?.id, // Add admin ID for item allotment
          photographerNotes: ''
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        setMessage('✅ Manual item created successfully! Item has been assigned to photographer.');
        // Reset form
        setManualItemForm({
          itemName: '',
          description: '',
          category: '',
          auctionName: '',
          lotNumber: '',
          auctionSiteEstimate: '',
          url: '',
          urlMain: '',
          priority: 'medium',
          assignedTo: 'photographer'
        });
        setIsManualItemModalOpen(false);
        // Refresh the auction items list
        await loadAuctionItems();
      } else {
        setMessage(`❌ Error: ${result.error || 'Failed to create manual item'}`);
      }
    } catch (error) {
      console.error('Error creating manual item:', error);
      setMessage('❌ Error creating manual item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const changeItemStatus = async (itemId: string, newStatus: AuctionItem['status']) => {
    console.log('🔄 changeItemStatus called:', { itemId, newStatus });
    try {
      const item = dataStore.getItem(itemId);
      console.log('📋 Current item:', item);
      if (!item) {
        setMessage('❌ Item not found.');
        return;
      }

      // Check if this is a valid next stage transition
      const validTransitions: { [key: string]: string } = {
        'research': 'winning',
        'winning': 'photography', 
        'photography': 'research2',
        'research2': 'finalized'
      };

      console.log('🔍 Checking transition:', { 
        currentStatus: item.status, 
        newStatus, 
        isValidTransition: validTransitions[item.status] === newStatus 
      });

      if (validTransitions[item.status] === newStatus) {
        console.log('✅ Using moveItemToNextStatus for valid transition');
        // Use moveItemToNextStatus for valid transitions (with auto-assignment)
        const success = await dataStore.moveItemToNextStatus(itemId, user?.id || 'admin', user?.name || 'Admin');
        if (success) {
          setMessage(`✅ Item moved to next stage with auto-assignment!`);
          loadAuctionItems();
        } else {
          setMessage('❌ Failed to move item to next stage.');
        }
      } else {
        console.log('🔄 Using direct update for status change');
        // For other status changes, check if we need auto-assignment
        let updateData: Partial<AuctionItem> = { status: newStatus };
        
        // Auto-assign photographer role when admin sets status to photography
        if (newStatus === 'photography') {
          updateData.assignedTo = 'photographer';
          console.log('🎯 Admin setting status to photography - auto-assigning to photographer role');
        }
        // Auto-assign researcher2 role when admin sets status to research2
        else if (newStatus === 'research2') {
          updateData.assignedTo = 'researcher2';
          console.log('🎯 Admin setting status to research2 - auto-assigning to researcher2 role');
        }
        // Auto-assign researcher role when admin sets status to research
        else if (newStatus === 'research') {
          updateData.assignedTo = 'researcher';
          console.log('🎯 Admin setting status to research - auto-assigning to researcher role');
        }
        
        console.log('📤 Update data being sent:', updateData);
        const updatedItem = await dataStore.updateItem(itemId, updateData);
        console.log('📥 Update result:', updatedItem);
        
    if (updatedItem) {
          const assignmentNote = updateData.assignedTo ? ` and auto-assigned to ${updateData.assignedTo} role` : '';
          setMessage(`✅ Item status changed to ${newStatus}${assignmentNote}!`);
      loadAuctionItems();
    } else {
      setMessage('❌ Failed to change item status.');
        }
      }
    } catch (error) {
      console.error('❌ Error changing item status:', error);
      setMessage('❌ Error changing item status.');
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

  const openEditFinalized = (item: AuctionItem) => {
    setEditingFinalizedItem(item);
    setFinalizedEditForm({
      itemName: item.itemName,
      description: item.description,
      category: item.category,
      researcherEstimate: item.researcherEstimate,
      researcherDescription: item.researcherDescription,
      notes: item.notes,
      priority: item.priority,
      finalData: item.finalData
    });
    setIsEditFinalizedModalOpen(true);
  };

  const closeEditFinalized = () => {
    setEditingFinalizedItem(null);
    setFinalizedEditForm({});
    setIsEditFinalizedModalOpen(false);
  };

  const saveFinalizedEdit = async () => {
    if (!editingFinalizedItem) return;
    
    try {
      await dataStore.updateItem(editingFinalizedItem.id, finalizedEditForm);
      await loadAuctionItems();
      closeEditFinalized();
      alert('Finalized item updated successfully!');
    } catch (error) {
      console.error('Error updating finalized item:', error);
      alert('Error updating finalized item. Please try again.');
    }
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

  // eBay Draft Functions
  const createEbayDraft = (item: AuctionItem) => {
    setSelectedItemForDraft(item);
    setEbayDraft({
      title: item.itemName || '',
      description: item.description || item.researcherDescription || '',
      condition: 'Used',
      listingType: 'auction',
      startingPrice: item.researcherEstimate || '',
      fixedPrice: '',
      categoryId: '',
      categoryId2: '',
      categoryId3: ''
    });
    setIsEbayDraftModalOpen(true);
  };

  const submitEbayDraft = async () => {
    if (!selectedItemForDraft) return;
    
    try {
      // Create the eBay listing draft
      const draftData = {
        itemId: selectedItemForDraft.id,
        title: ebayDraft.title,
        description: ebayDraft.description,
        condition: ebayDraft.condition,
        listingType: ebayDraft.listingType,
        startingPrice: ebayDraft.listingType === 'auction' ? ebayDraft.startingPrice : '',
        fixedPrice: ebayDraft.listingType === 'fixed' ? ebayDraft.fixedPrice : '',
        categoryId: ebayDraft.categoryId,
        categoryId2: ebayDraft.categoryId2,
        categoryId3: ebayDraft.categoryId3,
        images: selectedItemForDraft.photographerImages || selectedItemForDraft.images || [],
        notes: `eBay listing draft created by ${user?.name} on ${new Date().toLocaleDateString()}`
      };

      await dataStore.updateItem(selectedItemForDraft.id, { 
        finalData: draftData,
        notes: `eBay listing draft created by ${user?.name} on ${new Date().toLocaleDateString()}`
      });
      
      alert('eBay listing draft created successfully!');
      setIsEbayDraftModalOpen(false);
      await loadAuctionItems();
    } catch (error) {
      console.error('Error creating eBay draft:', error);
      alert('Error creating eBay draft. Please try again.');
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

        {/* Credit Balance Display */}
        {creditBalance && (
          <Card className={`${creditBalance.isLowBalance ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${creditBalance.isLowBalance ? 'bg-red-100' : 'bg-green-100'}`}>
                    <DollarSign className={`h-5 w-5 ${creditBalance.isLowBalance ? 'text-red-600' : 'text-green-600'}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Credit Balance</p>
                    <p className="text-sm text-gray-600">
                      {creditBalance.currentCredits} credits remaining
                      {creditBalance.isLowBalance && (
                        <span className="ml-2 text-red-600 font-medium">⚠️ Low Balance</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total Purchased</p>
                  <p className="font-semibold text-gray-900">{creditBalance.totalPurchased}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
            <div className="mt-4 flex justify-center">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsManualItemModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Manual Item
              </Button>
            </div>
            {message && (
              <p className={`mt-2 text-sm ${message.includes('❌') ? 'text-red-600' : message.includes('✅') ? 'text-green-600' : 'text-blue-600'}`}>
                {message}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="workflow">Auction Workflow</TabsTrigger>
            <TabsTrigger value="finalized">Finalized Items</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>


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
              <div className="space-y-8">
                {/* High Priority Items */}
                {auctionItems.filter(item => item.priority === 'high').length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-xl font-semibold text-red-700">🔥 High Priority Items</h3>
                      <Badge variant="destructive" className="text-sm">
                        {auctionItems.filter(item => item.priority === 'high').length} urgent
                      </Badge>
                    </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {auctionItems.filter(item => item.priority === 'high').map((item) => (
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

                      {/* Notes Section */}
                      {(item.notes || item.photographerNotes || item.researcherNotes || item.researcher2Notes) && (
                        <div className="space-y-3 pt-4 border-t">
                          <h4 className="font-semibold text-gray-900">Notes from Team</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {item.photographerNotes && (
                              <div className="p-3 bg-blue-50 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <Camera className="h-4 w-4 text-blue-600" />
                                  <span className="font-medium text-blue-900">Photographer Notes</span>
                                </div>
                                <p className="text-sm text-blue-800">{item.photographerNotes}</p>
                              </div>
                            )}
                            {item.researcherNotes && (
                              <div className="p-3 bg-green-50 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <Tag className="h-4 w-4 text-green-600" />
                                  <span className="font-medium text-green-900">Researcher Notes</span>
                                </div>
                                <p className="text-sm text-green-800">{item.researcherNotes}</p>
                              </div>
                            )}
                            {item.researcher2Notes && (
                              <div className="p-3 bg-purple-50 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <Tag className="h-4 w-4 text-purple-600" />
                                  <span className="font-medium text-purple-900">Researcher 2 Notes</span>
                                </div>
                                <p className="text-sm text-purple-800">{item.researcher2Notes}</p>
                              </div>
                            )}
                            {item.notes && (
                              <div className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <Edit3 className="h-4 w-4 text-gray-600" />
                                  <span className="font-medium text-gray-900">General Notes</span>
                                </div>
                                <p className="text-sm text-gray-700">{item.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

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
                            <SelectItem value="admin_review">Admin Review</SelectItem>
                                  <SelectItem value="finalized">Finalized</SelectItem>
                                </SelectContent>
                              </Select>
                              
                              {/* Action Buttons Row */}
                              <div className="flex gap-2">
                                {item.status === 'admin_review' ? (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="flex-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      createEbayDraft(item);
                                    }}
                                  >
                                    <FileText className="mr-2 h-3 w-3" />
                                    Create eBay Draft
                                  </Button>
                                ) : (
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
                                )}
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
                  </div>
                )}

                {/* Medium Priority Items */}
                {auctionItems.filter(item => item.priority === 'medium' || !item.priority).length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-xl font-semibold text-yellow-700">⚡ Medium Priority Items</h3>
                      <Badge variant="secondary" className="text-sm">
                        {auctionItems.filter(item => item.priority === 'medium' || !item.priority).length} items
                      </Badge>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {auctionItems.filter(item => item.priority === 'medium' || !item.priority).map((item) => (
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
                            <SelectItem value="admin_review">Admin Review</SelectItem>
                            <SelectItem value="finalized">Finalized</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {/* Action Buttons Row */}
                        <div className="flex gap-2">
                          {item.status === 'admin_review' ? (
                            <Button
                              variant="default"
                              size="sm"
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                createEbayDraft(item);
                              }}
                            >
                              <FileText className="mr-2 h-3 w-3" />
                              Create eBay Draft
                            </Button>
                          ) : (
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
                          )}
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
                  </div>
                )}

                {/* Low Priority Items */}
                {auctionItems.filter(item => item.priority === 'low').length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-xl font-semibold text-green-700">📋 Low Priority Items</h3>
                      <Badge variant="outline" className="text-sm">
                        {auctionItems.filter(item => item.priority === 'low').length} items
                      </Badge>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {auctionItems.filter(item => item.priority === 'low').map((item) => (
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
                            <SelectItem value="admin_review">Admin Review</SelectItem>
                                  <SelectItem value="finalized">Finalized</SelectItem>
                                </SelectContent>
                              </Select>
                              
                              {/* Action Buttons Row */}
                              <div className="flex gap-2">
                                {item.status === 'admin_review' ? (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="flex-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      createEbayDraft(item);
                                    }}
                                  >
                                    <FileText className="mr-2 h-3 w-3" />
                                    Create eBay Draft
                                  </Button>
                                ) : (
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
                                )}
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
                  </div>
                )}
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
                  <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    {(item.mainImageUrl || (item.images && item.images.length > 0) || (item.photographerImages && item.photographerImages.length > 0)) && (
                      <div className="aspect-video overflow-hidden cursor-pointer" onClick={() => openImageGallery(item)}>
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
                        <div className="flex flex-col gap-2">
                        <Badge className="bg-green-100 text-green-800">
                          <Award className="mr-2 h-3 w-3" />
                          Finalized
                        </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditFinalized(item);
                            }}
                          >
                            <Edit3 className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        </div>
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
                            <SelectItem value="admin_review">Admin Review</SelectItem>
                            <SelectItem value="finalized">Finalized</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {item.status === 'admin_review' ? (
                          <Button
                            variant="default"
                            size="sm"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              createEbayDraft(item);
                            }}
                          >
                            <FileText className="mr-2 h-3 w-3" />
                            Create eBay Draft
                          </Button>
                        ) : (
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
                        )}
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
                    <Button className="w-full" onClick={() => setActiveTab('workflow')}>
                      <FileText className="mr-2 h-4 w-4" />
                      View Auction Workflow
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => setActiveTab('finalized')}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      View Finalized Items
                    </Button>
                    <Button variant="outline" className="w-full" onClick={openUserManagement}>
                      <Users className="mr-2 h-4 w-4" />
                      Manage Users
                    </Button>
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
                {(selectedItem.researcherEstimate || selectedItem.researcherDescription) && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-medium text-gray-700 mb-2">🔍 Research 1 Stage</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Researcher Estimate:</span>
                        <p className="text-gray-500">{selectedItem.researcherEstimate || 'N/A'}</p>
                      </div>
                    </div>
                    {selectedItem.researcherDescription && (
                      <div className="mt-2">
                        <span className="font-medium text-gray-600">Research 1 Notes:</span>
                        <p className="text-gray-500 text-sm mt-1">{selectedItem.researcherDescription}</p>
                      </div>
                    )}
                    {selectedItem.notes && selectedItem.status === 'research' && (
                      <div className="mt-2">
                        <span className="font-medium text-gray-600">Additional Research Notes:</span>
                        <p className="text-gray-500 text-sm mt-1">{selectedItem.notes}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Research 2 Data */}
                {selectedItem.status === 'research2' && selectedItem.notes && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-medium text-gray-700 mb-2">🔍 Research 2 Stage</h4>
                    <div className="mt-2">
                      <span className="font-medium text-gray-600">Research 2 Notes:</span>
                      <p className="text-gray-500 text-sm mt-1">{selectedItem.notes}</p>
                    </div>
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
                    {selectedItem.isMultipleItems && (
                      <div className="mt-2 p-2 bg-purple-50 rounded border-l-2 border-purple-400">
                        <div className="text-sm">
                          <span className="font-medium text-purple-700">📦 Multiple Items:</span>
                          <span className="text-purple-600 ml-1">{selectedItem.multipleItemsCount || 1} pieces in this lot</span>
                        </div>
                      </div>
                    )}
                    {selectedItem.notes && selectedItem.status === 'photography' && (
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
                {selectedItem.status === 'admin_review' ? (
                  <Button
                    variant="default"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      createEbayDraft(selectedItem);
                    }}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Create eBay Draft
                  </Button>
                ) : (
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
                )}
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
                  <h3 className="text-lg font-medium text-gray-900">Photographers ({users.length})</h3>
                  <Button size="sm" onClick={() => setIsAddUserModalOpen(true)}>
                    <Plus className="mr-2 h-3 w-3" />
                    Add Photographer
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
                <h4 className="font-medium text-gray-900 mb-3">Photographer Statistics</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{users.filter(u => u.role === 'photographer').length}</div>
                    <div className="text-sm text-gray-500">Photographers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{users.filter(u => u.isActive).length}</div>
                    <div className="text-sm text-gray-500">Active</div>
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
                <h2 className="text-2xl font-semibold text-gray-900">Add New Photographer</h2>
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
                    setMessage('Photographer created successfully!');
                    setNewUserForm({
                      name: '',
                      email: '',
                      password: '',
                      role: 'photographer',
                      isActive: true,
                      updatedAt: new Date()
                    });
                    setIsAddUserModalOpen(false);
                    // Reload photographers
                    const photographerResponse = await fetch(`/api/users/photographers?adminId=${user?.id}`);
                    const photographerData = await photographerResponse.json();
                    if (photographerData.success) {
                      setUsers(photographerData.photographers);
                    }
                  } else {
                    setError(result.error || 'Failed to create photographer');
                  }
                } catch (error) {
                  setError('An error occurred while creating photographer');
                } finally {
                  setIsLoadingData(false);
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
                    onValueChange={(value) => setNewUserForm({ ...newUserForm, role: value as 'photographer' })}
                  >
                    <SelectTrigger id="role" className="w-full">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
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
                <Button type="submit" className="w-full" disabled={isLoadingData}>
                  {isLoadingData ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Add Photographer'
                  )}
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

      {/* Edit Finalized Item Modal */}
      {isEditFinalizedModalOpen && editingFinalizedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Finalized Item</h3>
              <Button variant="outline" size="sm" onClick={closeEditFinalized}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Item Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Item: {editingFinalizedItem.itemName}</h4>
                <p className="text-sm text-gray-600">{editingFinalizedItem.auctionName} - Lot {editingFinalizedItem.lotNumber}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700">Basic Information</h4>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Item Name</label>
                    <Input
                      value={finalizedEditForm.itemName || ''}
                      onChange={(e) => setFinalizedEditForm(prev => ({ ...prev, itemName: e.target.value }))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <Input
                      value={finalizedEditForm.category || ''}
                      onChange={(e) => setFinalizedEditForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <Textarea
                      value={finalizedEditForm.description || ''}
                      onChange={(e) => setFinalizedEditForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Research Information */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700">Research Information</h4>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Researcher Estimate</label>
                    <Input
                      value={finalizedEditForm.researcherEstimate || ''}
                      onChange={(e) => setFinalizedEditForm(prev => ({ ...prev, researcherEstimate: e.target.value }))}
                      placeholder="$100 - $200"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Researcher Description</label>
                    <Textarea
                      value={finalizedEditForm.researcherDescription || ''}
                      onChange={(e) => setFinalizedEditForm(prev => ({ ...prev, researcherDescription: e.target.value }))}
                      rows={3}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Priority</label>
                    <Select
                      value={finalizedEditForm.priority || 'medium'}
                      onValueChange={(value) => setFinalizedEditForm(prev => ({ ...prev, priority: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-1">Admin Notes</label>
                <Textarea
                  value={finalizedEditForm.notes || ''}
                  onChange={(e) => setFinalizedEditForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={4}
                  placeholder="Add admin notes about final decisions..."
                  className="w-full"
                />
              </div>

              {/* Final Data (eBay Listing) */}
              {finalizedEditForm.finalData && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">eBay Listing Data</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                      {JSON.stringify(finalizedEditForm.finalData, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={saveFinalizedEdit} className="flex-1">
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={closeEditFinalized} className="flex-1">
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Item Creation Modal */}
      {isManualItemModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Create Manual Item</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsManualItemModalOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleManualItemSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Item Name *
                    </label>
                    <Input
                      value={manualItemForm.itemName}
                      onChange={(e) => setManualItemForm(prev => ({ ...prev, itemName: e.target.value }))}
                      placeholder="Enter item name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <Input
                      value={manualItemForm.category}
                      onChange={(e) => setManualItemForm(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="Enter category"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <Textarea
                    value={manualItemForm.description}
                    onChange={(e) => setManualItemForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter item description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Auction Name
                    </label>
                    <Input
                      value={manualItemForm.auctionName}
                      onChange={(e) => setManualItemForm(prev => ({ ...prev, auctionName: e.target.value }))}
                      placeholder="Enter auction name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lot Number
                    </label>
                    <Input
                      value={manualItemForm.lotNumber}
                      onChange={(e) => setManualItemForm(prev => ({ ...prev, lotNumber: e.target.value }))}
                      placeholder="Enter lot number"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Auction Site Estimate
                    </label>
                    <Input
                      value={manualItemForm.auctionSiteEstimate}
                      onChange={(e) => setManualItemForm(prev => ({ ...prev, auctionSiteEstimate: e.target.value }))}
                      placeholder="Enter estimate"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <Select
                      value={manualItemForm.priority}
                      onValueChange={(value: 'high' | 'medium' | 'low') => 
                        setManualItemForm(prev => ({ ...prev, priority: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL
                    </label>
                    <Input
                      value={manualItemForm.url}
                      onChange={(e) => setManualItemForm(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="Enter item URL"
                      type="url"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Main URL
                    </label>
                    <Input
                      value={manualItemForm.urlMain}
                      onChange={(e) => setManualItemForm(prev => ({ ...prev, urlMain: e.target.value }))}
                      placeholder="Enter main URL"
                      type="url"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Camera className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Workflow Information</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    This item will be created and assigned directly to the <strong>Photographer</strong> stage. 
                    It will follow the normal workflow: Photography → Research2 → Finalized.
                  </p>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Item
                      </>
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsManualItemModalOpen(false)}
                    className="flex-1"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* eBay Listing Draft Modal */}
      {isEbayDraftModalOpen && selectedItemForDraft && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Create eBay Listing Draft</h3>
                <Button variant="outline" size="sm" onClick={() => setIsEbayDraftModalOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Listing Title
                  </label>
                  <Input
                    value={ebayDraft.title}
                    onChange={(e) => setEbayDraft(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter eBay listing title"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <Textarea
                    value={ebayDraft.description}
                    onChange={(e) => setEbayDraft(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter item description"
                    rows={4}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Condition
                  </label>
                  <Select
                    value={ebayDraft.condition}
                    onValueChange={(value) => setEbayDraft(prev => ({ ...prev, condition: value }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Used">Used</SelectItem>
                      <SelectItem value="For parts or not working">For parts or not working</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Listing Type
                  </label>
                  <Select
                    value={ebayDraft.listingType}
                    onValueChange={(value) => setEbayDraft(prev => ({ ...prev, listingType: value as 'auction' | 'fixed' }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auction">Auction</SelectItem>
                      <SelectItem value="fixed">Fixed Price</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {ebayDraft.listingType === 'auction' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Starting Price
                    </label>
                    <Input
                      value={ebayDraft.startingPrice}
                      onChange={(e) => setEbayDraft(prev => ({ ...prev, startingPrice: e.target.value }))}
                      placeholder="Enter starting price"
                      className="w-full"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fixed Price
                    </label>
                    <Input
                      value={ebayDraft.fixedPrice}
                      onChange={(e) => setEbayDraft(prev => ({ ...prev, fixedPrice: e.target.value }))}
                      placeholder="Enter fixed price"
                      className="w-full"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category ID
                  </label>
                  <Input
                    value={ebayDraft.categoryId}
                    onChange={(e) => setEbayDraft(prev => ({ ...prev, categoryId: e.target.value }))}
                    placeholder="Enter eBay category ID"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Secondary Category ID
                  </label>
                  <Input
                    value={ebayDraft.categoryId2}
                    onChange={(e) => setEbayDraft(prev => ({ ...prev, categoryId2: e.target.value }))}
                    placeholder="Enter secondary category ID (optional)"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tertiary Category ID
                  </label>
                  <Input
                    value={ebayDraft.categoryId3}
                    onChange={(e) => setEbayDraft(prev => ({ ...prev, categoryId3: e.target.value }))}
                    placeholder="Enter tertiary category ID (optional)"
                    className="w-full"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button onClick={submitEbayDraft} className="flex-1">
                  <FileText className="mr-2 h-4 w-4" />
                  Create Draft
                </Button>
                <Button variant="outline" onClick={() => setIsEbayDraftModalOpen(false)} className="flex-1">
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
