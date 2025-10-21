# PocketBizz - Universal Small Business Management System

## Overview
PocketBizz is a comprehensive, mobile-first business management system for small businesses, offering end-to-end workflow management. It includes stock and inventory, production and delivery tracking, financial reporting (P&L, rejection tracking), and efficiency tools like unit conversion, stock replenishment, variable pricing, claims, Google Drive auto-sync, and commission management. The system recently introduced a subscription billing model powered by ToyyibPay, featuring a free trial, duration-based pricing, tiered plans, early bird discounts, and robust feature gating.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
PocketBizz is a monolithic full-stack application. The frontend uses React 18, TypeScript, and Vite, while the backend is built with Express.js, TypeScript, and Drizzle ORM backed by Neon Serverless PostgreSQL.

### Routing Structure
**Public Routes (No Sidebar, No Auth Required):**
- `/` - Bahasa Melayu landing page (salespage with hero, features, pricing, FAQ)
- `/auth/login` - Login page
- `/auth/register` - Registration page with 7-day trial CTA
- `/pricing` - Full pricing page with plan selection
- `/checkout` - ToyyibPay checkout flow
- `/payment/callback` - Payment webhook callback

**Authenticated Routes (With Sidebar, Auth Required):**
- `/dashboard` - Main dashboard (home for logged-in users)
- `/products`, `/production`, `/deliveries`, `/sales`, etc. - App features

**Auto-Redirect Logic:**
- Landing page (`/`) checks user auth and auto-redirects logged-in users to `/dashboard`
- Auth pages (`/auth/login`, `/auth/register`) redirect to `/dashboard` after successful authentication
- App routes require authentication (redirect to login if not authenticated)

### UI/UX Decisions
The design prioritizes a mobile-first, responsive approach using Shadcn/ui (Radix UI) and Tailwind CSS with a custom dessert-themed color palette. Key UX enhancements include:
- **Global Search**: Cmd/Ctrl+K for system-wide search.
- **Loading States**: Skeleton loaders replace spinners.
- **Empty States**: Illustrated components with CTAs.
- **Keyboard Shortcuts**: Global and page-specific shortcuts.
- **Smart Filters**: Quick filter chips and advanced filtering.
- **Swipe Gestures**: Touch-friendly actions like swipe-to-mark-paid.
- **Quick Actions FAB**: Floating action button for mobile navigation.
- **Enhanced Toasts**: Rich notifications with actions.
- **Interactive Dashboard Charts**: Recharts-based area charts with time range selectors and trend indicators.
- **Production Flow Visualization**: Real-time dashboard card for tracking Production → Delivered → Sold flow.
- **Optimized Theme**: Warm-neutral palette with rich browns and gold accents, consistent across light/dark modes.
- **Advanced Filtering**: Collapsible UI with real-time counts and reset.
- **Improved Delivery Card Layout**: Mobile-optimized 5-button layout.
- **Intelligent Sorting**: Deliveries by `deliveryDate` DESC, Claims by latest delivery date per vendor.

### Technical Implementations
-   **Frontend**: React 18, TypeScript, Vite, Wouter (routing), TanStack Query (server state), React Hook Form with Zod (forms), Context API (theme). Employs component composition, custom hooks, and centralized API handling.
-   **Backend**: Express.js with TypeScript and RESTful API design.
-   **Data Access**: `storage.ts` abstraction using Drizzle ORM.
-   **Type Safety**: Shared TypeScript types (Drizzle Zod) across client and server.
-   **PDF Generation**: Client-side PDFs using jsPDF.
-   **Progressive Web App (PWA)**: Installable with service worker for native-like mobile experience.
-   **Authentication & Sessions**: Bcrypt hashing, `express-session` with PostgreSQL store for persistent sessions and `req.user` hydration.
-   **Subscription Billing**: Stripe integration with webhook handling for payment events, subscription lifecycle, and billing history.

