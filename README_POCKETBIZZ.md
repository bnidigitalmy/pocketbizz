# 🥐 PocketBizz - Smart Bakery Management System

**Empowering Malaysian Bakeries with Digital Excellence**

[![Built with React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Express.js](https://img.shields.io/badge/Express-4.21-green.svg)](https://expressjs.com/)
[![Neon Database](https://img.shields.io/badge/Database-Neon-blue.svg)](https://neon.tech/)
[![Security](https://img.shields.io/badge/Security-8%2F10-green.svg)](#security)

---

## 🎯 What is PocketBizz?

PocketBizz is a comprehensive, cloud-based management system specifically designed for Malaysian bakeries and SME food businesses. From inventory tracking to customer management, delivery coordination to financial reporting - all in one powerful platform.

### 🌟 Key Features

#### 📦 **Inventory Management**
- Real-time stock tracking with low-stock alerts
- Multi-unit conversion system (kg, g, pieces, boxes, packs)
- Ingredient-level tracking
- Production batch management
- Expiry date tracking

#### 💰 **Sales & Financial**
- Point of Sale (POS) system
- Invoice generation with WhatsApp integration
- Multiple payment methods
- Profit/loss tracking
- Daily/weekly/monthly reports
- Early bird tracking & rewards

#### 🚚 **Delivery & Logistics**
- Delivery scheduling & tracking
- Route optimization
- Driver assignment
- Proof of delivery
- Customer delivery history

#### 👥 **Customer Management**
- Customer database with purchase history
- Loyalty points system
- Voucher management
- Promo code campaigns
- Customer segmentation
- WhatsApp broadcast messaging

#### 📊 **Analytics & Reports**
- Sales trend analysis
- Product performance metrics
- Vendor performance leaderboard
- Agent/reseller tracking
- Monthly financial summaries
- Goal tracking & progress

#### 🎯 **Production Planning**
- Recipe management
- Batch production tracking
- Ingredient consumption calculator
- Production cost analysis
- Wastage tracking

#### 💳 **Payment Integration**
- ToyyibPay integration (Malaysian payment gateway)
- Subscription billing
- Split payment support
- Payment history & receipts

#### ☁️ **Cloud Storage**
- Google Drive integration
- Auto-backup
- Document management
- Receipt storage

---

## 🏗️ Technical Architecture

### **Frontend**
- **Framework**: React 18.3 + Vite
- **Language**: TypeScript
- **UI Library**: Shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Animation**: Framer Motion

### **Backend**
- **Runtime**: Node.js
- **Framework**: Express.js 4.21
- **Language**: TypeScript
- **ORM**: Drizzle ORM
- **Authentication**: Session-based (express-session)
- **Password Hashing**: bcrypt (cost factor 12)

### **Database**
- **Provider**: Neon Serverless PostgreSQL
- **Region**: Singapore (ap-southeast-1)
- **Tables**: 38 tables
- **Features**: Connection pooling, auto-backup, point-in-time recovery

### **Security**
- **Headers**: Helmet.js with CSP
- **CORS**: Origin whitelist protection
- **Rate Limiting**: 100 req/15min (global), 5 req/15min (auth)
- **Input Validation**: Zod schemas + sanitization
- **Session**: Secure cookies with SameSite
- **Password Policy**: 8+ chars, mixed case, numbers, special characters
- **Security Rating**: 8/10

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (or Neon account)
- npm or yarn

### Installation

```bash
# Clone repository
git clone https://github.com/bnidigitalmy/pocketbizz.git
cd pocketbizz

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npm run db:push

# Create admin account
node create-admin.js

# Start development server
npm run dev
```

Server will start on `http://localhost:5000`

### Default Admin Credentials
```
Email: admin@fiqbakery.com
Password: Admin@123456
```
⚠️ **Change password after first login!**

---

## 📋 Database Schema

### Core Tables (38 total)
- `users` - User accounts & authentication
- `business_profile` - Business information
- `products` - Product catalog
- `categories` - Product categorization
- `ingredients` - Raw materials
- `stock_items` - Inventory tracking
- `production_batches` - Production management
- `sales` / `sales_items` - Sales transactions
- `customers` - Customer database
- `deliveries` / `delivery_items` - Delivery tracking
- `resellers` - Agent/reseller management
- `vendors` - Supplier management
- `expenses` - Expense tracking
- `bookings` / `booking_items` - Pre-orders
- `promo_codes` / `promo_code_usage` - Promotions
- `loyalty_points_history` - Loyalty program
- `goals` - Business goals tracking
- `broadcast_campaigns` / `broadcast_messages` - Marketing
- And more...

---

## 🔒 Security Features

### Implemented (Phase 1) ✅
- ✅ Helmet security headers (XSS, clickjacking, MIME sniffing protection)
- ✅ CORS with origin whitelist
- ✅ Rate limiting (global + authentication endpoints)
- ✅ Password complexity requirements
- ✅ Bcrypt password hashing (cost factor 12)
- ✅ Session regeneration on login
- ✅ Secure session cookies (HttpOnly, Secure, SameSite)
- ✅ Input sanitization (SQL injection, NoSQL injection)
- ✅ Environment variable protection

### Planned (Phase 2) 🔜
- 🔜 Two-factor authentication (2FA/TOTP)
- 🔜 Account lockout after failed attempts
- 🔜 Audit logging
- 🔜 CSRF token protection
- 🔜 Data encryption at rest
- 🔜 API key authentication for integrations

---

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Current user info

### Products
- `GET /api/products` - List all products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Sales
- `GET /api/sales` - List sales
- `POST /api/sales` - Create sale
- `GET /api/sales/:id` - Get sale details

### Inventory
- `GET /api/stock` - Get stock items
- `POST /api/stock/adjust` - Adjust stock
- `GET /api/stock/low` - Low stock alerts

### Deliveries
- `GET /api/deliveries` - List deliveries
- `POST /api/deliveries` - Schedule delivery
- `PUT /api/deliveries/:id` - Update delivery

### Analytics
- `GET /api/analytics/sales-trend` - Sales trends
- `GET /api/analytics/product-performance` - Product analytics
- `GET /api/analytics/vendor-leaderboard` - Vendor rankings

**Total Endpoints**: 150+ RESTful API endpoints

---

## 🌐 Deployment

### Railway (Recommended)
```bash
# Push to GitHub
git push origin main

# Deploy to Railway
# 1. Connect GitHub repo
# 2. Add environment variables
# 3. Deploy automatically
```

### Environment Variables
```env
DATABASE_URL=<neon-postgresql-url>
SESSION_SECRET=<64-byte-hex-string>
NODE_ENV=production
PORT=5000
ALLOWED_ORIGINS=https://yourdomain.com
TOYYIBPAY_SECRET_KEY=<your-key>
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

---

## 💰 Pricing & Scalability

### Development (Current)
- **Database**: Neon Free (500MB)
- **Hosting**: Railway Free ($5 credit)
- **Cost**: $0/month

### Production (0-500 users)
- **Database**: Neon Free
- **Hosting**: Railway Hobby ($5-10/month)
- **Cost**: ~$10/month

### Scale (500-5K users)
- **Database**: Neon Scale ($19/month)
- **Hosting**: Railway Pro ($30-50/month)
- **Cost**: ~$50-70/month

### Enterprise (5K-10K users)
- **Database**: Neon Pro ($69/month)
- **Hosting**: Railway ($100-150/month)
- **Caching**: Redis ($10/month)
- **Cost**: ~$200-250/month

---

## 🛠️ Development

### Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run check    # TypeScript type checking
npm run db:push  # Push database schema
```

### Code Structure
```
├── client/              # Frontend React app
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom React hooks
│   │   └── lib/         # Utilities
│   └── public/          # Static assets
├── server/              # Backend Express app
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API routes
│   ├── db.ts            # Database connection
│   └── storage.ts       # Database queries
├── shared/              # Shared types & schemas
│   └── schema.ts        # Drizzle ORM schema
└── migrations/          # Database migrations
```

---

## 📱 Screenshots

*Coming soon - screenshots of dashboard, sales, inventory, and reports*

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 👨‍💻 Created For

**FIQ Sweet Bakery** 🥐  
Empowering Malaysian bakeries with digital transformation

---

## 📞 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/bnidigitalmy/pocketbizz/issues)
- **Documentation**: See docs folder
- **Email**: support@pocketbizz.my

---

## 🙏 Acknowledgments

- Built with ❤️ for Malaysian SMEs
- Powered by modern web technologies
- Designed for scalability and security

---

**PocketBizz** - Your Pocket-Sized Business Manager 🚀

*Last Updated: October 30, 2025*
