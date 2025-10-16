# PocketBizz - Universal Small Business Management System

## Overview
PocketBizz is a comprehensive, mobile-first business management system for small businesses, offering end-to-end workflow management. It includes stock and inventory, production and delivery tracking, financial reporting (P&L, rejection tracking), and efficiency tools like unit conversion, stock replenishment, variable pricing, claims, Google Drive auto-sync, and commission management. The system recently introduced a subscription billing model powered by ToyyibPay, featuring a free trial, duration-based pricing, tiered plans, early bird discounts, and robust feature gating.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
PocketBizz is a monolithic full-stack application. The frontend uses React 18, TypeScript, and Vite, while the backend is built with Express.js, TypeScript, and Drizzle ORM backed by Neon Serverless PostgreSQL.

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
-   **Claims Enhancement**: Detailed product breakdown, filterable views, vendor cross-checking.
-   **Google Drive Integration**: Auto-sync for generated documents.
-   **Commission Management**: Percentage and range-based fixed commissions.
-   **Rejection Tracking & Post-Delivery Updates**: Comprehensive system for tracking returned/expired/damaged products, allowing post-delivery editing of rejections. Automatically recalculates claims and displays detailed per-item breakdowns (gross → tolakan → net → komisyen).
-   **Professional Invoicing**: Business profile management, multi-invoice claim statements, consignment-appropriate footer notes.
-   **Expiry Tracking**: Visual indicators for expiring products.
-   **Subscription System**:
    -   **Free Trial**: 7-day auto-activated trial with product limits (10 max) and disabled Google Drive sync, enforced by middleware.
    -   **Trial Expiry System**: Automatic trial disabling on expiry (sets `isOnTrial=0` on user load and blocked requests), upgrade prompt dialog with dismissible option for active trials and forced upgrade for expired trials.
    -   **Authentication**: Secure registration/login with bcrypt and session-based auth.
    -   **Duration-Based Pricing**: 3/6/12 month packages with progressive discounts (10% for 6m, 20% for 12m).
    -   **Three-Tier Plans**: Basic, Pro, Premium.
    -   **Early Bird Tracking**: Discounted initial subscription for first 100 users, transitioning to loyalty rate.
    -   **ToyyibPay Integration**: Malaysian payment gateway with callback/webhook handling, pending bills table for metadata storage, payment verification via `getBillTransactions` API.
    -   **Promo Codes**: Support for percentage/fixed discounts with usage tracking.
    -   **Billing History**: Comprehensive transaction tracking with ToyyibPay reference codes.
    -   **Feature Gating**: Middleware-based access control based on trial/paid status and subscription tier.
    -   **Expiry Tracking**: Fixed subscription end dates with renewal reminders.
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