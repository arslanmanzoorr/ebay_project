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
import { Loader2, ExternalLink, Image, Calendar, Tag, DollarSign, RefreshCw, Plus, ArrowRight, Camera, Edit3, Save, X, Trash2 } from 'lucide-react';
import Navbar from '@/components/layout/navbar';
import ImageUpload from '@/components/ImageUpload';
import { dataStore } from '@/services/dataStore';
import { AuctionItem } from '@/types/auction';

export default function PhotographerPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<AuctionItem>>({});
  const [activeTab, setActiveTab] = useState('photography');
  const [newImageUrl, setNewImageUrl] = useState('');

  // Check authentication
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    } else if (user && user.role !== 'photographer') {
      router.push('/');
    }
  }, [user, isLoading, router]);

  // Load data on component mount
  useEffect(() => {
    if (user && user.role === 'photographer') {
      loadItems();
    }
  }, [user]);

  const loadItems = async () => {
    try {
      const allItems = await dataStore.getItems();
      const photographyItems = allItems.filter(item => 
        item.status === 'photography' || item.assignedTo === user?.id
      );
      setItems(photographyItems);
      setIsLoadingData(false);
    } catch (error) {
      console.error('Error loading items:', error);
      setIsLoadingData(false);
    }
  };

  const startEditing = (item: AuctionItem) => {
    setEditingItem(item.id);
    setEditForm({
      photographerQuantity: item.photographerQuantity || 1,
      photographerImages: item.photographerImages || [],
      notes: item.notes || ''
    });
  };

  const handleImageUpload = (image: any) => {
    if (image) {
      setEditForm(prev => ({
        ...prev,
        photographerImages: [...(prev.photographerImages || []), image.url]
      }));
    }
  };

  const handleImagesUpload = (images: any[]) => {
    const imageUrls = images.map(img => img.url);
    setEditForm(prev => ({
      ...prev,
      photographerImages: [...(prev.photographerImages || []), ...imageUrls]
    }));
  };

  const removeImageFromForm = (imageUrl: string) => {
    setEditForm(prev => ({
      ...prev,
      photographerImages: (prev.photographerImages || []).filter(url => url !== imageUrl)
    }));
  };

  const saveEdit = async (itemId: string) => {
    try {
      console.log('Saving edit for item:', itemId);
      console.log('Edit form data:', editForm);
      
      // Ensure photographerImages is properly set
      const updates = {
        ...editForm,
        photographerImages: editForm.photographerImages || []
      };
      
      console.log('Updates to save:', updates);
      
      const updatedItem = await dataStore.updateItem(itemId, updates);
      if (updatedItem) {
        console.log('Item updated successfully:', updatedItem);
        setEditingItem(null);
        setEditForm({});
        await loadItems();
        // Show success message
        alert('Photography details saved successfully!');
      } else {
        alert('Failed to save photography details. Please try again.');
      }
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Error saving photography details. Please try again.');
    }
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditForm({});
  };

  const addImage = async (itemId: string) => {
    if (!newImageUrl.trim()) {
      alert('Please enter an image URL.');
      return;
    }

    // Basic URL validation
    try {
      new URL(newImageUrl.trim());
    } catch {
      alert('Please enter a valid URL (e.g., https://example.com/image.jpg)');
      return;
    }
    
    try {
      console.log('Adding image to item:', itemId);
      console.log('New image URL:', newImageUrl.trim());
      
      const item = dataStore.getItem(itemId);
      if (item) {
        const currentImages = item.photographerImages || [];
        const updatedImages = [...currentImages, newImageUrl.trim()];
        
        console.log('Current images:', currentImages);
        console.log('Updated images:', updatedImages);
        
        // Update the editForm state to reflect the new image
        setEditForm(prev => ({
          ...prev,
          photographerImages: updatedImages
        }));
        
        // Also update the item in the dataStore
        await dataStore.updateItem(itemId, { photographerImages: updatedImages });
        setNewImageUrl('');
        await loadItems();
        
        // Show success message
        alert('Image URL added successfully!');
      }
    } catch (error) {
      console.error('Error adding image:', error);
      alert('Error adding image URL. Please try again.');
    }
  };

  const removeImage = async (itemId: string, imageIndex: number) => {
    try {
      const item = dataStore.getItem(itemId);
      if (item && item.photographerImages) {
        const updatedImages = item.photographerImages.filter((_, index) => index !== imageIndex);
        
        // Update the editForm state to reflect the removed image
        setEditForm(prev => ({
          ...prev,
          photographerImages: updatedImages
        }));
        
        // Update the item in the dataStore
        await dataStore.updateItem(itemId, { photographerImages: updatedImages });
        await loadItems();
        
        // Show success message
        alert('Image removed successfully!');
      }
    } catch (error) {
      console.error('Error removing image:', error);
      alert('Error removing image. Please try again.');
    }
  };

  const moveToNextStatus = async (itemId: string) => {
    try {
      // Get the current item to check if it exists
      const currentItem = dataStore.getItem(itemId);
      if (!currentItem) {
        alert('Item not found. Please refresh and try again.');
        return;
      }

      // Check if the item has been assigned to the current user
      if (currentItem.assignedTo !== user?.id) {
        alert('You can only move items to the next status if they are assigned to you.');
        return;
      }

      // Proceed with moving to next status
      if (await dataStore.moveItemToNextStatus(itemId, user?.id || '', user?.name || '')) {
        await loadItems();
        alert('Item moved to Research 2 stage successfully!');
      } else {
        alert('Failed to move item to next status. Please try again.');
      }
    } catch (error) {
      console.error('Error moving item to next status:', error);
      alert('Error moving item to next status. Please try again.');
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

  // Show access denied if not photographer
  if (user && user.role !== 'photographer') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don&apos;t have permission to access the photographer dashboard.</p>
        </div>
      </div>
    );
  }

  const photographyItems = items.filter(item => item.status === 'photography');
  const myAssignedItems = items.filter(item => item.assignedTo === user?.id);
  const stats = dataStore.getDashboardStats(user?.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Photography Dashboard</h1>
          <p className="text-gray-600">Manage item photography and prepare images for the next workflow stage</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Camera className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Photography Items</CardTitle>
              <Image className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.photography}</div>
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

        {/* Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="photography">Photography Items</TabsTrigger>
            <TabsTrigger value="assigned">My Assigned Items</TabsTrigger>
            <TabsTrigger value="completed">Completed Photography</TabsTrigger>
          </TabsList>

          {/* Photography Items Tab */}
          <TabsContent value="photography" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-900">Photography Items</h2>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{photographyItems.length} items</Badge>
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
            ) : photographyItems.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No photography items</h3>
                  <p className="text-gray-600">
                    All items have been photographed or there are no items in the photography stage.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {photographyItems.map((item) => (
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
                            <span className="font-medium text-blue-700">AI:</span>
                            <p className="text-blue-600 text-xs line-clamp-2">{item.aiDescription}</p>
                          </div>
                        )}
                      </div>

                      {/* Researcher Data */}
                      {item.researcherEstimate && (
                        <div className="bg-green-50 p-2 rounded border-l-2 border-green-400">
                          <h4 className="text-xs font-medium text-green-900 mb-1">🔍 Research</h4>
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

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => assignToMe(item.id)}
                        >
                          <Tag className="mr-2 h-3 w-3" />
                          Assign to Me
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditing(item)}
                        >
                          <Edit3 className="mr-2 h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (item.url) {
                              window.open(item.url, '_blank');
                            } else {
                              alert('No URL available for this item');
                            }
                          }}
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
                    You haven&apos;t been assigned any items yet. Assign items to yourself from the photography tab.
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
                              <label className="text-sm font-medium">Quantity</label>
                              <Input
                                type="number"
                                value={editForm.photographerQuantity || 1}
                                onChange={(e) => setEditForm({...editForm, photographerQuantity: parseInt(e.target.value) || 1})}
                                className="mt-1"
                                min="1"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Current Images</label>
                              <div className="text-sm text-gray-600 mt-1">
                                {(editForm.photographerImages || []).length} images
                              </div>
                            </div>
                          </div>

                          {/* Image Upload */}
                          <div>
                            <label className="text-sm font-medium mb-2 block">Upload New Images</label>
                            <ImageUpload
                              onImagesUploaded={handleImagesUpload}
                              multiple={true}
                              maxFiles={10}
                              className="border-0 shadow-none"
                            />
                          </div>

                          {/* Legacy URL Input (for backward compatibility) */}
                          <div>
                            <label className="text-sm font-medium">Or Add Image URL</label>
                            <div className="flex gap-2 mt-1">
                              <Input
                                placeholder="https://example.com/image.jpg"
                                value={newImageUrl}
                                onChange={(e) => setNewImageUrl(e.target.value)}
                                className="flex-1"
                              />
                              <Button
                                size="sm"
                                onClick={() => addImage(item.id)}
                                disabled={!newImageUrl.trim()}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Current Images */}
                          {(editForm.photographerImages || []).length > 0 && (
                            <div>
                              <label className="text-sm font-medium">Current Images</label>
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                {(editForm.photographerImages || []).map((image, index) => (
                                  <div key={index} className="relative group">
                                    <img
                                      src={image}
                                      alt={`Image ${index + 1}`}
                                      className="w-full h-24 object-cover rounded border"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() => removeImageFromForm(image)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div>
                            <label className="text-sm font-medium">Photography Notes</label>
                            <Textarea
                              value={editForm.notes || ''}
                              onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                              className="mt-1"
                              rows={3}
                              placeholder="Add photography notes, lighting details, etc..."
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
                        // Display Mode */}
                        <div className="space-y-3">
                          <p className="text-sm text-gray-600">{item.description}</p>
                          
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
                                <span className="font-medium text-blue-700">AI:</span>
                                <p className="text-blue-600 text-xs line-clamp-2">{item.aiDescription}</p>
                              </div>
                            )}
                          </div>

                          {/* Researcher Data */}
                          {item.researcherEstimate && (
                            <div className="bg-green-50 p-2 rounded border-l-2 border-green-400">
                              <h4 className="text-xs font-medium text-green-900 mb-1">🔍 Research</h4>
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

                          {/* Current Photography Data */}
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Quantity:</span> {item.photographerQuantity || 1}
                            </div>
                            <div>
                              <span className="font-medium">Images:</span> {(item.photographerImages || []).length}
                            </div>
                          </div>

                          {item.notes && (
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-gray-700">Photography Notes:</p>
                              <p className="text-sm text-gray-600">{item.notes}</p>
                            </div>
                          )}

                          {/* Display Images */}
                          {(item.photographerImages || []).length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">📸 Photography Images:</p>
                              <div className="grid grid-cols-2 gap-2">
                                {(item.photographerImages || []).map((image, index) => (
                                  <img
                                    key={index}
                                    src={image}
                                    alt={`Photography ${index + 1}`}
                                    className="w-full h-24 object-cover rounded border"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                ))}
                              </div>
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
                              Edit Photography
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (item.url) {
                                  window.open(item.url, '_blank');
                                } else {
                                  alert('No URL available for this item');
                                }
                              }}
                            >
                              <ExternalLink className="mr-2 h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Move to Next Status Button */}
                      {item.status === 'photography' && (
                        <div className="pt-4 border-t">
                          <Button
                            className="w-full"
                            onClick={() => moveToNextStatus(item.id)}
                          >
                            <ArrowRight className="mr-2 h-4 w-4" />
                            Complete Photography & Move to Research 2
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Completed Photography Tab */}
          <TabsContent value="completed" className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">Completed Photography</h2>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.filter(item => item.status !== 'photography' && item.assignedTo === user?.id).map((item) => (
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

                    <div className="text-sm">
                      <span className="font-medium">Images Taken: </span>
                      <span className="text-purple-600">{(item.photographerImages || []).length}</span>
                    </div>

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