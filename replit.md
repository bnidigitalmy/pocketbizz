# PocketBizz - Universal Small Business Management System

## Overview
PocketBizz is a comprehensive, mobile-first business management system designed to empower small businesses with end-to-end workflow management. It covers stock and inventory, production and delivery tracking, financial reporting (including profit/loss and rejection tracking), and efficiency tools. Key capabilities include a robust unit conversion system, stock replenishment, variable package size and pricing management, detailed claims, Google Drive auto-sync for documents, and a commission management system. 

**NEW: Subscription Billing System (October 2025)** - ToyyibPay-powered subscription billing with:
- **Free 7-Day Trial**: Auto-activated on registration with limited features (10 products max, basic features only)
- **Duration-Based Pricing**: 3/6/12 month packages with automatic discounts (6m: 10% off, 1y: 20% off)
- **Early Bird Special**: First 100 signups get 70% off (RM27/month effective rate), auto-transition to RM79 loyalty rate after first subscription period
- **Three-Tier Plans**: Basic (RM49/month), Pro (RM99/month), Premium (RM199/month) - billed upfront for chosen duration
- **Malaysian Payment Methods**: FPX, online banking, e-wallets via ToyyibPay
- **Feature Gating**: Middleware protection based on trial vs paid status and subscription tier

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
PocketBizz is a monolithic full-stack application. The frontend is built with React 18, TypeScript, and Vite, while the backend uses Express.js with TypeScript and Drizzle ORM with PostgreSQL (Neon Serverless).

### UI/UX Decisions
-   **Mobile-First Responsive Design**: Prioritizes mobile experience.
-   **Component Libraries**: Shadcn/ui (built on Radix UI) and Tailwind CSS for styling.
-   **Theming**: Custom dessert-themed color palette and specific typography (Poppins, Quicksand, JetBrains Mono).
-   **UX Enhancements (2025)**:
    - **Global Search**: Cmd/Ctrl+K shortcut to search across all modules (products, vendors, stock, sales, deliveries) with real-time results
    - **Skeleton Loaders**: Replaced spinners with skeleton screens for better perceived performance
    - **Empty States**: Comprehensive component with helpful illustrations and CTAs for all empty scenarios
    - **Keyboard Shortcuts**: Global (Cmd+K, ?) and page-specific (N for new) shortcuts with help dialog
    - **Smart Filters**: Quick filter chips and advanced filtering with useMemo optimization (integrated in Stock, Deliveries, and Claims pages)
    - **Swipe Gestures**: Touch-friendly swipe actions (swipe-to-mark-paid on Sales page)
    - **Quick Actions FAB**: Floating action button with expandable actions for mobile-first navigation (Dashboard)
    - **Enhanced Toasts**: Rich toast notifications with icons, undo actions, and custom action buttons
    - **Interactive Dashboard Charts**: Recharts area chart with time range selector (7d/30d/90d/6m), trend indicators with percentage deltas, dual-area visualization for sales and profit tracking
    - **Production Flow Visualization**: Real-time dashboard card showing Production → Delivered → Sold flow with visual indicators, balance tracking (production - delivered), and alerts when deliveries exceed daily production
    - **Optimized Theme**: Sophisticated warm-neutral palette (hues 28-42) with rich chocolate browns, warm gold accents (42°), and full cohesion across light/dark modes
    - **Advanced Filtering System**: Deliveries page with vendor, status, and date range filters; Claims page with vendor and payment status filters; collapsible filter UI with toggle, real-time count display, and reset functionality
    - **Improved Delivery Card Layout**: 5-button layout with full-width Edit Tolakan button and 2x2 grid for action buttons (Invois, Resit A5, Thermal 58mm, WhatsApp) ensuring all buttons visible on mobile
    - **Intelligent Sorting**: Deliveries sorted by deliveryDate DESC (latest first); Claims sorted by latest delivery date per vendor for better financial tracking

