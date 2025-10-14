# ManisBizz - Sistem Pengurusan Bisnes Dessert

## Overview

ManisBizz is a comprehensive dessert business management system designed to help small dessert vendors manage their entire business workflow. It covers recipe management, production tracking, vendor deliveries, sales recording, expense management, and financial reporting. The application features an intuitive, mobile-first interface with a dessert-themed aesthetic. Key capabilities include:

-   **End-to-end Business Management**: From recipe costing to profit/loss reports.
-   **Production & Delivery Tracking**: Manage daily batches, track deliveries, and monitor payment statuses.
-   **Financial Reporting**: Detailed sales, expenses, and profit/loss insights, including rejection loss tracking.
-   **Efficiency Tools**: "Copy Yesterday" feature for production and deliveries, WhatsApp sharing, and A5 receipt generation.
-   **Advanced Features**: Expiry tracking, professional invoicing with letterhead, comprehensive claim management, and Google Drive auto-sync for documents.

The system aims to streamline operations, reduce manual data entry, and provide actionable financial insights for dessert businesses.

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