### Feature Specifications
-   **Stock Management**: CRUD, recipe builder with auto-cost/profit, flexible pricing, unit conversion, variable packaging.
-   **Stock Replenishment**: Low stock alerts, shopping list with WhatsApp sharing and print format.
-   **Context-Aware Shopping Cart**: Automatically adds production shortages to a unified shopping list, merges with low stock items, generates professional purchase orders (WhatsApp/thermal print), and provides bulk purchase mutations.
-   **Production Planning**: Intelligent planning with material calculation, real-time stock validation, shortage alerts, shopping cart auto-add, and automatic stock deduction. Supports batch tracking.
-   **Finished Goods Inventory with FIFO Batch Tracking**: Two-tier inventory system (raw materials vs. finished products). Production creates batches with `remainingQty`. Deliveries/Sales deduct from finished goods using FIFO based on expiry dates. Includes atomic deductions, pre-validation, rollback on insufficient stock, dashboard metrics, and expiry alerts.
-   **POS (Point of Sale) System**: Complete transaction-based sales system with:
    -   **Sales Transactions**: Receipt-based sales with unique receipt numbers (RES-YYYYMMDD-XXXX format)
    -   **Multiple Items per Sale**: `sales` table for transactions, `salesItems` table for line items
    -   **Payment Methods**: Support for tunai (cash), online, kredit (credit) via `payment_method` enum
    -   **Profit Tracking**: Auto-calculate profit per item and per transaction (selling price - cost price)
    -   **FIFO Stock Deduction**: Integrated with production batches for automatic FIFO-based inventory deduction
    -   **Customer Tracking**: Optional customer name field for sales records
    -   **Receipt Generation**: PDF receipt generation with business details and itemized breakdown
-   **Claims Enhancement**: Detailed product breakdown, filterable views, vendor cross-checking.
-   **Google Drive Integration**: Auto-sync for generated documents.
-   **Commission Management**: Percentage and range-based fixed commissions.
-   **Rejection Tracking & Post-Delivery Updates**: Comprehensive system for tracking returned/expired/damaged products, allowing post-delivery editing of rejections. Automatically recalculates claims and displays detailed per-item breakdowns (gross → tolakan → net → komisyen).
-   **Professional Invoicing**: Business profile management, multi-invoice claim statements, consignment-appropriate footer notes.
-   **Expiry Tracking**: Visual indicators for expiring products.
-   **Subscription System**:
    -   **Free Trial**: 7-day auto-activated trial with product limits (10 max) and disabled Google Drive sync, enforced by middleware.
    -   **Trial Expiry System**: Automatic trial disabling on expiry (sets `isOnTrial=0` on user load and blocked requests), upgrade prompt dialog with dismissible option for active trials and forced upgrade for expired trials.
    -   **Subscription Expiry Tracking**: Auto-expiry system that checks `subscriptionEndsAt` on every user load, marks expired subscriptions as 'expired' status, with date-based fallback checks in `getUserActiveSubscription` for stale data protection.
    -   **Renewal System**: Complete subscription renewal flow with:
        -   **RenewalReminder Banner**: Non-modal fixed banner appearing 14 days before expiry for active paid users, shows days remaining, dismissible for 24h, navigates to /pricing?renew=true
        -   **Renewal Endpoint**: `/api/subscription/renew` with fallback logic (active subscription or most recent for expired users)
        -   **Renewal Tracking**: Database columns `is_renewal` and `renewal_subscription_id` in pending_bills table
        -   **Webhook Processing**: Extends `subscriptionEndsAt` from current end date (or now if expired), reactivates expired subscriptions, updates cumulative `totalPaid`
        -   **Reactivation Flow**: Expired subscriptions automatically reactivated (status='expired' → 'active') upon successful renewal payment
    -   **Authentication**: Secure registration/login with bcrypt and session-based auth.
    -   **Duration-Based Pricing**: 3/6/12 month packages with progressive discounts (10% for 6m, 20% for 12m).
    -   **Three-Tier Plans**: Basic, Pro, Premium.
    -   **Early Bird Tracking**: Discounted initial subscription for first 100 users, transitioning to loyalty rate.
    -   **ToyyibPay Integration**: Malaysian payment gateway with callback/webhook handling, pending bills table for metadata storage, payment verification via `getBillTransactions` API.
    -   **Promo Codes**: Support for percentage/fixed discounts with usage tracking.
    -   **Billing History**: Comprehensive transaction tracking with ToyyibPay reference codes.
    -   **Feature Gating**: Middleware-based access control based on trial/paid status and subscription tier.
    -   **Admin Panel**: Full subscription management and analytics.

