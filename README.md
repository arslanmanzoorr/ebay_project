# eBay Auction Management Platform

A comprehensive auction management system with role-based access control, credit management, and automated workflow processing.

## 🚀 Features

### **User Management & Roles**
- **Super Admin**: Complete system control, user management, credit administration
- **Admin**: Photographer management, item processing, credit monitoring
- **Photographer**: Image upload and item photography
- **Researcher 1 & 2**: Item research and analysis

### **Credit System**
- **Configurable Pricing**: Super Admin can set credit costs for different actions
- **Automatic Deduction**: Credits deducted for item fetching and research2 completion
- **Credit Rollover**: Credits never expire, accumulate over time
- **Low Balance Warnings**: Alerts when credits ≤ 10
- **Transaction History**: Complete audit trail of all credit transactions

### **Workflow Management**
- **Automated Processing**: Items flow through research → photography → research2 → admin review → finalized
- **Role-based Assignment**: Automatic assignment to appropriate roles
- **Status Tracking**: Real-time status updates and notifications
- **Admin Review Stage**: Items require admin approval before finalization

### **Item Management**
- **Webhook Integration**: Automatic item import from auction sites via n8n
- **Manual Item Creation**: Admins can create items manually
- **Sub-item Support**: Create multiple items from single lots
- **Image Management**: Comprehensive image upload and display
- **Notes System**: Role-specific notes and comments

## 🏗️ Architecture

### **Database Schema**
- **Users Table**: User accounts with role-based permissions
- **Auction Items**: Complete item data with workflow status
- **User Credits**: Credit balances and transaction history
- **Credit Settings**: Configurable pricing for different actions
- **Workflow Steps**: Audit trail of status changes
- **Notifications**: User notifications and alerts

### **API Endpoints**
- **Authentication**: `/api/auth/login`
- **User Management**: `/api/users/manage`, `/api/users/by-role`, `/api/users/photographers`
- **Credit Management**: `/api/credits/topup`, `/api/credits/balance`, `/api/credits/transactions`, `/api/credits/settings`
- **Auction Items**: `/api/auction-items`
- **Webhook Processing**: `/api/webhook/receive`

## 🔧 Installation & Setup

### **Prerequisites**
- Node.js 18+
- PostgreSQL 14+
- Docker & Docker Compose

### **Quick Start**
```bash
# Clone the repository
git clone <repository-url>
cd ebay_project

# Start database
docker-compose up -d

# Install dependencies
cd project
npm install

# Start development server
npm run dev
```

### **Database Setup**
The system automatically creates all necessary tables and initializes:
- Super Admin user: `superadmin@auctionflow.com` / `SuperAdmin@2024!`
- Default Admin user: `admin@auctionflow.com` / `Admin@bids25`
- Credit settings: 1 credit per fetch, 2 credits per research2
- All admins start with 60 credits

## 👥 User Roles & Permissions

### **Super Admin**
- **Access**: `/super-admin`
- **Permissions**:
  - Manage all users (admins, photographers, researchers)
  - Configure credit pricing
  - Top up admin credits
  - View all credit transactions
  - System-wide administration

### **Admin**
- **Access**: `/admin`
- **Permissions**:
  - Manage photographers (create, delete, view)
  - Process auction items
  - Monitor credit balance
  - Create manual items
  - Review items in admin_review status
  - Create eBay draft listings

### **Photographer**
- **Access**: `/photographer`
- **Permissions**:
  - Upload images for assigned items
  - Update item photography status
  - Create sub-items from parent items
  - Add photographer notes

### **Researcher 1**
- **Access**: `/researcher`
- **Permissions**:
  - Research assigned items
  - Add research notes and estimates
  - Move items to next stage

### **Researcher 2**
- **Access**: `/researcher2`
- **Permissions**:
  - Final research and validation
  - Add final research notes
  - Move items to admin review

## 💳 Credit System

### **Credit Costs**
- **Item Fetch**: 1 credit (configurable)
- **Research2 Completion**: 2 credits (configurable)

### **Credit Management**
- **Super Admin**: Can top up credits for any admin
- **Admins**: Can view their credit balance and transaction history
- **Low Balance Warning**: Alert when credits ≤ 10
- **Credit Rollover**: Credits never expire

### **Credit API**
```bash
# Get credit balance
GET /api/credits/balance?userId={userId}

# Top up credits (Super Admin only)
POST /api/credits/topup
{
  "userId": "admin-id",
  "amount": 100,
  "description": "Monthly top-up"
}

# Get transaction history
GET /api/credits/transactions?userId={userId}

# Update credit settings (Super Admin only)
PUT /api/credits/settings
{
  "settings": {
    "item_fetch_cost": 1,
    "research2_cost": 2
  },
  "updatedBy": "super-admin-id"
}
```

