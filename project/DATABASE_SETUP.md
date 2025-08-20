# Database Setup Guide

This guide will help you set up PostgreSQL for the eBay Project application.

## Prerequisites

1. **PostgreSQL installed and running** on your system
2. **Node.js** installed (for running setup scripts)
3. **npm** or **yarn** package manager

## Quick Setup

### 1. Install Dependencies

```bash
cd project
npm install pg @types/pg
```

### 2. Set Up Environment Variables

Copy the environment template and update it with your database credentials:

```bash
cp env.local.template .env.local
```

Edit `.env.local` and update the database configuration:

```env
# Database Configuration
NEXT_PUBLIC_DB_HOST=localhost
NEXT_PUBLIC_DB_PORT=5432
NEXT_PUBLIC_DB_NAME=ebay_project
NEXT_PUBLIC_DB_USER=postgres
NEXT_PUBLIC_DB_PASSWORD=your_password_here

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 3. Run Database Setup Script

```bash
# Set environment variables for the script
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=ebay_project
export DB_USER=postgres
export DB_PASSWORD=your_password_here

# Run the setup script
node scripts/setup-database.js
```

Or on Windows:

```cmd
set DB_HOST=localhost
set DB_PORT=5432
set DB_NAME=ebay_project
set DB_USER=postgres
set DB_PASSWORD=your_password_here

node scripts/setup-database.js
```

### 4. Start the Application

```bash
npm run dev
```

## Manual Setup

If you prefer to set up the database manually:

### 1. Create Database

```sql
CREATE DATABASE ebay_project;
```

### 2. Create Tables

Run the SQL commands from `scripts/setup-database.js` manually in your PostgreSQL client.

### 3. Create Admin User

```sql
INSERT INTO users (id, name, email, password, role, is_active)
VALUES (
  'admin-001',
  'Admin User',
  'admin@example.com',
  'admin123',
  'admin',
  true
);
```

## Default Login Credentials

After setup, you can login with:

- **Email:** admin@example.com
- **Password:** admin123

## Troubleshooting

### Connection Issues

1. **Check if PostgreSQL is running:**
   ```bash
   # On Linux/Mac
   sudo systemctl status postgresql
   
   # On Windows
   # Check Services app for PostgreSQL service
   ```

2. **Verify connection details:**
   - Host: Usually `localhost` or `127.0.0.1`
   - Port: Default is `5432`
   - Username: Usually `postgres`
   - Password: The password you set during PostgreSQL installation

3. **Test connection manually:**
   ```bash
   psql -h localhost -U postgres -d ebay_project
   ```

### Permission Issues

If you get permission errors:

1. **Grant database creation permission:**
   ```sql
   ALTER USER postgres CREATEDB;
   ```

2. **Check user permissions:**
   ```sql
   \du postgres
   ```

### Port Already in Use

If port 5432 is already in use:

1. **Find what's using the port:**
   ```bash
   # On Linux/Mac
   sudo lsof -i :5432
   
   # On Windows
   netstat -ano | findstr :5432
   ```

2. **Change PostgreSQL port** in `postgresql.conf`:
   ```
   port = 5433
   ```

3. **Update your environment variables** accordingly.

## Database Schema

The application creates the following tables:

- **users** - User accounts and authentication
- **auction_items** - Auction items and their workflow status
- **workflow_steps** - History of status changes
- **notifications** - User notifications
- **webhook_data** - Data received from n8n webhooks

## Data Persistence

- **With Database:** All data is stored in PostgreSQL and persists across application restarts
- **Without Database:** Data is stored in browser localStorage (temporary, not recommended for production)

## Production Considerations

1. **Use strong passwords** for database users
2. **Enable SSL connections** for remote databases
3. **Set up database backups**
4. **Use connection pooling** for better performance
5. **Monitor database performance**

## Support

If you encounter issues:

1. Check the console logs for error messages
2. Verify your database connection settings
3. Ensure PostgreSQL is running and accessible
4. Check the troubleshooting section above