### System Design Choices
-   **Database**: Neon Serverless PostgreSQL with Drizzle ORM, using UUIDs, Decimal types, Enums, and denormalization.
-   **Cost Calculation**: Costs are stored at creation time for historical accuracy.
-   **Delivery Status Workflow**: Four-stage workflow (delivered → claimed → pending → rejected).
-   **Subscription Workflow**: Registration → Trial → Plan selection → ToyyibPay checkout → Activation → Access → Expiry → Renewal.
-   **Monolithic Architecture**: Single repository for client/server.

## External Dependencies

### Database & ORM
-   **Neon Serverless PostgreSQL**
-   **Drizzle ORM**

### UI & Component Libraries
-   **Radix UI**
-   **Tailwind CSS**
-   **Shadcn/ui**
-   **Lucide React**

### Form & Validation
-   **React Hook Form**
-   **Zod**
-   **@hookform/resolvers**

### Data Visualization & Reporting
-   **Recharts**
-   **jsPDF & jsPDF-AutoTable**

### State Management & Utilities
-   **TanStack Query (React Query)**
-   **date-fns**

### Development Tools
-   **Vite**
-   **TypeScript**
-   **ESBuild**

### External Services
-   **Google Fonts**
-   **Google Drive API**
-   **ToyyibPay**

## Recent Bug Fixes (October 2025)

### Deliveries Page (deliveries.tsx)
**Issue**: Page was blank due to 6 TypeScript compilation errors preventing the component from rendering.
**Root Cause**: 
- Missing `AlertCircle` import from lucide-react
- Vendors and products queries not properly typed, causing `.find()` and `.map()` errors at lines 297, 305, 504, 581, 758
**Fix**: 
- Added `AlertCircle` to imports from lucide-react
- Added type annotations to vendors and products queries with default empty arrays: `const { data: vendors = [] } = useQuery<any[]>(...)`
**Result**: All 6 TypeScript errors resolved, page now renders with 17 delivery cards

### Claims Page (claims.tsx)
**Issue**: Page was blank due to 27 TypeScript compilation errors preventing the component from rendering.
**Root Cause**: 
- Missing `deliveries` query - component referenced deliveries data without fetching it
- Multiple implicit 'any' type errors in filter/map callbacks (lines 129-130, 205, 217-219, 238, 250-252, 472, 515)
- Missing type annotation for claimDetails query causing property access errors
**Fix**: 
- Added deliveries query: `const { data: deliveries = [] } = useQuery<any[]>({ queryKey: ["/api/deliveries"] })`
- Added explicit `any` type annotations to all filter/map callback parameters
- Added type annotation to claimDetails query: `useQuery<any>(...)`
**Result**: All 27 TypeScript errors resolved, page now renders with 4 claim cards and delivery list

### Sales Page (sales.tsx)
**Issue**: Runtime error "sales.filter is not a function" preventing page from rendering.
**Root Cause**: 
- API endpoint `/api/sales` returns paginated response `{data: [], hasMore: boolean, total: string}`
- Frontend code expected direct array response, causing `.filter()` to fail
**Fix**: 
- Changed query type from `useQuery<any[]>` to `useQuery<{data: any[], hasMore: boolean, total: string}>`
- Added data extraction: `const sales = salesResponse?.data || []`
**Result**: Runtime error resolved, page now renders with KPI cards and transaction list

### Testing
- Created test user: `test@pocketbizz.my` / `testpassword123` (ID: 56fc1d76-10d1-45f0-baae-4336ad194c56)
- E2E test passed: All 3 pages (deliveries, sales, claims) load successfully with proper content
- No blank pages, all TypeScript and runtime errors resolved