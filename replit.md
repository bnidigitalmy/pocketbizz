# PocketBizz - Universal Small Business Management System

## Overview

PocketBizz (formerly ManisBizz) is a comprehensive, mobile-first business management system designed to help small vendors manage their entire business workflow. Originally built for dessert businesses, it has been rebranded for universal small business applicability with integrated POS capabilities (PocketPOS coming soon). Key capabilities include:

-   **End-to-end Business Management**: From stock management & recipe costing to profit/loss reports.
-   **Stock & Inventory System**: Warehouse stock tracking with automatic cost calculation from recipe items.
-   **Production & Delivery Tracking**: Manage daily batches, track deliveries, and monitor payment statuses.
-   **Financial Reporting**: Detailed sales, expenses, and profit/loss insights, including rejection loss tracking.
-   **Efficiency Tools**: "Copy Yesterday" feature for production and deliveries, WhatsApp sharing, and A5 receipt generation.
-   **Advanced Features**: Expiry tracking, professional invoicing with letterhead, comprehensive claim management with detailed product breakdown, and Google Drive auto-sync for all documents.

The system aims to streamline operations, reduce manual data entry, and provide actionable financial insights for small businesses across various industries.

## Recent Changes (October 2025)

### PocketBizz Rebranding & Stock Management System (Phase 2 Complete)
-   **Rebranding**: Changed from "ManisBizz" (dessert-specific) to "PocketBizz" (universal small business) for broader market appeal
-   **Stock Management Phase 1**: Built complete warehouse inventory system with CRUD operations
    -   Stock Items table with purchase price, current quantity, low stock threshold
    -   Stock Management UI page with low stock alerts and visual indicators
    -   API endpoints for stock CRUD operations
-   **Stock Management Phase 2**: Integrated stock system with Product & Recipe management
    -   **Recipe Builder**: Select stock items from dropdown instead of manual ingredient entry
    -   **Auto Cost Calculation**: Materials cost calculated from recipe items (quantity × stock price)
    -   **Production Costing**: Added fields for labour cost, other costs (utilities, gas, etc.)
    -   **Batch Costing**: Calculate total cost per batch and cost per unit automatically
    -   **Profit Margin Intelligence**: Smart suggestion algorithm (30-50% based on cost tiers)
    -   **Flexible Pricing**: Manual selling price override with "Use Suggestion" button
-   **Database Schema Updates**: 
    -   Created `stock_items` table for warehouse inventory
    -   Created `recipe_items` table linking products to stock items
    -   Updated `products` table with cost breakdown fields (materialsCost, labourCost, otherCosts, totalCostPerBatch, costPerUnit, unitsPerBatch, sellingPrice)
-   **Technical Implementation**:
    -   Backend API validates recipe items and calculates costs server-side
    -   Frontend uses reactive form watching for real-time cost updates
    -   Storage layer updated to save recipe items to database
    -   Fixed React setState-during-render issues with proper form handling

### Claims Enhancement with Product Breakdown
-   Added detailed product breakdown API endpoint (`/api/claims/:vendorId/details`) showing per-invoice product details
-   Enhanced Claims UI with Dialog component featuring filter toggle (Ringkasan vs Per Invois) for flexible viewing
-   Implemented filterable view modes: Summary view (grouped totals) and Individual Invoice view (product-level breakdown)
-   Vendor cross-checking capability: vendors can verify exact products and quantities per invoice

### Google Drive Integration & Sync Dashboard
-   Created comprehensive Google Drive sync infrastructure with `driveSyncLogs` schema
-   Built API endpoints for PDF upload (`/api/google-drive/upload`), file listing, and sync tracking
-   Developed Drive Sync dashboard page (`/drive-sync`) with summary metrics and document list
-   Implemented error handling with proper null-safety and fallback states
-   Added sidebar menu item with Cloud icon for easy access to synced documents
-   Auto-sync tracking: all generated invoices and claim statements logged with metadata (file type, vendor, Drive links)

