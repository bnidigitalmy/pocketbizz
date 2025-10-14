# PocketBizz - Universal Small Business Management System

## Overview
PocketBizz is a comprehensive, mobile-first business management system designed to empower small businesses with end-to-end workflow management. It covers stock and inventory, production and delivery tracking, financial reporting (including profit/loss and rejection tracking), and efficiency tools. Key capabilities include a robust unit conversion system, stock replenishment, variable package size and pricing management, detailed claims, Google Drive auto-sync for documents, and a commission management system. The system aims to streamline operations, reduce manual data entry, and provide actionable financial insights for various small business types.

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
    - **Smart Filters**: Quick filter chips and advanced filtering with useMemo optimization (integrated in Stock page)
    - **Swipe Gestures**: Touch-friendly swipe actions (swipe-to-mark-paid on Sales page)
    - **Quick Actions FAB**: Floating action button with expandable actions for mobile-first navigation (Dashboard)
    - **Enhanced Toasts**: Rich toast notifications with icons, undo actions, and custom action buttons

### Technical Implementations
-   **Frontend**: React 18 with TypeScript, Vite, Wouter for routing, TanStack Query for server state, React Hook Form with Zod for form management, Context API for theme. Key patterns include component composition, custom hooks, and centralized API handling.
-   **Backend**: Express.js with TypeScript, RESTful API design.
-   **Data Access**: `storage.ts` abstraction using Drizzle ORM.
-   **Type Safety**: Shared TypeScript types (Drizzle Zod) between client and server.
-   **PDF Generation**: Client-side PDF generation using jsPDF.
-   **Progressive Web App (PWA)**: Implemented with a web app manifest and service worker for installability and a native-like experience on mobile.

### Feature Specifications
-   **Stock Management System**: Comprehensive inventory with CRUD, recipe builder with auto-cost and profit margin intelligence, flexible pricing, unit conversion, and variable package size/pricing.
-   **Stock Replenishment & Shopping List**: Tools for adding stock, low stock alerts, dedicated shopping list with WhatsApp sharing and optimized print format.
-   **Claims Enhancement**: Detailed product breakdown for claims, filterable views, and vendor cross-checking.
-   **Google Drive Integration**: Auto-sync for all generated documents.
-   **Commission Management**: Supports percentage-based and range-based fixed commissions for vendors.
-   **Rejection Tracking**: Tracks returned/expired/damaged products with `rejectedQty` and `rejectionReason`.
-   **Professional Invoicing**: Comprehensive system with business profile management and multi-invoice claim statements.
-   **Expiry Tracking**: Visual indicators for expiring products.

### System Design Choices
-   **Database**: PostgreSQL (Neon Serverless) with Drizzle ORM.
-   **Schema**: Core entities include Products, Ingredients, Production Batches, Vendors, Deliveries, Delivery Items, Sales, Expenses. Uses UUID primary keys, Decimal types for finance, Enum types, and denormalization.
-   **Cost Calculation Strategy**: Costs are stored at creation time for historical accuracy.
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