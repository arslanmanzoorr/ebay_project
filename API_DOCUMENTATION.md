# Bidsquire API Documentation

Complete API reference for the Bidsquire auction management platform.

**Base URL:** `http://108.181.167.171:3000` (Production)  
**Base URL:** `http://localhost:3000` (Development)

---

## Table of Contents

1. [Authentication](#authentication)
2. [User Management](#user-management)
3. [Credit System](#credit-system)
4. [Auction Items](#auction-items)
5. [Webhook Integration](#webhook-integration)
6. [Health Check](#health-check)

---

## Authentication

### Login

**Endpoint:** `POST /api/auth/login`

Authenticate a user and receive user details.

**Request Body:**
```json
{
  "email": "admin@auctionflow.com",
  "password": "Admin@bids25"
}
```

**Response (200 OK):**
```json
{
  "id": "super-admin-001",
  "name": "Super Administrator",
  "email": "superadmin@auctionflow.com",
  "role": "super_admin",
  "isActive": true,
  "createdAt": "2025-10-16T21:51:04.245Z",
  "updatedAt": "2025-10-16T21:51:04.245Z",
  "avatar": null,
  "createdBy": null
}
```

**cURL Example:**
```bash
curl -X POST http://108.181.167.171:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@auctionflow.com",
    "password": "Admin@bids25"
  }'
```

**Error Responses:**
- `400 Bad Request` - Invalid credentials
- `500 Internal Server Error` - Server error

---

## User Management

### Get All Users

**Endpoint:** `GET /api/users`

Retrieve a list of all users in the system.

**Response (200 OK):**
```json
[
  {
    "id": "super-admin-001",
    "name": "Super Administrator",
    "email": "superadmin@auctionflow.com",
    "role": "super_admin",
    "createdAt": "2025-10-16T21:51:04.245Z",
    "updatedAt": "2025-10-16T21:51:04.245Z",
    "isActive": true,
    "avatar": null,
    "createdBy": null
  }
]
```

**cURL Example:**
```bash
curl -X GET http://108.181.167.171:3000/api/users
```

---

### Create User (Simple)

**Endpoint:** `POST /api/users`

Create a new user with basic information.

**Request Body:**
```json
{
  "name": "New User",
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "role": "researcher",
  "isActive": true
}
```

**Response (201 Created):**
```json
{
  "id": "1761152692856",
  "name": "New User",
  "email": "newuser@example.com",
  "role": "researcher",
  "createdAt": "2025-10-22T17:04:52.856Z",
  "updatedAt": "2025-10-22T17:04:52.856Z",
  "isActive": true,
  "avatar": null,
  "createdBy": null
}
```

**cURL Example:**
```bash
curl -X POST http://108.181.167.171:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New User",
    "email": "newuser@example.com",
    "password": "SecurePass123!",
    "role": "researcher",
    "isActive": true
  }'
```

---

### Create User with Credits (Recommended)

**Endpoint:** `POST /api/users/manage`

Create a new user with automatic credit initialization for admin roles.

**Request Body:**
```json
{
  "userData": {
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "Admin123!",
    "role": "admin",
    "isActive": true
  },
  "createdBy": null
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "id": "user-1761152692856",
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "admin",
    "isActive": true,
    "createdAt": "2025-10-22T17:04:52.856Z",
    "updatedAt": "2025-10-22T17:04:52.856Z",
    "createdBy": null
  }
}
```

**cURL Example:**
```bash
curl -X POST http://108.181.167.171:3000/api/users/manage \
  -H "Content-Type: application/json" \
  -d '{
    "userData": {
      "name": "Admin User",
      "email": "admin@example.com",
      "password": "Admin123!",
      "role": "admin",
      "isActive": true
    },
    "createdBy": null
  }'
```

**Available Roles:**
- `super_admin` - Full system access and user management
- `admin` - Auction item management and workflow oversight
- `researcher` - Item research and initial assessment
- `researcher2` - Secondary research and validation
- `photographer` - Photography and image management

---

### Get Users by Role

**Endpoint:** `GET /api/users/by-role?role={role}`

Retrieve all users with a specific role.

**Query Parameters:**
- `role` (required) - One of: `super_admin`, `admin`, `researcher`, `researcher2`, `photographer`

**Response (200 OK):**
```json
[
  {
    "id": "user-1760653051105",
    "name": "Research 1",
    "email": "researcher@example.com",
    "role": "researcher",
    "isActive": false,
    "createdAt": "2025-10-16T22:17:31.105Z",
    "updatedAt": "2025-10-16T22:17:31.105Z",
    "avatar": null,
    "createdBy": "super-admin-001"
  }
]
```

**cURL Example:**
```bash
curl -X GET "http://108.181.167.171:3000/api/users/by-role?role=researcher"
```

---

### Get User by ID

**Endpoint:** `GET /api/users/{id}`

Retrieve a specific user by their ID.

**Response (200 OK):**
```json
{
  "id": "super-admin-001",
  "name": "Super Administrator",
  "email": "superadmin@auctionflow.com",
  "role": "super_admin",
  "createdAt": "2025-10-16T21:51:04.245Z",
  "updatedAt": "2025-10-16T21:51:04.245Z",
  "isActive": true,
  "avatar": null,
  "createdBy": null
}
```

**cURL Example:**
```bash
curl -X GET http://108.181.167.171:3000/api/users/super-admin-001
```

---

### Get User by Email

**Endpoint:** `GET /api/users/email/{email}`

Retrieve a specific user by their email address.

**Response (200 OK):**
```json
{
  "id": "super-admin-001",
  "name": "Super Administrator",
  "email": "superadmin@auctionflow.com",
  "role": "super_admin",
  "createdAt": "2025-10-16T21:51:04.245Z",
  "updatedAt": "2025-10-16T21:51:04.245Z",
  "isActive": true,
  "avatar": null,
  "createdBy": null
}
```

**cURL Example:**
```bash
curl -X GET http://108.181.167.171:3000/api/users/email/superadmin@auctionflow.com
```

---

### Update User

**Endpoint:** `PUT /api/users/{id}`

Update an existing user's information.

**Request Body:**
```json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "isActive": true
}
```

**Response (200 OK):**
```json
{
  "id": "user-1761152692856",
  "name": "Updated Name",
  "email": "updated@example.com",
  "role": "researcher",
  "createdAt": "2025-10-22T17:04:52.856Z",
  "updatedAt": "2025-10-22T18:30:00.000Z",
  "isActive": true,
  "avatar": null,
  "createdBy": null
}
```

**cURL Example:**
```bash
curl -X PUT http://108.181.167.171:3000/api/users/user-1761152692856 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "isActive": true
  }'
```

---

### Delete User

**Endpoint:** `DELETE /api/users/manage?userId={userId}`

Delete a user from the system (also deletes associated credits).

**Query Parameters:**
- `userId` (required) - The ID of the user to delete

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**cURL Example:**
```bash
curl -X DELETE "http://108.181.167.171:3000/api/users/manage?userId=user-1761152692856"
```

---

## Credit System

### Get Credit Balance

**Endpoint:** `GET /api/credits/balance?userId={userId}`

Retrieve the current credit balance for a specific user.

**Query Parameters:**
- `userId` (required) - The ID of the user

**Response (200 OK):**
```json
{
  "id": "credits-super-admin-001",
  "userId": "super-admin-001",
  "currentCredits": 60,
  "totalPurchased": 60,
  "lastTopupDate": null,
  "createdAt": "2025-10-16T21:51:04.245Z",
  "updatedAt": "2025-10-16T21:51:04.245Z"
}
```

**cURL Example:**
```bash
curl -X GET "http://108.181.167.171:3000/api/credits/balance?userId=super-admin-001"
```

---

### Top Up Credits

**Endpoint:** `POST /api/credits/topup`

Add credits to a user's account.

**Request Body:**
```json
{
  "userId": "super-admin-001",
  "amount": 100,
  "description": "Monthly credit allocation"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Credits topped up successfully",
  "newBalance": 160,
  "transaction": {
    "id": "trans-1761152692856",
    "userId": "super-admin-001",
    "transactionType": "topup",
    "amount": 100,
    "description": "Monthly credit allocation",
    "createdAt": "2025-10-22T17:04:52.856Z"
  }
}
```

**cURL Example:**
```bash
curl -X POST http://108.181.167.171:3000/api/credits/topup \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "super-admin-001",
    "amount": 100,
    "description": "Monthly credit allocation"
  }'
```

---

### Deduct Credits

**Endpoint:** `POST /api/credits/deduct`

Deduct credits from a user's account.

**Request Body:**
```json
{
  "userId": "super-admin-001",
  "amount": 5,
  "description": "Item research completed"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Credits deducted successfully",
  "newBalance": 55,
  "transaction": {
    "id": "trans-1761152692857",
    "userId": "super-admin-001",
    "transactionType": "deduction",
    "amount": -5,
    "description": "Item research completed",
    "createdAt": "2025-10-22T17:05:52.856Z"
  }
}
```

**cURL Example:**
```bash
curl -X POST http://108.181.167.171:3000/api/credits/deduct \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "super-admin-001",
    "amount": 5,
    "description": "Item research completed"
  }'
```

---

### Get Credit Transaction History

**Endpoint:** `GET /api/credits/history?userId={userId}`

Retrieve all credit transactions for a specific user.

**Query Parameters:**
- `userId` (required) - The ID of the user

**Response (200 OK):**
```json
[
  {
    "id": "trans-1761152692856",
    "userId": "super-admin-001",
    "transactionType": "topup",
    "amount": 100,
    "description": "Monthly credit allocation",
    "createdAt": "2025-10-22T17:04:52.856Z"
  },
  {
    "id": "trans-1761152692857",
    "userId": "super-admin-001",
    "transactionType": "deduction",
    "amount": -5,
    "description": "Item research completed",
    "createdAt": "2025-10-22T17:05:52.856Z"
  }
]
```

**cURL Example:**
```bash
curl -X GET "http://108.181.167.171:3000/api/credits/history?userId=super-admin-001"
```

---

### Get Credit Settings

**Endpoint:** `GET /api/credits/settings`

Retrieve current credit cost settings for various operations.

**Response (200 OK):**
```json
[
  {
    "id": "setting-1",
    "settingName": "hibid_search",
    "settingValue": 1,
    "description": "Credits deducted for HiBid search",
    "updatedBy": "super-admin-001",
    "updatedAt": "2025-10-16T21:51:04.245Z"
  },
  {
    "id": "setting-2",
    "settingName": "researcher2_stage",
    "settingValue": 2,
    "description": "Credits deducted for Researcher 2 stage",
    "updatedBy": "super-admin-001",
    "updatedAt": "2025-10-16T21:51:04.245Z"
  }
]
```

**cURL Example:**
```bash
curl -X GET http://108.181.167.171:3000/api/credits/settings
```

---

### Update Credit Settings

**Endpoint:** `PUT /api/credits/settings`

Update credit cost settings (requires admin privileges).

**Request Body:**
```json
{
  "settingName": "hibid_search",
  "settingValue": 2,
  "updatedBy": "super-admin-001"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Credit settings updated successfully",
  "setting": {
    "id": "setting-1",
    "settingName": "hibid_search",
    "settingValue": 2,
    "description": "Credits deducted for HiBid search",
    "updatedBy": "super-admin-001",
    "updatedAt": "2025-10-22T17:10:00.000Z"
  }
}
```

**cURL Example:**
```bash
curl -X PUT http://108.181.167.171:3000/api/credits/settings \
  -H "Content-Type: application/json" \
  -d '{
    "settingName": "hibid_search",
    "settingValue": 2,
    "updatedBy": "super-admin-001"
  }'
```

**Available Settings:**
- `hibid_search` - Credits for HiBid search (default: 1)
- `researcher2_stage` - Credits for Researcher 2 stage (default: 2)

---

## Auction Items

### Get All Auction Items

**Endpoint:** `GET /api/auction-items`

Retrieve all auction items in the system.

**Response (200 OK):**
```json
[
  {
    "id": "item-1761152692856",
    "url": "https://hibid.com/lot/123456",
    "urlMain": "https://hibid.com/lot/123456",
    "auctionName": "Estate Auction",
    "lotNumber": "123",
    "images": ["image1.jpg", "image2.jpg"],
    "mainImageUrl": "main.jpg",
    "sku": "SKU-001",
    "itemName": "Antique Vase",
    "category": "Antiques",
    "description": "Beautiful antique vase from 1920s",
    "lead": "Rare find",
    "auctionSiteEstimate": "$100-$200",
    "aiDescription": "AI-generated description",
    "aiEstimate": "$150",
    "status": "research",
    "researcherEstimate": null,
    "researcherDescription": null,
    "referenceUrls": [],
    "similarUrls": [],
    "photographerQuantity": 1,
    "photographerImages": [],
    "isMultipleItems": false,
    "multipleItemsCount": 1,
    "finalData": null,
    "createdAt": "2025-10-22T17:04:52.856Z",
    "updatedAt": "2025-10-22T17:04:52.856Z",
    "assignedTo": "researcher",
    "notes": null,
    "photographerNotes": null,
    "researcherNotes": null,
    "researcher2Notes": null,
    "priority": "medium",
    "tags": [],
    "parentItemId": null,
    "subItemNumber": null,
    "adminId": "admin-auctionflow-001"
  }
]
```

**cURL Example:**
```bash
curl -X GET http://108.181.167.171:3000/api/auction-items
```

---

### Create Auction Item

**Endpoint:** `POST /api/auction-items`

Create a new auction item.

**Request Body:**
```json
{
  "url": "https://hibid.com/lot/123456",
  "auctionName": "Estate Auction",
  "lotNumber": "123",
  "itemName": "Antique Vase",
  "category": "Antiques",
  "description": "Beautiful antique vase",
  "adminId": "admin-auctionflow-001",
  "status": "research",
  "assignedTo": "researcher",
  "priority": "medium"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Auction item created successfully",
  "item": {
    "id": "item-1761152692856",
    "url": "https://hibid.com/lot/123456",
    "itemName": "Antique Vase",
    "status": "research",
    "createdAt": "2025-10-22T17:04:52.856Z"
  }
}
```

**cURL Example:**
```bash
curl -X POST http://108.181.167.171:3000/api/auction-items \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://hibid.com/lot/123456",
    "auctionName": "Estate Auction",
    "lotNumber": "123",
    "itemName": "Antique Vase",
    "category": "Antiques",
    "description": "Beautiful antique vase",
    "adminId": "admin-auctionflow-001",
    "status": "research",
    "assignedTo": "researcher",
    "priority": "medium"
  }'
```

**Item Status Values:**
- `research` - Assigned to Researcher 1
- `research2` - Assigned to Researcher 2
- `photography` - Assigned to Photographer
- `admin_review` - Final admin review
- `completed` - Item finalized

**Priority Values:**
- `low` - Low priority
- `medium` - Medium priority
- `high` - High priority

---

## Webhook Integration

### Receive Webhook Data

**Endpoint:** `POST /api/webhook/receive`

Receive and process webhook data from external auction platforms.

**Request Body:**
```json
{
  "url_main": "https://hibid.com/lot/123456",
  "item_name": "Antique Vase",
  "lot_number": "123",
  "description": "Beautiful antique vase from 1920s",
  "lead": "Rare find",
  "category": "Antiques",
  "estimate": "$100-$200",
  "auction_name": "Estate Auction",
  "all_unique_image_urls": ["image1.jpg", "image2.jpg"],
  "main_image_url": "main.jpg",
  "gallery_image_urls": ["gallery1.jpg"],
  "broad_search_images": ["search1.jpg"],
  "tumbnail_images": ["thumb1.jpg"],
  "ai_response": "AI-generated analysis"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Webhook data received and processed successfully",
  "dataId": "webhook-1761152692856"
}
```

**cURL Example:**
```bash
curl -X POST http://108.181.167.171:3000/api/webhook/receive \
  -H "Content-Type: application/json" \
  -d '{
    "url_main": "https://hibid.com/lot/123456",
    "item_name": "Antique Vase",
    "lot_number": "123",
    "description": "Beautiful antique vase",
    "category": "Antiques",
    "estimate": "$100-$200",
    "auction_name": "Estate Auction"
  }'
```

---

### Send Researcher Progression

**Endpoint:** `POST /api/webhook/send-researcher-progression`

Send researcher progression data to external systems.

**Request Body:**
```json
{
  "itemId": "item-1761152692856",
  "status": "research2",
  "researchData": {
    "estimate": "$150",
    "description": "Detailed research findings",
    "similarUrls": ["https://example.com/similar1", "https://example.com/similar2"]
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Researcher progression sent successfully"
}
```

**cURL Example:**
```bash
curl -X POST http://108.181.167.171:3000/api/webhook/send-researcher-progression \
  -H "Content-Type: application/json" \
  -d '{
    "itemId": "item-1761152692856",
    "status": "research2",
    "researchData": {
      "estimate": "$150",
      "description": "Detailed research findings"
    }
  }'
```

---

## Health Check

### System Health

**Endpoint:** `GET /api/health`

Check the health status of the API and database connection.

**Response (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2025-10-22T17:04:52.856Z",
  "database": "connected",
  "version": "2.0"
}
```

**cURL Example:**
```bash
curl -X GET http://108.181.167.171:3000/api/health
```

---

## System Reset (Development Only)

### Reset System Data

**Endpoint:** `POST /api/system/reset`

Reset all system data (use with caution - development only).

**Response (200 OK):**
```json
{
  "success": true,
  "message": "System reset successfully"
}
```

**cURL Example:**
```bash
curl -X POST http://108.181.167.171:3000/api/system/reset
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "Invalid input parameters"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred",
  "details": "Detailed error message"
}
```

---

## Rate Limiting

Currently, there are no rate limits enforced on the API endpoints. However, it is recommended to implement appropriate retry logic and error handling in your integrations.

---

## Authentication & Authorization

Most endpoints require authentication. The authentication system uses session-based authentication with the following roles:

- **super_admin** - Full system access
- **admin** - Auction management and user oversight
- **researcher** - Item research capabilities
- **researcher2** - Secondary research and validation
- **photographer** - Photography and image management

---

## Webhooks

The system supports webhook integration for:
1. Receiving auction item data from external platforms
2. Sending researcher progression updates
3. Real-time status updates

Configure webhook endpoints in your admin dashboard.

---

## Support

For API support, please contact:
- Email: support@bidsquire.com
- Documentation: https://docs.bidsquire.com

---

**Last Updated:** October 22, 2025  
**API Version:** 2.0