## 🔄 Workflow Process

1. **Item Fetch**: Admin submits URL → n8n processes → Credits deducted → Item created
2. **Research**: Researcher 1 analyzes item → Adds notes → Moves to photography
3. **Photography**: Photographer uploads images → Creates sub-items if needed
4. **Research2**: Researcher 2 final validation → Credits deducted → Moves to admin review
5. **Admin Review**: Admin reviews → Creates eBay draft → Finalizes item

## 🛠️ Development

### **Project Structure**
```
project/
├── app/                    # Next.js app router pages
│   ├── admin/             # Admin dashboard
│   ├── super-admin/       # Super Admin dashboard
│   ├── photographer/      # Photographer dashboard
│   ├── researcher/        # Researcher 1 dashboard
│   ├── researcher2/       # Researcher 2 dashboard
│   └── profile/           # User profile management
├── components/            # Reusable UI components
├── contexts/              # React contexts (Auth, etc.)
├── pages/api/             # API routes
│   ├── auth/              # Authentication endpoints
│   ├── credits/           # Credit management endpoints
│   ├── users/             # User management endpoints
│   └── auction-items/     # Item management endpoints
├── services/              # Business logic services
│   ├── database.ts        # Database operations
│   └── dataStore.ts       # Application state management
└── types/                 # TypeScript type definitions
```

### **Key Services**
- **DatabaseService**: PostgreSQL operations and credit management
- **DataStore**: Application state, workflow management, API integration
- **AuthContext**: User authentication and role management

## 🔒 Security Features

- **Role-based Access Control**: Strict permission system
- **Credit Validation**: Prevents unauthorized operations
- **Audit Trail**: Complete transaction and workflow logging
- **Input Validation**: Comprehensive data validation
- **SQL Injection Protection**: Parameterized queries

## 📊 Monitoring & Logging

- **Credit Transactions**: All credit operations logged
- **Workflow Steps**: Complete audit trail of status changes
- **User Actions**: Role-based action logging
- **Error Handling**: Comprehensive error logging and user feedback

## 🚀 Deployment

### **Production Deployment**
```bash
# Build for production
npm run build

# Start production server
npm start

# Or use PM2
pm2 start npm --name "auctionflow" -- start
```

### **Docker Deployment**
```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d

# Development deployment
docker-compose -f docker-compose.dev.yml up -d
```

## 🔧 Configuration

### **Environment Variables**
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/auctionflow
DB_HOST=localhost
DB_PORT=5432
DB_NAME=auctionflow
DB_USER=auctionuser
DB_PASSWORD=your_password

# Application
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://localhost:3000
```

### **Credit Settings**
Default credit settings can be modified by Super Admin:
- `item_fetch_cost`: Credits deducted per item fetch (default: 1)
- `research2_cost`: Credits deducted for research2 completion (default: 2)

## 📈 Performance

- **Database Indexing**: Optimized queries with proper indexes
- **Connection Pooling**: Efficient database connections
- **Caching**: Local state management for improved performance
- **Lazy Loading**: Components loaded on demand

## 🐛 Troubleshooting

### **Common Issues**
1. **Credit Deduction Fails**: Check admin has sufficient credits
2. **User Creation Fails**: Verify email uniqueness and role permissions
3. **Database Connection**: Ensure PostgreSQL is running and accessible
4. **Webhook Processing**: Check n8n integration and data format

### **Logs**
- Check browser console for frontend errors
- Check server logs for API errors
- Check database logs for connection issues

## 📝 Changelog

### **Version 2.0.0** - Credit System & User Hierarchy
- ✅ Implemented comprehensive credit management system
- ✅ Added Super Admin role with full system control
- ✅ Restricted Admin role to photographer management only
- ✅ Added configurable credit pricing
- ✅ Implemented credit rollover (no expiration)
- ✅ Added low balance warnings
- ✅ Created complete audit trail for all transactions
- ✅ Integrated credit deduction with workflow
- ✅ Added admin review stage in workflow
- ✅ Enhanced user management with role-based permissions

### **Version 1.0.0** - Initial Release
- ✅ Basic auction item management
- ✅ Role-based user system
- ✅ Webhook integration with n8n
- ✅ Image upload and management
- ✅ Workflow status tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation and troubleshooting guide

---

**Built with ❤️ for efficient auction management**
