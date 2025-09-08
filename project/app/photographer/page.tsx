'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ExternalLink, Image, Calendar, Tag, DollarSign, RefreshCw, Plus, ArrowRight, Camera, Edit3, Save, X, Trash2 } from 'lucide-react';
import Navbar from '@/components/layout/navbar';
import ImageUpload from '@/components/ImageUpload';
import ItemCard from '@/components/ItemCard';
import { dataStore } from '@/services/dataStore';
import { AuctionItem } from '@/types/auction';

export default function PhotographerPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<AuctionItem>>({});
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
      // Show only items assigned to the photographer role
      const photographyItems = allItems.filter(item => 
        item.assignedTo === 'photographer'
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
      notes: item.notes || '',
      isMultipleItems: item.isMultipleItems || false,
      multipleItemsCount: item.multipleItemsCount || 1
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

      // Check if the item has been assigned to the photographer role
      if (currentItem.assignedTo !== 'photographer') {
        alert('You can only move items to the next status if they are assigned to the photographer role.');
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

  // All items are already filtered to photographer role, so use them directly
  const myAssignedItems = items; // All items shown are assigned to photographer role
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

        {/* My Photography Tasks */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900">My Photography Tasks</h2>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{myAssignedItems.length} items assigned to you</Badge>
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
          ) : myAssignedItems.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No photography tasks assigned</h3>
                <p className="text-gray-600">
                  You don&apos;t have any items assigned to you for photography yet. Items will appear here when they are assigned to the photographer role.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {myAssignedItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onEdit={startEditing}
                  onViewOriginal={(item) => {
                    const url = item.url || (item as any).url_main;
                    if (url) {
                      window.open(url, '_blank');
                    } else {
                      alert('No URL available for this item');
                    }
                  }}
                  onMoveToNext={moveToNextStatus}
                  showEditButton={true}
                  showMoveToNextButton={item.assignedTo === 'photographer'}
                  userRole="photographer"
                />
              ))}
            </div>
          )}
        </div>

        {/* Editing Modal */}
        {editingItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Edit Photography Details</h3>
                <Button variant="outline" size="sm" onClick={cancelEdit}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {/* Multiple Items Section */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Multiple Items</h4>
                  <div className="flex items-center space-x-2 mb-3">
                    <input
                      type="checkbox"
                      id="isMultipleItems"
                      checked={editForm.isMultipleItems || false}
                      onChange={(e) => setEditForm(prev => ({ ...prev, isMultipleItems: e.target.checked }))}
                      className="rounded"
                    />
                    <label htmlFor="isMultipleItems" className="text-sm">
                      This item contains multiple items
                    </label>
                  </div>
                  {editForm.isMultipleItems && (
                    <div className="ml-6">
                      <label className="block text-sm font-medium mb-1">Number of items:</label>
                      <Input
                        type="number"
                        min="1"
                        value={editForm.multipleItemsCount || 1}
                        onChange={(e) => setEditForm(prev => ({ ...prev, multipleItemsCount: parseInt(e.target.value) || 1 }))}
                        className="w-32"
                      />
                    </div>
                  )}
                </div>

                {/* Image Upload Section */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Photography Images</h4>
                  
                  {/* Image Upload Component */}
                  <div className="mb-4">
                    <ImageUpload onImageUploaded={handleImageUpload} onImagesUploaded={handleImagesUpload} multiple={true} />
                  </div>

                  {/* Manual URL Input */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Add Image URL:</label>
                    <div className="flex gap-2">
                      <Input
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="flex-1"
                      />
                      <Button onClick={() => addImage(editingItem)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Current Images */}
                  {editForm.photographerImages && editForm.photographerImages.length > 0 && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">Current Images:</label>
                      <div className="grid grid-cols-2 gap-2">
                        {editForm.photographerImages.map((imageUrl, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={imageUrl}
                              alt={`Photography ${index + 1}`}
                              className="w-full h-24 object-cover rounded border"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            <Button
                              size="sm"
                              variant="destructive"
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeImageFromForm(imageUrl)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes Section */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Notes</h4>
                  <Textarea
                    value={editForm.notes || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Add any notes about the photography..."
                    rows={3}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button onClick={() => saveEdit(editingItem)} className="flex-1">
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={cancelEdit} className="flex-1">
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}