### Technical Implementations
-   **Frontend**: React 18 with TypeScript, Vite, Wouter for routing, TanStack Query for server state, React Hook Form with Zod for form management, Context API for theme. Key patterns include component composition, custom hooks, and centralized API handling.
-   **Backend**: Express.js with TypeScript, RESTful API design.
-   **Data Access**: `storage.ts` abstraction using Drizzle ORM.
-   **Type Safety**: Shared TypeScript types (Drizzle Zod) between client and server.
-   **PDF Generation**: Client-side PDF generation using jsPDF.
-   **Progressive Web App (PWA)**: Implemented with a web app manifest and service worker for installability and a native-like experience on mobile.
-   **Authentication & Sessions**: Bcrypt password hashing with express-session using PostgreSQL store (connect-pg-simple) for persistent session management. Session middleware hydrates req.user for all authenticated routes.
-   **Subscription Billing**: Stripe integration with webhook handling for payment events, subscription lifecycle management, and automated billing history tracking.

### Feature Specifications
-   **Stock Management System**: Comprehensive inventory with CRUD, recipe builder with auto-cost and profit margin intelligence, flexible pricing, unit conversion, and variable package size/pricing.
-   **Stock Replenishment & Shopping List**: Tools for adding stock, low stock alerts, dedicated shopping list with WhatsApp sharing and optimized print format.
-   **Context-Aware Shopping Cart System**: Streamlined production-to-purchase workflow that eliminates repetitive actions. When production planning detects insufficient stock, items are automatically added to a shopping cart with exact shortage quantities and production context (which product needs the material). Features include:
    - Auto-capture of production shortages with precise quantities and usage units
    - Production batch tracking (productionBatchId reference for historical linking)
    - **Unified Shopping List**: Merged display of cart items (production) + low stock items with clear tags ("Produksi: [Product]" vs "Stok Rendah/Habis")
    - Bulk operations: Unified Select All covering both categories, bulk purchase mutation handling cart + low stock items in single transaction
    - **Professional Purchase Orders**: Business profile header integration (name, address, phone, email, registration) for WhatsApp sharing and thermal printing
    - WhatsApp format includes business header, item tags, quantities, and cost breakdown
    - Thermal print (80mm) optimized with business letterhead, dashed separators, and professional layout
    - User instruction reminder to share/print BEFORE confirming purchase (list clears after confirmation)
    - Single-click workflow: shortage detected → auto-add to cart → unified list with tags → share/print with header → bulk confirm → stock updated
-   **Production Planning System**: Intelligent production planning with multi-step workflow (select product/quantity → preview materials → confirm). Features include automatic material calculation from recipes, real-time stock validation with visual indicators, insufficient stock alerts, shopping cart auto-add for missing items, and automatic stock deduction upon confirmation. Supports batch tracking with expiry dates and notes.
-   **Finished Goods Inventory with FIFO Batch Tracking**: Two-tier inventory system separating raw materials (Stock page) and finished products (Finished Products page). Production creates batches with `remainingQty` tracking. Delivery and Sales automatically deduct from finished goods using FIFO (First-In-First-Out) logic based on expiry dates. Features include:
    - Batch-level inventory with individual expiry tracking
    - Atomic FIFO deduction with database transactions and row-level locking to prevent race conditions and overselling
    - Deterministic ordering: earliest expiry first, NULL expiry last, creation date as tie-breaker
    - Pre-validation of stock availability before mutations
    - Automatic rollback on insufficient stock with user-facing error notifications
    - Dashboard metrics showing total ready stock and expiring soon alerts (3-day window)
    - Product-level aggregation with batch breakdown showing expiry status (Fresh/Warning/Expired)
-   **Claims Enhancement**: Detailed product breakdown for claims, filterable views, and vendor cross-checking.
-   **Google Drive Integration**: Auto-sync for all generated documents.
-   **Commission Management**: Supports percentage-based and range-based fixed commissions for vendors.
-   **Rejection Tracking & Post-Delivery Updates**: Comprehensive rejection management system for tracking returned/expired/damaged products. Features include:
    - Initial rejection capture during delivery creation (optional collapsible section)
    - **Post-Delivery Edit Capability**: Edit existing deliveries to add/update rejections for products that expire/go bad days after delivery (critical business workflow)
    - Edit dialog shows all delivery items with rejection quantity and reason fields
    - Backend validation ensures rejectedQty doesn't exceed delivered quantity
    - Auto-recalculation of claims upon rejection update (commission calculated on net amount after rejections)
    - Real-time sync between deliveries and claims pages via React Query invalidation
    - Per-item breakdown: gross → tolakan (orange) → net → komisyen (blue) → boleh dituntut
    - Rejection data included in invoices and claim statements for full transparency
