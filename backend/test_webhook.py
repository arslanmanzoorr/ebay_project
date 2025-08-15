#!/usr/bin/env python3
"""
Test script to verify the webhook system is working
"""

import requests
import json

# Test the webhook endpoint
def test_webhook():
    # Django backend URL - using 127.0.0.1 since that's where Django is running
    base_url = "http://127.0.0.1:8000/api"
    
    # Test data that would come from n8n
    test_webhook_data = {
        "sku": "TEST-123(a)",
        "ebay_title": "Vintage Antique Brass Compass - Professional Navigation Tool",
        "ebay_description": "Beautiful vintage brass compass in excellent condition. Perfect for collectors and navigation enthusiasts. Features include: brass construction, working compass needle, decorative engravings, and original leather case.",
        "condition": "Used - Excellent",
        "ai_improved_estimate": "$75 - $125",
        "ai_improved_description": "Based on market analysis, this vintage brass compass shows strong collector interest. Recent sales of similar items range from $75-125 depending on condition and rarity. The brass construction and working mechanism add significant value.",
        "quantity": 1
    }
    
    print("🧪 Testing Webhook System...")
    print(f"📡 Sending test data to: {base_url}/receive-webhook-data/")
    print(f"📦 Test SKU: {test_webhook_data['sku']}")
    
    try:
        # Send webhook data
        response = requests.post(
            f"{base_url}/receive-webhook-data/",
            json=test_webhook_data,
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"✅ Webhook Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Webhook Data Stored: {result['message']}")
            
            # Now test retrieving the data
            print(f"\n📥 Testing data retrieval for SKU: {test_webhook_data['sku']}")
            
            retrieve_response = requests.get(
                f"{base_url}/get-webhook-data/?sku={test_webhook_data['sku']}",
                headers={'Content-Type': 'application/json'}
            )
            
            if retrieve_response.status_code == 200:
                retrieve_result = retrieve_response.json()
                if retrieve_result['webhook_data']:
                    print("✅ Data Retrieved Successfully!")
                    print(f"   📝 eBay Title: {retrieve_result['webhook_data']['ebay_title']}")
                    print(f"   💰 AI Estimate: {retrieve_result['webhook_data']['ai_improved_estimate']}")
                    print(f"   📊 Condition: {retrieve_result['webhook_data']['condition']}")
                else:
                    print("❌ No webhook data found")
            else:
                print(f"❌ Failed to retrieve data: {retrieve_response.status_code}")
                
        else:
            print(f"❌ Webhook failed: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Make sure Django backend is running on http://127.0.0.1:8000")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    test_webhook()
