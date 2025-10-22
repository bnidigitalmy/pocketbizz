# PocketBizz - Universal Small Business Management System

## Overview
PocketBizz is a comprehensive, mobile-first business management system designed for small businesses. It provides end-to-end workflow management, encompassing stock and inventory, production and delivery tracking, financial reporting (P&L, rejection tracking), and various efficiency tools. Key capabilities include unit conversion, stock replenishment, variable pricing, claims management, Google Drive auto-sync, and commission management. The system also features a robust subscription billing model powered by ToyyibPay, offering free trials, duration-based and tiered pricing, early bird discounts, and comprehensive feature gating.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
PocketBizz is a monolithic full-stack application. The frontend is built with React 18, TypeScript, and Vite, while the backend utilizes Express.js, TypeScript, and Drizzle ORM with Neon Serverless PostgreSQL.

### UI/UX Decisions
The design emphasizes a mobile-first, responsive approach using Shadcn/ui (Radix UI) and Tailwind CSS, featuring a custom dessert-themed color palette. Key UX elements include global search (Cmd/Ctrl+K), skeleton loaders for loading states, illustrated empty states with CTAs, extensive keyboard shortcuts, swipe gestures for mobile actions, and a Quick Actions FAB. The dashboard features interactive Recharts-based area charts, a real-time Production → Delivered → Sold flow visualization, and an optimized warm-neutral theme. Advanced filtering, improved delivery card layouts, and intelligent sorting mechanisms enhance usability.

**Sidebar Navigation**: Shopify/Ecwid-style flat navigation with all menu items visible at once. Features are organized into 6 logical categories with clear group labels (Overview, Pengurusan Stok, Jualan & Operasi, Kewangan, Ejen Jualan, Sistem). No collapsing required - one-click access to any feature. Includes logout button in footer for easy session management.

### Technical Implementations
The frontend leverages React 18, TypeScript, Vite, Wouter for routing, TanStack Query for server state management, React Hook Form with Zod for form handling, and Context API for themes. It employs component composition, custom hooks, and centralized API handling. The backend is an Express.js application with TypeScript and a RESTful API design. Data access is abstracted via `storage.ts` using Drizzle ORM. Type safety is maintained through shared TypeScript types (Drizzle Zod). Client-side PDFs are generated using jsPDF. The application is a Progressive Web App (PWA) with a service worker. Authentication uses Bcrypt hashing and `express-session` with a PostgreSQL store. Subscription billing integrates with Stripe for webhooks, lifecycle management, and billing history.

### Feature Specifications
-   **Stock Management**: CRUD operations, recipe builder with auto-cost/profit, flexible pricing, unit conversion, variable packaging.
-   **Stock Replenishment**: Low stock alerts, shopping list with WhatsApp sharing, and print format.
-   **Context-Aware Shopping Cart**: Automatically adds production shortages and low stock items to a unified shopping list, generating professional purchase orders.
-   **Production Planning**: Intelligent planning with material calculation, real-time stock validation, shortage alerts, and automatic stock deduction. Supports batch tracking.
-   **Finished Goods Inventory with FIFO Batch Tracking**: Two-tier inventory system (raw materials vs. finished products) with FIFO-based deduction for deliveries/sales, including atomic deductions and expiry alerts.
-   **POS (Point of Sale) System**: Transaction-based sales with unique receipt numbers, multiple items per sale, various payment methods, profit tracking, FIFO stock deduction, optional customer tracking, and PDF receipt generation.
-   **Reseller/Agent Module (Ejen Jualan)**: Nationwide distribution system with multi-tier discount pricing, CRUD for resellers, a POS-style stock transfer system with automatic tier pricing, ownership transfer model, payment tracking, FIFO integration, receipt generation, and performance analytics. Supports Malaysian states.
-   **Claims Enhancement**: Detailed product breakdown, filterable views, and vendor cross-checking.
-   **Google Drive Integration**: Auto-sync for generated documents.
-   **Commission Management**: Percentage and range-based fixed commissions.
-   **Rejection Tracking & Post-Delivery Updates**: Tracks returned/expired/damaged products, allows post-delivery editing of rejections, and recalculates claims.
-   **Professional Invoicing**: Business profile management, multi-invoice claim statements, and consignment-appropriate footer notes.
-   **Expiry Tracking**: Visual indicators for expiring products.
-   **Subscription System**: Features a 7-day free trial with product limits and feature gating, automatic trial expiry, and a comprehensive renewal system (banners, API endpoints, webhook processing, reactivation). Includes duration-based and tiered pricing, early bird tracking, ToyyibPay integration with promo codes, billing history, feature gating, and an admin panel.
-   **Automation Features (Option B)**: Production-ready dashboard automation widgets:
    -   **Low Stock Alerts**: Real-time monitoring of raw materials (<10 units) and finished products (<10 units) with color-coded urgency indicators (red <5, yellow <10). Quick access to shopping cart and detailed stock pages.
    -   **Weekly Profit Summary**: Automatic week-over-week performance tracking with revenue, costs, and profit margin calculations. Features trend indicators, percentage growth comparisons, and motivational business insights.
    -   **Daily Task Checklist**: Auto-generated action items from business data including low stock restocking, production planning for depleting inventory, payment collection reminders, and expiring batch alerts. Interactive checkboxes with localStorage persistence, visual progress tracking (progress bar + completion count), and celebration messaging upon task completion. Tasks reset daily for fresh prioritization.

### System Design Choices
-   **Database**: Neon Serverless PostgreSQL with Drizzle ORM, utilizing UUIDs, Decimal types, Enums, and denormalization.
-   **Cost Calculation**: Costs are stored at creation time for historical accuracy.
-   **Delivery Status Workflow**: Four-stage workflow (delivered → claimed → pending → rejected).
-   **Subscription Workflow**: Registration → Trial → Plan selection → ToyyibPay checkout → Activation → Access → Expiry → Renewal.
-   **Monolithic Architecture**: Single repository for client and server.

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
-   **Stripe**