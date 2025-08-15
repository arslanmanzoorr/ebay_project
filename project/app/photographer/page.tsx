'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, Award } from 'lucide-react';
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
  webhookData?: any; // Store webhook response data
  createdAt: Date;
}

export default function PhotographerDashboard() {
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<AuctionItem | null>(null);
  const [photographyData, setPhotographyData] = useState({
    quantity: 1,
    images: [] as File[]
  });

  useEffect(() => {
    const savedItems = localStorage.getItem('auctionItems');
    if (savedItems) {
      const allItems = JSON.parse(savedItems);
      setItems(allItems.filter((item: AuctionItem) => item.status === 'winning'));
    }
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    console.log('Files selected:', files.length);
    
    if (files.length > 2) {
      alert('Please select maximum 2 images');
      return;
    }
    
    if (files.length === 0) {
      alert('Please select at least one image');
      return;
    }
    
    setPhotographyData({
      ...photographyData,
      images: files
    });
    
    console.log('Photography data updated:', files.length, 'images');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-blue-400', 'bg-blue-50');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
    
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 2) {
      alert('Please select maximum 2 images');
      return;
    }
    
    if (imageFiles.length === 0) {
      alert('Please select at least one image file');
      return;
    }
    
    setPhotographyData({
      ...photographyData,
      images: imageFiles
    });
    
    console.log('Files dropped:', imageFiles.length, 'images');
  };

  const handleSubmitPhotography = async () => {
    if (!selectedItem || photographyData.images.length === 0) {
      alert('Please select an item and upload at least one image');
      return;
    }

    try {
      // Convert files to base64 strings for webhook
      const photoPromises = photographyData.images.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result as string;
            resolve(base64.split(',')[1]); // Remove data:image/...;base64, prefix
          };
          reader.readAsDataURL(file);
        });
      });

      const photoBase64Strings = await Promise.all(photoPromises);

      // Prepare webhook payload
      const webhookPayload = {
        auction_name: selectedItem.auctionName || '',
        item_name: selectedItem.itemName || '',
        lot_number: selectedItem.lotNumber || '',
        description: selectedItem.description || '',
        lead: selectedItem.lead || '',
        first_estimate: selectedItem.auctionSiteEstimate || '',
        category: selectedItem.category || '',
        previous_ai_estimate: selectedItem.aiEstimate || '',
        previous_ai_description: selectedItem.aiDescription || '',
        human_researcher_estimate: selectedItem.researcherEstimate || '',
        human_researcher_description: selectedItem.researcherDescription || '',
        human_researcher_supporting_links: selectedItem.referenceUrls || [],
        quantity: photographyData.quantity,
        photos: photoBase64Strings
      };

      console.log('Calling photography webhook with payload:', webhookPayload);
      
      // Call the backend webhook
      const response = await apiClient.post(API_ENDPOINTS.SUBMIT_PHOTOGRAPHY, webhookPayload);
      console.log('Photography webhook response:', response);

      // Convert files to URLs for demo purposes
      const imageUrls = photographyData.images.map(file => URL.createObjectURL(file));

      // Handle the webhook responses and create new items for researcher2
      const savedItems = localStorage.getItem('auctionItems');
      let allItems = savedItems ? JSON.parse(savedItems) : [];

      if (response.data && response.data.research2_items) {
        // Add the new research2 items from the webhook responses
        const newResearch2Items = response.data.research2_items.map((webhookItem: any) => ({
          id: `${selectedItem.id}-${webhookItem.sku}`,
          auctionName: selectedItem.auctionName,
          lotNumber: selectedItem.lotNumber,
          images: selectedItem.images,
          sku: webhookItem.sku,
          itemName: selectedItem.itemName,
          category: selectedItem.category,
          description: selectedItem.description,
          lead: selectedItem.lead,
          auctionSiteEstimate: selectedItem.auctionSiteEstimate,
          aiDescription: selectedItem.aiDescription,
          aiEstimate: selectedItem.aiEstimate,
          researcherEstimate: selectedItem.researcherEstimate,
          researcherDescription: selectedItem.researcherDescription,
          referenceUrls: selectedItem.referenceUrls,
          photographerQuantity: 1, // Always 1 for each item
          photographerImages: imageUrls,
          status: 'research2' as const,
          webhookData: webhookItem.webhook_response, // Store the webhook response
          createdAt: new Date()
        }));

        // Add new items to the array
        allItems = [...allItems, ...newResearch2Items];
      }

      // Remove the original item (it's now been split into multiple research2 items)
      allItems = allItems.filter((item: AuctionItem) => item.id !== selectedItem.id);
      
      localStorage.setItem('auctionItems', JSON.stringify(allItems));

      const updatedWinningItems = items.filter(item => item.id !== selectedItem.id);
      setItems(updatedWinningItems);
      setSelectedItem(null);
      setPhotographyData({ quantity: 1, images: [] });

      alert('Photography submitted successfully!');
    } catch (error) {
      console.error('Photography submission failed:', error);
      alert('Photography submission failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Photography Dashboard</h1>
          <p className="text-gray-600">Photograph winning auction items</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="mr-2 h-5 w-5" />
                  Winning Items ({items.length})
                </CardTitle>
                <CardDescription>Items ready for photography</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {items.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No winning items available</p>
                  ) : (
                    items.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedItem?.id === item.id ? 'border-blue-500 bg-blue-50' : ''
                        }`}
                        onClick={() => setSelectedItem(item)}
                      >
                        <h3 className="font-medium">{item.itemName}</h3>
                        <p className="text-sm text-gray-600">{item.auctionName}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="secondary">{item.category}</Badge>
                          <Badge className="bg-green-100 text-green-800">Winning</Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Item Details & Photography Form */}
          <div className="lg:col-span-2">
            {selectedItem ? (
              <div className="space-y-6">
                {/* Item Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>{selectedItem.itemName}</CardTitle>
                    <CardDescription>{selectedItem.auctionName} - {selectedItem.lotNumber}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-2">Item Information</h4>
                        <div className="space-y-2 text-sm">
                          <p><strong>SKU:</strong> {selectedItem.sku}</p>
                          <p><strong>Category:</strong> {selectedItem.category}</p>
                          <p><strong>Lead:</strong> {selectedItem.lead}</p>
                          <p><strong>Auction Site Estimate:</strong> {selectedItem.auctionSiteEstimate}</p>
                          <p><strong>Researcher Estimate:</strong> {selectedItem.researcherEstimate}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Research Analysis</h4>
                        <div className="space-y-2 text-sm">
                          <p><strong>AI Estimate:</strong> {selectedItem.aiEstimate}</p>
                          <p><strong>AI Description:</strong> {selectedItem.aiDescription}</p>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{selectedItem.researcherDescription}</p>
                        {selectedItem.referenceUrls && selectedItem.referenceUrls.length > 0 && (
                          <div className="mt-2">
                            <strong className="text-sm">Reference URLs:</strong>
                            <ul className="list-disc list-inside text-sm text-blue-600">
                              {selectedItem.referenceUrls.map((url, index) => (
                                <li key={index}>
                                  <a href={url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                    {url}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedItem.images && selectedItem.images.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Original Images</h4>
                        <div className="grid grid-cols-2 gap-4">
                          {selectedItem.images.map((image, index) => (
                            <img
                              key={index}
                              src={image}
                              alt={`Original ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Photography Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Camera className="mr-2 h-5 w-5" />
                      Photography Submission
                    </CardTitle>
                    <CardDescription>Add quantity and upload professional photos</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={photographyData.quantity}
                        onChange={(e) => setPhotographyData({
                          ...photographyData, 
                          quantity: parseInt(e.target.value) || 1
                        })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="photos">Upload Photos (Max 2)</Label>
                      <div 
                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                      >
                        <div className="text-center">
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="mt-4">
                            <label htmlFor="photos" className="cursor-pointer block">
                              <span className="mt-2 block text-sm font-medium text-gray-900 hover:text-gray-700">
                                Click to upload or drag and drop
                              </span>
                              <span className="mt-1 block text-sm text-gray-500">
                                PNG, JPG, JPEG up to 10MB each
                              </span>
                              <Button 
                                type="button" 
                                variant="outline" 
                                className="mt-2"
                                onClick={() => document.getElementById('photos')?.click()}
                              >
                                Choose Files
                              </Button>
                            </label>
                            <input
                              id="photos"
                              type="file"
                              multiple
                              accept="image/*"
                              className="sr-only"
                              onChange={handleFileUpload}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {photographyData.images.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Selected Images ({photographyData.images.length})</h4>
                        <div className="grid grid-cols-2 gap-4">
                          {photographyData.images.map((file, index) => (
                            <div key={index} className="relative">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`Upload ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border"
                              />
                              <p className="text-xs text-gray-500 mt-1 truncate">{file.name}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button onClick={handleSubmitPhotography} className="w-full">
                      Submit Photography
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <Camera className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No item selected</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Select a winning item from the list to start photography
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}