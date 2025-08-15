'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Camera, CheckCircle, RefreshCw } from 'lucide-react';
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
  status: 'research' | 'winning' | 'photography' | 'research2' | 'finalized' | 'waiting';
  researcherEstimate?: string;
  researcherDescription?: string;
  referenceUrls?: string[];
  photographerQuantity?: number;
  photographerImages?: string[];
  webhookData?: any; // Store webhook response data
  finalData?: {
    aiImprovedEstimate: string;
    aiImprovedDescription: string;
    ebayTitle: string;
    ebayDescription: string;
    condition: string;
    quantity: number;
  };
  createdAt: Date;
}

interface WebhookData {
  sku: string;
  ebay_title: string;
  ebay_description: string;
  condition: string;
  ai_improved_estimate: string;
  ai_improved_description: string;
  quantity: number;
  received_at: number;
}

export default function Researcher2Dashboard() {
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<AuctionItem | null>(null);
  const [webhookData, setWebhookData] = useState<WebhookData | null>(null);
  const [loading, setLoading] = useState(false);
  const [finalData, setFinalData] = useState({
    aiImprovedEstimate: '',
    aiImprovedDescription: '',
    ebayTitle: '',
    ebayDescription: '',
    condition: '',
    quantity: 1
  });

  useEffect(() => {
    const savedItems = localStorage.getItem('auctionItems');
    if (savedItems) {
      const allItems = JSON.parse(savedItems);
      setItems(allItems.filter((item: AuctionItem) => item.status === 'research2'));
    }
  }, []);

  useEffect(() => {
    if (selectedItem && selectedItem.sku) {
      fetchWebhookData(selectedItem.sku);
    }
  }, [selectedItem]);

  const fetchWebhookData = async (sku: string) => {
    if (!sku) return;
    
    setLoading(true);
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.GET_WEBHOOK_DATA}?sku=${sku}`);
      if (response.status === 'success' && response.webhook_data) {
        setWebhookData(response.webhook_data);
        
        // Update final data with webhook data
        setFinalData({
          aiImprovedEstimate: response.webhook_data.ai_improved_estimate || 'Not available',
          aiImprovedDescription: response.webhook_data.ai_improved_description || 'Not available',
          ebayTitle: response.webhook_data.ebay_title || `${selectedItem?.itemName} - ${selectedItem?.category}`,
          ebayDescription: response.webhook_data.ebay_description || 'Professional listing description',
          condition: response.webhook_data.condition || 'Used - Good',
          quantity: response.webhook_data.quantity || selectedItem?.photographerQuantity || 1
        });
      }
    } catch (error) {
      console.error('Failed to fetch webhook data:', error);
      // Use fallback data if webhook fails
      if (selectedItem) {
        setFinalData({
          aiImprovedEstimate: selectedItem.researcherEstimate || 'Not available',
          aiImprovedDescription: selectedItem.researcherDescription || 'Not available',
          ebayTitle: `${selectedItem.itemName} - ${selectedItem.category}`,
          ebayDescription: `Professional listing description for ${selectedItem.itemName}`,
          condition: 'Used - Good',
          quantity: selectedItem.photographerQuantity || 1
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFinal = () => {
    if (!selectedItem) {
      alert('Please select an item');
      return;
    }

    const updatedItem = {
      ...selectedItem,
      finalData: finalData,
      status: 'finalized' as const
    };

    const savedItems = localStorage.getItem('auctionItems');
    if (savedItems) {
      const allItems = JSON.parse(savedItems);
      const updatedAllItems = allItems.map((item: AuctionItem) => 
        item.id === selectedItem.id ? updatedItem : item
      );
      localStorage.setItem('auctionItems', JSON.stringify(updatedAllItems));
    }

    const updatedResearch2Items = items.filter(item => item.id !== selectedItem.id);
    setItems(updatedResearch2Items);
    setSelectedItem(null);
    setWebhookData(null);
    setFinalData({
      aiImprovedEstimate: '',
      aiImprovedDescription: '',
      ebayTitle: '',
      ebayDescription: '',
      condition: '',
      quantity: 1
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Research 2 Dashboard</h1>
          <p className="text-gray-600">Final review and eBay listing preparation</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Items for Final Review ({items.length})
                </CardTitle>
                <CardDescription>Items ready for final processing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {items.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No items ready for final review</p>
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
                          <Badge className="bg-orange-100 text-orange-800">Research 2</Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Item Details & Final Form */}
          <div className="lg:col-span-2">
            {selectedItem ? (
              <div className="space-y-6">
                {/* Item Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>{selectedItem.itemName}</CardTitle>
                    <CardDescription>{selectedItem.auctionName} - Lot #{selectedItem.lotNumber}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div>
                        <h4 className="font-medium mb-2">Basic Info</h4>
                        <div className="space-y-1 text-sm">
                          <p><strong>SKU:</strong> {selectedItem.sku}</p>
                          <p><strong>Category:</strong> {selectedItem.category}</p>
                          <p><strong>Quantity:</strong> {selectedItem.photographerQuantity}</p>
                          <p><strong>Lead:</strong> {selectedItem.lead}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Original Estimates</h4>
                        <div className="space-y-1 text-sm">
                          <p><strong>Auction Site:</strong> {selectedItem.auctionSiteEstimate}</p>
                          <p><strong>Previous AI:</strong> {selectedItem.aiEstimate}</p>
                          <p><strong>Human Research:</strong> {selectedItem.researcherEstimate}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Descriptions</h4>
                        <div className="space-y-1 text-sm">
                          <p><strong>Previous AI:</strong> {selectedItem.aiDescription?.substring(0, 50)}...</p>
                          <p><strong>Human Research:</strong> {selectedItem.researcherDescription?.substring(0, 50)}...</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Status</h4>
                        <Badge className="bg-orange-100 text-orange-800">Ready for Final Review</Badge>
                        {selectedItem.referenceUrls && selectedItem.referenceUrls.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium">Reference Links:</p>
                            <p className="text-xs">{selectedItem.referenceUrls.length} links available</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Photography */}
                    {selectedItem.photographerImages && selectedItem.photographerImages.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-medium mb-2 flex items-center">
                          <Camera className="mr-2 h-4 w-4" />
                          Professional Photos
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          {(selectedItem.photographerImages || []).map((image, index) => (
                            <img
                              key={index}
                              src={image}
                              alt={`Photo ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Webhook Data Display */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>AI Enhanced Data from Webhook</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => selectedItem.sku && fetchWebhookData(selectedItem.sku)}
                        disabled={loading}
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                    </CardTitle>
                    <CardDescription>
                      {loading ? 'Loading webhook data...' : 'Latest data from AI processing workflow'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {webhookData ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>AI Improved Estimate</Label>
                            <div className="p-3 bg-green-50 border border-green-200 rounded text-sm font-medium">
                              {webhookData.ai_improved_estimate || 'Not available'}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>eBay Condition</Label>
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm font-medium">
                              {webhookData.condition || 'Not available'}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>AI Enhanced Description</Label>
                          <div className="p-3 bg-gray-50 border rounded text-sm max-h-32 overflow-y-auto">
                            {webhookData.ai_improved_description || 'Not available'}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>eBay Title</Label>
                          <div className="p-3 bg-purple-50 border border-purple-200 rounded text-sm">
                            {webhookData.ebay_title || 'Not available'}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>eBay Description</Label>
                          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm max-h-32 overflow-y-auto">
                            {webhookData.ebay_description || 'Not available'}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">
                          {loading ? 'Loading webhook data...' : 'No webhook data available. Click refresh to fetch.'}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Editable Final Review Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CheckCircle className="mr-2 h-5 w-5" />
                      Final Review & eBay Preparation (Editable)
                    </CardTitle>
                    <CardDescription>Edit the specified fields for eBay listing</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="ebayTitle">eBay Title (Editable)</Label>
                      <Input
                        id="ebayTitle"
                        value={finalData.ebayTitle}
                        onChange={(e) => setFinalData({...finalData, ebayTitle: e.target.value})}
                        maxLength={80}
                        placeholder="Enter eBay title (max 80 characters)"
                      />
                      <p className="text-sm text-gray-500">{finalData.ebayTitle.length}/80 characters</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity (Editable)</Label>
                        <Input
                          id="quantity"
                          type="number"
                          min="1"
                          value={finalData.quantity}
                          onChange={(e) => setFinalData({
                            ...finalData, 
                            quantity: parseInt(e.target.value) || 1
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="condition">Condition (Editable)</Label>
                        <Select value={finalData.condition} onValueChange={(value) => setFinalData({...finalData, condition: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="New">New</SelectItem>
                            <SelectItem value="New with defects">New with defects</SelectItem>
                            <SelectItem value="Used - Excellent">Used - Excellent</SelectItem>
                            <SelectItem value="Used - Good">Used - Good</SelectItem>
                            <SelectItem value="Used - Fair">Used - Fair</SelectItem>
                            <SelectItem value="For Parts/Not Working">For Parts/Not Working</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ebayDescription">eBay Description (Editable)</Label>
                      <Textarea
                        id="ebayDescription"
                        value={finalData.ebayDescription}
                        onChange={(e) => setFinalData({...finalData, ebayDescription: e.target.value})}
                        rows={6}
                        placeholder="Enter detailed eBay description"
                      />
                    </div>

                    <Button onClick={handleSubmitFinal} className="w-full">
                      Finalize Item
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No item selected</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Select an item from the list to start final review
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