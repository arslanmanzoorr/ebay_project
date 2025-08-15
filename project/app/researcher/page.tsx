'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, FileText, Plus, Trash2 } from 'lucide-react';
import Navbar from '@/components/layout/navbar';

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

export default function ResearcherDashboard() {
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<AuctionItem | null>(null);
  const [researchData, setResearchData] = useState({
    estimate: '',
    description: '',
    referenceUrls: ['']
  });

  useEffect(() => {
    const savedItems = localStorage.getItem('auctionItems');
    if (savedItems) {
      const allItems = JSON.parse(savedItems);
      setItems(allItems.filter((item: AuctionItem) => item.status === 'research'));
    }
  }, []);

  const saveItems = (updatedItems: AuctionItem[]) => {
    const savedItems = localStorage.getItem('auctionItems');
    if (savedItems) {
      const allItems = JSON.parse(savedItems);
      const otherItems = allItems.filter((item: AuctionItem) => item.status !== 'research');
      const newAllItems = [...otherItems, ...updatedItems];
      localStorage.setItem('auctionItems', JSON.stringify(newAllItems));
    }
    setItems(updatedItems);
  };

  const handleSubmitResearch = () => {
    if (!selectedItem || !researchData.estimate || !researchData.description) {
      alert('Please fill in all required fields');
      return;
    }

    const updatedItem = {
      ...selectedItem,
      researcherEstimate: researchData.estimate,
      researcherDescription: researchData.description,
      referenceUrls: researchData.referenceUrls.filter(url => url.trim() !== ''),
      status: 'waiting' as const
    };

    const savedItems = localStorage.getItem('auctionItems');
    if (savedItems) {
      const allItems = JSON.parse(savedItems);
      const updatedAllItems = allItems.map((item: AuctionItem) => 
        item.id === selectedItem.id ? updatedItem : item
      );
      localStorage.setItem('auctionItems', JSON.stringify(updatedAllItems));
    }

    const updatedResearchItems = items.filter(item => item.id !== selectedItem.id);
    setItems(updatedResearchItems);
    setSelectedItem(null);
    setResearchData({ estimate: '', description: '', referenceUrls: [''] });
  };

  const addReferenceUrl = () => {
    setResearchData({
      ...researchData,
      referenceUrls: [...researchData.referenceUrls, '']
    });
  };

  const updateReferenceUrl = (index: number, value: string) => {
    const newUrls = [...researchData.referenceUrls];
    newUrls[index] = value;
    setResearchData({
      ...researchData,
      referenceUrls: newUrls
    });
  };

  const removeReferenceUrl = (index: number) => {
    const newUrls = researchData.referenceUrls.filter((_, i) => i !== index);
    setResearchData({
      ...researchData,
      referenceUrls: newUrls.length > 0 ? newUrls : ['']
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Research Dashboard</h1>
          <p className="text-gray-600">Review and research auction items</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Items for Research ({items.length})
                </CardTitle>
                <CardDescription>Click on an item to start research</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {items.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No items assigned for research</p>
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
                        <Badge className="mt-1" variant="secondary">{item.category}</Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Item Details & Research Form */}
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
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">AI Analysis</h4>
                        <div className="space-y-2 text-sm">
                          <p><strong>AI Estimate:</strong> {selectedItem.aiEstimate}</p>
                          <p><strong>AI Description:</strong> {selectedItem.aiDescription}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Description</h4>
                      <p className="text-sm text-gray-600">{selectedItem.description}</p>
                    </div>

                    {selectedItem.images && selectedItem.images.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Images</h4>
                        <div className="grid grid-cols-2 gap-4">
                          {(selectedItem.images || []).map((image, index) => (
                            <img
                              key={index}
                              src={image}
                              alt={`Item ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Research Form */}
                <Card>
                  <CardHeader>
                    <CardTitle>Research Analysis</CardTitle>
                    <CardDescription>Add your research findings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="estimate">Your Estimate *</Label>
                      <Input
                        id="estimate"
                        placeholder="Enter your price estimate (e.g., $2,500 - $3,000)"
                        value={researchData.estimate}
                        onChange={(e) => setResearchData({...researchData, estimate: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Your Description *</Label>
                      <Textarea
                        id="description"
                        placeholder="Enter detailed description based on your research"
                        value={researchData.description}
                        onChange={(e) => setResearchData({...researchData, description: e.target.value})}
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Reference URLs</Label>
                      {(researchData.referenceUrls || []).map((url, index) => (
                        <div key={index} className="flex space-x-2">
                          <Input
                            placeholder="Enter reference URL"
                            value={url}
                            onChange={(e) => updateReferenceUrl(index, e.target.value)}
                          />
                          {researchData.referenceUrls.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeReferenceUrl(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addReferenceUrl}
                        className="w-full"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Reference URL
                      </Button>
                    </div>

                    <Button onClick={handleSubmitResearch} className="w-full">
                      Submit Research
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <Search className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No item selected</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Select an item from the list to start your research
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