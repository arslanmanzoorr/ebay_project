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
