from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import WebhookData, AuctionItem
import requests
import json
import base64
import time
import string

@api_view(['GET'])
def hello_world(request):
    return Response({
        'message': 'Hello from Django REST Framework!',
        'status': 'success'
    }, status=status.HTTP_200_OK)

@api_view(['POST'])
def test_post(request):
    data = request.data
    return Response({
        'message': 'Data received successfully!',
        'received_data': data,
        'status': 'success'
    }, status=status.HTTP_200_OK)

@api_view(['POST'])
def call_webhook(request):
    try:
        url_main = request.data.get('url_main')
        
        if not url_main:
            return Response({
                'error': 'url_main parameter is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Webhook URL
        webhook_url = "https://sorcer.app.n8n.cloud/webhook/789023dc-a9bf-459c-8789-d9d0c993d1cb"
        
        # Prepare the payload
        payload = {
            'url_main': url_main
        }
        
        # Make the request to the webhook
        response = requests.post(webhook_url, json=payload)
        
        # Log the response
        print("Webhook Response Status:", response.status_code)
        print("Webhook Response Headers:", dict(response.headers))
        print("Webhook Response Body:", response.text)
        
        # Try to parse JSON response
        try:
            response_data = response.json()
            print("Webhook JSON Response:", json.dumps(response_data, indent=2))
        except json.JSONDecodeError:
            print("Webhook response is not JSON:", response.text)
            response_data = {'raw_response': response.text}
        
        return Response({
            'message': 'Webhook called successfully',
            'webhook_status': response.status_code,
            'webhook_response': response_data,
            'status': 'success'
        }, status=status.HTTP_200_OK)
        
    except requests.RequestException as e:
        print("Webhook request failed:", str(e))
        return Response({
            'error': f'Webhook request failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        print("Unexpected error:", str(e))
        return Response({
            'error': f'Unexpected error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def submit_photography(request):
    try:
        # Extract all required parameters from request
        auction_name = request.data.get('auction_name', '')
        item_name = request.data.get('item_name', '')
        lot_number = request.data.get('lot_number', '')
        description = request.data.get('description', '')
        lead = request.data.get('lead', '')
        first_estimate = request.data.get('first_estimate', '')
        category = request.data.get('category', '')
        previous_ai_estimate = request.data.get('previous_ai_estimate', '')
        previous_ai_description = request.data.get('previous_ai_description', '')
        human_researcher_estimate = request.data.get('human_researcher_estimate', '')
        human_researcher_description = request.data.get('human_researcher_description', '')
        human_researcher_supporting_links = request.data.get('human_researcher_supporting_links', [])
        quantity = int(request.data.get('quantity', 1))
        photos = request.data.get('photos', [])

        # Webhook URL for photography submission
        webhook_url = "https://sorcer.app.n8n.cloud/webhook/0be48928-c40c-4e16-a9f1-1e2fdf9ed9d2"

        # Generate SKU prefix from first letter of each of the first 3 words of auction_name and lot_number
        auction_words = [w for w in auction_name.split() if w.isalpha()]
        sku_prefix = ''.join([w[0].upper() for w in auction_words[:3]])
        sku_base = f"{sku_prefix}-{lot_number}"

        # Prepare responses
        webhook_responses = []
        research2_items = []
        for i in range(quantity):
            sku = f"{sku_base}({string.ascii_lowercase[i]})"
            payload = {
                'auction_name': auction_name,
                'item_name': item_name,
                'lot_number': lot_number,
                'description': description,
                'lead': lead,
                'first_estimate': first_estimate,
                'category': category,
                'previous_ai_estimate': previous_ai_estimate,
                'previous_ai_description': previous_ai_description,
                'human_researcher_estimate': human_researcher_estimate,
                'human_researcher_description': human_researcher_description,
                'human_researcher_supporting_links': human_researcher_supporting_links,
                'quantity': 1,
                'sku': sku,
                'photos': photos
            }
            response = requests.post(webhook_url, json=payload)
            print(f"Photography Webhook Call {i+1}/{quantity} - SKU: {sku}")
            print("Status:", response.status_code)
            print("Body:", response.text)
            try:
                response_data = response.json()
            except json.JSONDecodeError:
                response_data = {'raw_response': response.text}
            webhook_responses.append({
                'sku': sku,
                'status': response.status_code,
                'response': response_data
            })
            # Create research2 item for frontend
            research2_item = {
                'id': f'{sku}-{int(time.time())}',
                'sku': sku,
                'auctionName': auction_name,
                'itemName': item_name,
                'lotNumber': lot_number,
                'description': description,
                'lead': lead,
                'auctionSiteEstimate': first_estimate,
                'category': category,
                'aiEstimate': previous_ai_estimate,
                'aiDescription': previous_ai_description,
                'researcherEstimate': human_researcher_estimate,
                'researcherDescription': human_researcher_description,
                'referenceUrls': human_researcher_supporting_links,
                'photographerQuantity': 1,
                'photographerImages': photos,
                'status': 'research2',
                'webhookResponse': response_data,
                'createdAt': int(time.time())
            }
            research2_items.append(research2_item)
            if i < quantity - 1:
                time.sleep(10)

        return Response({
            'message': f'Photography webhook called {quantity} times',
            'webhook_responses': webhook_responses,
            'research2_items': research2_items,
            'status': 'success'
        }, status=status.HTTP_200_OK)

    except requests.RequestException as e:
        print("Photography webhook request failed:", str(e))
        return Response({
            'error': f'Photography webhook request failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        print("Photography unexpected error:", str(e))
        return Response({
            'error': f'Photography unexpected error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def receive_webhook_data(request):
    """
    Receive webhook data from n8n workflow and store it for Researcher 2
    """
    try:
        data = request.data
        print("Received webhook data:", json.dumps(data, indent=2))
        
        # Extract the key information from the webhook
        sku = data.get('sku')
        if not sku:
            return Response({
                'error': 'sku is required in webhook data'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if webhook data already exists for this SKU
        webhook_data, created = WebhookData.objects.get_or_create(
            sku=sku,
            defaults={
                'ebay_title': data.get('ebay_title', ''),
                'ebay_description': data.get('ebay_description', ''),
                'condition': data.get('condition', ''),
                'ai_improved_estimate': data.get('ai_improved_estimate', ''),
                'ai_improved_description': data.get('ai_improved_description', ''),
                'quantity': data.get('quantity', 1),
                'raw_data': data
            }
        )
        
        if not created:
            # Update existing record
            webhook_data.ebay_title = data.get('ebay_title', webhook_data.ebay_title)
            webhook_data.ebay_description = data.get('ebay_description', webhook_data.ebay_description)
            webhook_data.condition = data.get('condition', webhook_data.condition)
            webhook_data.ai_improved_estimate = data.get('ai_improved_estimate', webhook_data.ai_improved_estimate)
            webhook_data.ai_improved_description = data.get('ai_improved_description', webhook_data.ai_improved_description)
            webhook_data.quantity = data.get('quantity', webhook_data.quantity)
            webhook_data.raw_data = data
            webhook_data.save()
        
        return Response({
            'message': 'Webhook data received and stored successfully',
            'webhook_data': {
                'sku': webhook_data.sku,
                'ebay_title': webhook_data.ebay_title,
                'ebay_description': webhook_data.ebay_description,
                'condition': webhook_data.condition,
                'ai_improved_estimate': webhook_data.ai_improved_estimate,
                'ai_improved_description': webhook_data.ai_improved_description,
                'quantity': webhook_data.quantity,
                'received_at': webhook_data.received_at.isoformat()
            },
            'status': 'success'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print("Error processing webhook data:", str(e))
        return Response({
            'error': f'Error processing webhook data: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_webhook_data(request):
    """
    Get webhook data for a specific SKU
    """
    try:
        sku = request.query_params.get('sku')
        if not sku:
            return Response({
                'error': 'sku parameter is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            webhook_data = WebhookData.objects.get(sku=sku)
            return Response({
                'message': 'Webhook data retrieved successfully',
                'webhook_data': {
                    'sku': webhook_data.sku,
                    'ebay_title': webhook_data.ebay_title,
                    'ebay_description': webhook_data.ebay_description,
                    'condition': webhook_data.condition,
                    'ai_improved_estimate': webhook_data.ai_improved_estimate,
                    'ai_improved_description': webhook_data.ai_improved_description,
                    'quantity': webhook_data.quantity,
                    'received_at': webhook_data.received_at.isoformat()
                },
                'status': 'success'
            }, status=status.HTTP_200_OK)
        except WebhookData.DoesNotExist:
            return Response({
                'message': 'No webhook data found for this SKU',
                'webhook_data': None,
                'status': 'success'
            }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print("Error retrieving webhook data:", str(e))
        return Response({
            'error': f'Error retrieving webhook data: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR) 