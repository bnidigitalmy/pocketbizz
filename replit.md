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