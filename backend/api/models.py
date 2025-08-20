from django.db import models
import json

class WebhookData(models.Model):
    """
    Store webhook data received from n8n workflow
    """
    sku = models.CharField(max_length=100, unique=True, db_index=True)
    ebay_title = models.TextField(blank=True)
    ebay_description = models.TextField(blank=True)
    condition = models.CharField(max_length=100, blank=True)
    ai_improved_estimate = models.TextField(blank=True)
    ai_improved_description = models.TextField(blank=True)
    quantity = models.IntegerField(default=1)
    raw_data = models.JSONField(default=dict)  # Store complete webhook response
    received_at = models.DateTimeField(auto_now_add=True)
    processed = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'webhook_data'
        ordering = ['-received_at']
    
    def __str__(self):
        return f"Webhook Data for {self.sku}"
    
    @property
    def formatted_estimate(self):
        """Format the AI estimate for display"""
        if self.ai_improved_estimate:
            return self.ai_improved_estimate
        return "Not available"
    
    @property
    def formatted_description(self):
        """Format the AI description for display"""
        if self.ai_improved_description:
            return self.ai_improved_description
        return "Not available"

class HiBidItem(models.Model):
    """
    Store processed HiBid URL data from n8n workflow
    """
    url_main = models.URLField(max_length=500, unique=True, db_index=True)
    item_title = models.CharField(max_length=200, blank=True)
    source = models.CharField(max_length=100, default='HiBid')
    lot_number = models.CharField(max_length=50, blank=True)
    description = models.TextField(blank=True)
    lead = models.CharField(max_length=200, blank=True)
    item_name = models.CharField(max_length=200, blank=True)
    category = models.CharField(max_length=100, blank=True)
    estimate = models.CharField(max_length=100, blank=True)
    auction_name = models.CharField(max_length=200, blank=True)
    auctioneer = models.CharField(max_length=200, blank=True)
    auction_type = models.CharField(max_length=100, blank=True)
    auction_dates = models.CharField(max_length=200, blank=True)
    location = models.CharField(max_length=200, blank=True)
    current_bid = models.CharField(max_length=100, blank=True)
    bid_count = models.IntegerField(default=0)
    time_remaining = models.CharField(max_length=100, blank=True)
    shipping_available = models.BooleanField(default=False)
    
    # Image URLs from n8n processing
    all_unique_image_urls = models.JSONField(default=list, blank=True)
    main_image_url = models.URLField(max_length=500, blank=True)
    gallery_image_urls = models.JSONField(default=list, blank=True)
    broad_search_images = models.JSONField(default=list, blank=True)
    tumbnail_images = models.JSONField(default=list, blank=True)
    
    # AI processing results
    ai_response = models.TextField(blank=True)
    
    raw_data = models.JSONField(default=dict)  # Store complete processed data
    processed_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('processed', 'Processed'),
        ('error', 'Error')
    ], default='pending')
    
    class Meta:
        db_table = 'hibid_items'
        ordering = ['-processed_at']
    
    def __str__(self):
        return f"{self.item_title or self.item_name} - {self.lot_number} ({self.source})"

class AuctionItem(models.Model):
    """
    Store auction item information
    """
    sku = models.CharField(max_length=100, unique=True, db_index=True)
    auction_name = models.CharField(max_length=200)
    item_name = models.CharField(max_length=200)
    lot_number = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    lead = models.CharField(max_length=200, blank=True)
    category = models.CharField(max_length=100, blank=True)
    auction_site_estimate = models.CharField(max_length=100, blank=True)
    ai_estimate = models.CharField(max_length=100, blank=True)
    ai_description = models.TextField(blank=True)
    researcher_estimate = models.CharField(max_length=100, blank=True)
    researcher_description = models.TextField(blank=True)
    reference_urls = models.JSONField(default=list)
    photographer_quantity = models.IntegerField(default=1)
    photographer_images = models.JSONField(default=list)
    hibid_item = models.ForeignKey(HiBidItem, on_delete=models.SET_NULL, null=True, blank=True, related_name='auction_items')
    status = models.CharField(max_length=20, choices=[
        ('research', 'Research'),
        ('waiting', 'Waiting'),
        ('winning', 'Winning'),
        ('photography', 'Photography'),
        ('research2', 'Research 2'),
        ('finalized', 'Finalized')
    ], default='research')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'auction_items'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.item_name} - {self.sku}"