### Commission Management & Rejection Tracking
-   **Commission Setup System**: Created `vendorCommissions` schema supporting two commission types:
    -   **Percentage-based**: 10%-20% from sales (e.g., 15% commission)
    -   **Range-based Fixed**: Price ranges with fixed commission (e.g., RM1-5 = RM1, RM5.01-10 = RM1.50)
-   **Commission UI**: Built Commission Dialog in Vendors page with form validation and range management
-   **Claims Calculation Enhancement**: Updated claims API to:
    -   Calculate gross amount (total delivered items)
    -   Deduct rejected/returned items
    -   Apply vendor commission based on setup
    -   Return final claimable amount
-   **API Validation**: Added comprehensive Zod validation for commission data (numeric checks, range validation, min < max)
-   **Rejection Tracking**: Delivery items support `rejectedQty` and `rejectionReason` fields for tracking returned/expired/damaged products
-   **Note**: Users should configure commission ranges carefully to cover expected price ranges (system defaults to RM0 commission for unmatched prices)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

ManisBizz is a monolithic full-stack application built with React 18, TypeScript, and Vite on the frontend, and Express.js with TypeScript on the backend. It uses Drizzle ORM with PostgreSQL (Neon Serverless) for database management.

### Frontend Architecture

-   **Frameworks**: React 18 with TypeScript, Vite for bundling.
-   **Routing**: Wouter for lightweight client-side routing.
-   **UI/UX**: Mobile-first responsive design, Shadcn/ui (built on Radix UI), Tailwind CSS for styling, custom dessert-themed color palette, and specific typography (Poppins, Quicksand, JetBrains Mono).
-   **State Management**: TanStack Query for server state, React Hook Form with Zod for form management, Context API for theme.
-   **Key Design Patterns**: Component composition, custom hooks, centralized API handling, consistent toast notifications.

### Backend Architecture

-   **Framework**: Express.js with TypeScript for REST API.
-   **API Design**: RESTful endpoints organized by resource (products, production, vendors, deliveries, sales, expenses, reports, dashboard).
-   **Data Access Layer**: `storage.ts` abstraction using Drizzle ORM types.

### Database Architecture

-   **ORM & Database**: Drizzle ORM, PostgreSQL (Neon Serverless).
-   **Schema Design**: Core entities include Products, Ingredients, Production Batches, Vendors, Deliveries, Delivery Items, Sales, and Expenses. Relationships link these entities to track the business workflow.
-   **Key Decisions**: UUID primary keys, Decimal types for finance (10,2), Enum types for controlled vocabularies, denormalization for historical accuracy, automatic cost calculation at creation time.
-   **Schema Management**: Drizzle Kit for migrations.

### Key Architectural Decisions

1.  **Monolithic Full-Stack**: Single repository for client/server for simplified development and deployment.
2.  **Type-Safe Data Flow**: Shared TypeScript types (Drizzle Zod) between client and server for consistency and validation.
3.  **Cost Calculation Strategy**: Costs stored at creation time to preserve historical accuracy.
4.  **Delivery Status Workflow**: Four-stage workflow (delivered → claimed → pending → rejected) to mirror real-world payment tracking.
5.  **Mobile-First Design**: Prioritizes mobile experience for target users.
6.  **Client-Side PDF Generation**: Uses jsPDF for immediate, server-agnostic invoice/report generation.
7.  **Google Drive Auto-Sync**: Automated cloud backup of all generated documents for organized storage.
8.  **Professional Invoicing**: Comprehensive system with business profile management, professional letterheads, and multi-invoice claim statements.
9.  **Expiry Tracking & Rejection Management**: Visual indicators for expiring products and detailed tracking of rejected items with financial impact.

## External Dependencies

### Database & Infrastructure
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

### State Management & Data Fetching
-   **TanStack Query (React Query)**
-   **date-fns**

### Development Tools
-   **Vite**
-   **TypeScript**
-   **ESBuild**

### External Services
-   **Google Fonts**: Poppins, Quicksand, JetBrains Mono
-   **Google Drive API**: For document auto-sync and storage.