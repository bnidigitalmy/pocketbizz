# PocketBizz - Universal Small Business Management System

## Overview
PocketBizz is a comprehensive, mobile-first business management system designed to empower small businesses with end-to-end workflow management. It covers stock and inventory, production and delivery tracking, financial reporting (including profit/loss and rejection tracking), and efficiency tools. Key features include a robust unit conversion system, stock replenishment and shopping list capabilities, variable package size and pricing management, detailed claims with product breakdowns, Google Drive auto-sync for all documents, and a commission management system with rejection tracking. The system aims to streamline operations, reduce manual data entry, and provide actionable financial insights for various small business types.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
PocketBizz is a monolithic full-stack application built with React 18, TypeScript, and Vite on the frontend, and Express.js with TypeScript on the backend, using Drizzle ORM with PostgreSQL (Neon Serverless).

### UI/UX Decisions
-   **Mobile-First Responsive Design**: Prioritizes mobile experience.
-   **Component Libraries**: Shadcn/ui (built on Radix UI) and Tailwind CSS for styling.
-   **Theming**: Custom dessert-themed color palette and specific typography (Poppins, Quicksand, JetBrains Mono).

### Technical Implementations
-   **Frontend**: React 18 with TypeScript, Vite, Wouter for routing, TanStack Query for server state, React Hook Form with Zod for form management, Context API for theme. Key patterns include component composition, custom hooks, and centralized API handling.
-   **Backend**: Express.js with TypeScript, RESTful API design.
-   **Data Access**: `storage.ts` abstraction using Drizzle ORM.
-   **Type Safety**: Shared TypeScript types (Drizzle Zod) between client and server for consistency and validation.
-   **PDF Generation**: Client-side PDF generation using jsPDF for immediate invoice/report creation.

### Feature Specifications
-   **Stock Management System**: Comprehensive warehouse inventory with CRUD, recipe builder with auto-cost calculation, profit margin intelligence, and flexible pricing. Includes a unit conversion system (weight, volume, count) for accurate costing and a variable package size/pricing system to handle diverse supplier packaging.
-   **Stock Replenishment & Shopping List**: Tools for adding stock, low stock alerts on the dashboard, and a dedicated shopping list page for purchasing workflow.
-   **Claims Enhancement**: Detailed product breakdown for claims, filterable views (summary vs. per invoice), and vendor cross-checking.
-   **Google Drive Integration**: Auto-sync infrastructure for all generated documents (invoices, claim statements) with a dedicated sync dashboard.
-   **Commission Management**: Supports percentage-based and range-based fixed commissions for vendors, integrated into claims calculations.
-   **Rejection Tracking**: Delivery items include `rejectedQty` and `rejectionReason` for tracking returned/expired/damaged products.
-   **Professional Invoicing**: Comprehensive system with business profile management, professional letterheads, and multi-invoice claim statements.
-   **Expiry Tracking**: Visual indicators for expiring products.

### System Design Choices
-   **Database**: PostgreSQL (Neon Serverless) with Drizzle ORM.
-   **Schema**: Core entities include Products, Ingredients, Production Batches, Vendors, Deliveries, Delivery Items, Sales, Expenses. Uses UUID primary keys, Decimal types for finance (10,2), Enum types, and denormalization for historical accuracy.
-   **Cost Calculation Strategy**: Costs are stored at creation time to preserve historical accuracy.
-   **Delivery Status Workflow**: Four-stage workflow (delivered → claimed → pending → rejected) for payment tracking.
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
-   **Google Drive API**: For document auto-sync and storage.

## Recent Changes (October 2025)

### 📐 Package Size & Variable Pricing System (October 14, 2025)
-   **Problem Solved**: Real-world scenario where stock items are purchased in varying package sizes with different prices (e.g., Creamy Vanilla RM21.90/500g vs Yogurt RM18.90/1.4kg)
-   **Package Size Schema**: Added `packageSize` decimal(10,2) field to `stock_items` table
    -   Stores the size/weight/volume of the purchased package (e.g., 500 for 500g, 1.4 for 1.4kg, 600 for 600ml)
    -   Combined with `purchasePrice` to calculate accurate unit pricing
    -   Default value: 1 (for items sold individually)
