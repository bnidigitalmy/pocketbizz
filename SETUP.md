# 🚀 PocketBizz - Setup & Running Guide

## Prerequisites
- Node.js 18+ installed
- PostgreSQL database (Neon recommended)
- npm or yarn

## Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```
✅ **DONE** - 540 packages installed

### 2. Database Setup

#### Option A: Neon Serverless (Recommended)
1. Go to https://console.neon.tech
2. Create a new project
3. Copy the connection string
4. It looks like: `postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`

#### Option B: Local PostgreSQL
1. Install PostgreSQL locally
2. Create a database: `createdb pocketbizz`
3. Connection string: `postgresql://localhost/pocketbizz`

### 3. Environment Configuration

Create `.env` file in root directory:

```env
# Required
DATABASE_URL=postgresql://your-connection-string-here
SESSION_SECRET=your-random-secret-key-min-32-chars

# Optional
PORT=5000
NODE_ENV=development
```

### 4. Database Migration

Run Drizzle migrations to create tables:

```bash
npm run db:push
```

This will create all 30+ tables in your database.

### 5. Run Development Server

#### For Windows (PowerShell):
```powershell
$env:NODE_ENV="development"
npx tsx server/index.ts
```

#### For Linux/Mac:
```bash
npm run dev
```

### 6. Access Application

Open browser and go to:
- **Frontend**: http://localhost:5000
- **API**: http://localhost:5000/api/*

## 🎯 Default First User

After running, register a new account at:
- http://localhost:5000/auth/register

First registered user gets **7-day free trial**.

## 📁 Project Structure

```
PocketBizz/
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared types & schema
├── migrations/      # Database migrations
└── .env            # Environment variables (create this)
```

## 🔧 Available Scripts

```bash
npm run dev      # Development server (Linux/Mac)
npm run build    # Build for production
npm run start    # Production server
npm run db:push  # Run database migrations
npm run check    # TypeScript type checking
```

## 🐛 Troubleshooting

### Error: "DATABASE_URL must be set"
- Create `.env` file with DATABASE_URL

### Error: "NODE_ENV is not recognized" (Windows)
- Use PowerShell: `$env:NODE_ENV="development"`
- Or use: `npx tsx server/index.ts` directly

### Port 5000 already in use
- Change PORT in .env file
- Or kill existing process

### Database connection failed
- Verify DATABASE_URL is correct
- Check internet connection (for Neon)
- Ensure PostgreSQL is running (for local)

## 🎨 Features Overview

### Core Modules
- 📊 Dashboard with real-time stats
- 🏪 Stock & Inventory Management
- 🎂 Product & Recipe Builder
- 🏭 Production Planning (FIFO)
- 🚚 Delivery & Consignment Tracking
- 💰 POS (Point of Sale) System
- 👥 Customer & Loyalty Program
- 📱 Broadcast Messaging (WhatsApp/SMS/Email)
- 🤝 Reseller/Agent Network
- 💳 Subscription & Billing (ToyyibPay)
- 📈 Reports & Analytics
- ⚙️ Settings & Business Profile

### Advanced Features
- Unit conversion system
- FIFO batch tracking
- Automatic profit calculation
- Multi-tier pricing for resellers
- Commission management
- Google Drive auto-sync
- PDF invoice generation
- PWA support
- Dark mode

## 📞 Support

For issues or questions:
- Check existing code comments
- Review `replit.md` for full documentation
- Review `design_guidelines.md` for UI/UX specs

## 🔐 Security Notes

⚠️ **IMPORTANT for Production:**
- Change SESSION_SECRET to a strong random string
- Use strong passwords
- Enable HTTPS
- Configure CORS properly
- Set secure cookie settings
- Keep dependencies updated

## 🚀 Deployment

The app is designed for:
- Railway
- Replit
- Vercel (with PostgreSQL)
- Any Node.js hosting with PostgreSQL

Build command: `npm run build`
Start command: `npm run start`

---

**Happy Coding! 🎉**