-   **Professional Invoicing**: Comprehensive system with business profile management and multi-invoice claim statements. Invoice PDFs use "Harga Jualan" column header (instead of "RP") for clarity and include consignment-appropriate footer note: "Nota: Tuntutan tertakluk kepada jualan sebenar dan keadaan produk".
-   **Expiry Tracking**: Visual indicators for expiring products.
-   **Subscription System** (October 2025 - ToyyibPay):
    - **Free Trial System**: Auto-activate 7-day trial on registration, limited to 10 products and basic features
    - **User Authentication**: Secure registration/login with bcrypt password hashing, session-based auth with PostgreSQL store
    - **Duration-Based Pricing**: 3/6/12 month packages with upfront payment
      - 3 months: Pay full price (e.g., RM147 for Basic = RM49 × 3)
      - 6 months: 10% discount (e.g., RM270 for Basic = RM49 × 6 × 0.9)
      - 12 months: 20% discount (e.g., RM480 for Basic = RM49 × 12 × 0.8)
    - **Three-Tier Plans**: Basic (RM49/month), Pro (RM99/month), Premium (RM199/month)
    - **Early Bird Tracking**: First 100 signups get 70% off for their first subscription (e.g., RM81 for 3 months), then RM79/month loyalty rate on renewal
    - **ToyyibPay Integration**: Malaysian payment gateway supporting FPX, online banking, e-wallets, callback/webhook handling
    - **Promo Codes**: Support for percentage and fixed-amount discount codes with usage limits, early bird auto-application
    - **Billing History**: Complete transaction tracking with ToyyibPay bill codes, transaction IDs, payment methods
    - **Feature Gating**: Middleware protection based on trial/paid status and subscription tier (max users, products, features)
    - **Expiry Tracking**: Fixed subscription end dates with renewal reminders 2 weeks before expiry
    - **Admin Panel**: Full subscription management, user overview, early bird slot tracking, revenue metrics

### System Design Choices
-   **Database**: PostgreSQL (Neon Serverless) with Drizzle ORM.
-   **Schema**: Core entities include Products, Ingredients, Production Batches, Vendors, Deliveries, Delivery Items, Sales, Expenses. **Subscription entities** include Users (with trial fields), Subscription Plans (duration-based), User Subscriptions (fixed end dates), Promo Codes, Billing History (ToyyibPay), Early Bird Tracking (first 100 slots). Uses UUID primary keys, Decimal types for finance, Enum types, and denormalization.
-   **Cost Calculation Strategy**: Costs are stored at creation time for historical accuracy.
-   **Delivery Status Workflow**: Four-stage workflow (delivered → claimed → pending → rejected) for payment tracking.
-   **Subscription Workflow**: Registration → 7-day trial activation → Trial expiry prompt → Duration selection (3/6/12m) → ToyyibPay checkout → Payment → Subscription activation → Feature access → Fixed expiry date → Renewal reminder
-   **Monolithic Architecture**: Single repository for client/server for simplified development and deployment.

## External Dependencies

### Database & ORM
-   **Neon Serverless PostgreSQL**
-   **Drizzle ORM**

### UI & Component Libraries
-   **Radix UI**
-   **Tailwind CSS**
-   **Shadcn/ui**
-   **Lucide React** (icons)

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
-   **Google Fonts**: Poppins, Quicksand, JetBrains Mono
-   **Google Drive API**: For document auto-sync and storage
-   **ToyyibPay**: Malaysian payment gateway for subscription billing, supports FPX/online banking/e-wallets, callback/webhook for payment verification