-   **Unit Price Calculation**: Dynamic calculation system throughout the application
    -   **Formula**: Unit Price = purchasePrice / packageSize
    -   **Example**: RM21.90 for 500g package → RM21.90 / 500 = RM0.0438 per gram
    -   **Display**: Stock table shows "500 gram @ RM21.90 (RM0.0438/gram)" format
-   **Recipe Cost Calculation Enhancement**:
    -   **Frontend**: Real-time cost preview calculates unitPrice before applying to recipe quantities
    -   **Backend**: Server-side validation and calculation ensures accurate cost storage
    -   **Integration with Unit Conversion**: Works seamlessly with existing kg↔gram, liter↔ml conversions
    -   **Accuracy**: Recipe using 750g from 1.4kg stock @ RM18.90 → Converts to 0.75kg → RM18.90/1.4 × 0.75 = RM10.125 ✓
-   **Stock Management UI Updates**:
    -   **3-Column Grid Layout**: Unit | Package Size | Package Price (replaces previous 2-column)
    -   **Unit Price Display**: Table shows calculated unit price alongside package info
    -   **Form Validation**: Positive number validation for packageSize field
    -   **Visual Clarity**: Clear distinction between package price and per-unit pricing
-   **Replenishment Enhancement**: Extended replenishment feature to handle package size changes
    -   **Current Info Display**: Shows current package (e.g., "500 gram @ RM21.90") and unit price
    -   **Optional Package Size Update**: New field allows updating package size during replenishment
    -   **Use Case**: Supplier changes packaging from 500g bags to 600g bags
    -   **Preview Calculation**: Real-time preview shows new unit price when size/price changes
    -   **Backend Validation**: Server-side validation for both newPurchasePrice and newPackageSize
-   **End-to-End Verification**: Comprehensive Playwright test confirms:
    -   Stock creation with various package sizes (500g @ RM21.90, 1.4kg @ RM18.90, 600ml @ RM9.90)
    -   Recipe costing with unit conversions (500g, 750g, 30ml) calculates correct costs
    -   Replenishment updates package size (500g → 600g @ RM25) and recalculates unit price
    -   New recipes use updated unit prices after replenishment
-   **Impact**: Eliminates costing errors from variable packaging, enables accurate profit margins for businesses purchasing from multiple suppliers with different package sizes

### 📱 Mobile Navigation UX Enhancement (October 14, 2025)
-   **Problem Solved**: Mobile users had to manually close sidebar after navigation and had no way to go back to previous pages
-   **Auto-Close Sidebar on Mobile**:
    -   Implementation: Used `useSidebar` hook with `isMobile` check in AppSidebar component
    -   Behavior: Sidebar automatically closes after clicking any menu item on mobile devices
    -   Desktop Preserved: Sidebar remains open on desktop (width >= 768px) for traditional navigation
    -   **Impact**: Eliminates extra tap to close sidebar, streamlines mobile navigation flow
-   **Mobile Back Button**:
    -   **Location**: Header component with ArrowLeft icon
    -   **Visibility**: Shows only on mobile (`md:hidden` class), hidden on desktop
    -   **Conditional Display**: Hidden on dashboard/home page (no need to go back from home)
    -   **Navigation Logic**: 
        -   Uses `window.history.back()` for standard back navigation
        -   **Safeguard**: Falls back to home page (`navigate("/")`) if no history exists (e.g., deep link entry)
        -   Prevents users from accidentally leaving the app when clicking back
    -   **Browser Integration**: Works seamlessly with wouter routing and browser history API
-   **End-to-End Testing**: Comprehensive Playwright tests verified:
    -   Mobile viewport (375x667): Sidebar auto-closes after menu clicks
    -   Back button appears on all pages except home on mobile
    -   Back button correctly navigates using browser history (Dashboard → Stock → Products → Back)
    -   Desktop viewport (1920x1080): Back button hidden, sidebar stays open
    -   Deep link safeguard: Users landing directly on /stock can still navigate back to home
-   **Impact**: Significantly improved mobile UX with intuitive navigation patterns matching native mobile apps