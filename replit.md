# ManisBizz - Sistem Pengurusan Bisnes Dessert

## Overview

ManisBizz is a comprehensive dessert business management system designed to help small dessert vendors manage their entire business workflow - from recipe management and production tracking to vendor deliveries, sales recording, and financial reporting. The application provides an intuitive, mobile-first interface with a warm, dessert-themed aesthetic that makes business management approachable and efficient.

The system handles the complete lifecycle of a dessert business: creating product recipes with automatic cost calculation, planning daily production batches, managing vendor relationships, tracking deliveries with payment status, recording sales, managing expenses across multiple categories, and generating detailed profit/loss reports.

### Recent Enhancements (October 2025)

**Duplicate Yesterday Feature** - Added "Salin Semalam" (Copy Yesterday) functionality to Production and Deliveries pages. This feature saves 70% of daily data entry time by allowing users to duplicate yesterday's batch/delivery data with one click. The date is automatically updated to today while all other details (products, quantities, vendors) are pre-filled from yesterday's records.

**Expiry Tracking & Alerts** - Implemented visual expiry status indicators for production batches. The system now automatically detects and highlights:
- Expired products (past expiry date) with red "Luput" badges
- Products expiring soon (within 2 days) with orange "Hampir Luput" badges  
- A filter toggle button allows users to view only expiring/expired items
- Expiry dates are color-coded (red for expired, orange for expiring soon) for quick visual identification

**Rejected Products Tracking** - Comprehensive rejection management system integrated into deliveries and financial reporting:
- Track rejected quantities and reasons for each delivery item using collapsible fields in the delivery form
- Visual display of rejection information on delivery cards with orange badges showing rejected quantities
- Rejection reasons displayed in muted text below the rejection count
- Automatic calculation of rejection losses (rejected quantity × unit price) included in profit/loss reports
- New "Kerugian Tolakan" (Rejection Loss) metric displayed on Reports page showing total financial impact of rejected products
- Rejection losses automatically factored into net profit calculations for accurate financial insights

**Enhanced Claim Reports (October 13, 2025)** - Comprehensive claim tracking with payment status management:
- New paymentStatus enum field (pending/partial/settled) separate from delivery status for better payment tracking
- Claims page with vendor-grouped summaries showing total amounts and payment breakdowns
- Each claim card displays pending, partial, and settled amounts with color-coded indicators
- Payment status filtering and quick status updates via dropdown selectors
- Delivery list view with individual payment status management for each delivery

**Dashboard Enhancements (October 13, 2025)** - Expanded dashboard with daily business metrics:
- Modal Hari Ini (Today's Capital) - Total expenses for the current day
- Untung Hari Ini (Today's Profit) - Calculated as today's sales minus today's production costs and expenses
- Produk Reject Hari Ini (Today's Rejected Products) - Count and financial value of rejected items
- 6-card responsive grid layout (2 cols mobile, 3 cols desktop) for comprehensive daily overview
- Color-coded metrics: orange for expenses, green for profit, red for rejections

**WhatsApp Share Integration (October 13, 2025)** - One-click sharing of business data via WhatsApp:
- Share vendor claim summaries directly from Claims page with formatted messages
- Share delivery details including products, quantities, prices, and rejection information
- Pre-formatted messages with WhatsApp markdown formatting (*bold*, bullet points)
- Universal WhatsApp URL format (wa.me) works on both mobile and desktop
- Share buttons integrated on Claims page (vendor cards and delivery list) and Deliveries page

**Mini Invoice Print (October 13, 2025)** - Compact A5 receipt PDF export for easy printing:
- A5 format (148 x 210mm) optimized for small receipt printers
- Compact layout with reduced margins (10mm) and smaller fonts (7-11pt)
- Grid-themed product table with abbreviated headers (Qty instead of Kuantiti)
- 128mm table width fits perfectly within A5 printable area
- Separate "Resit A5" button alongside regular "Invois" download
- Filename prefix "resit-" to distinguish from standard invoices
- 3-button grid layout on delivery cards: Invois, Resit A5, Kongsi WhatsApp

**Professional Invoice System with Letterhead (October 13, 2025)** - Complete business invoice system with professional formatting:
- **Business Profile Management**: New businessProfile table stores company details (name, registration, address, contact, tagline)
- **API Endpoints**: GET/POST `/api/business-profile` for managing letterhead information
- **Professional Letterhead Renderer**: Reusable function renders company branding on all PDF documents
  - Company name, tagline, address, contact details, registration number
  - Separator line with brand colors
  - Compact mode for smaller formats (A5 receipts)
  - Graceful fallback to simple header if no profile exists
- **Enhanced Invoice PDFs**: Professional A4 invoices with letterhead
  - "INVOIS PENGHANTARAN" title with professional layout
  - Two-column design: invoice metadata (left) + vendor details (right)
  - Payment status indicator (Belum Dibayar/Bayaran Separa/Telah Dibayar)
  - Enhanced product table with rejection tracking column
  - Professional total box with gray background
  - Footer with payment terms (7-day payment period)
- **Claim Statement PDFs**: Multi-invoice summary statements for vendor claims
  - Statement metadata: statement number, generated date, period covered
  - Table of all invoices with payment status
  - Color-coded summary: Total, Settled (green), Partial (orange), Pending (red), Outstanding (pink)
  - Accurate financial calculations (outstanding = total - settled only)
  - Professional formatting with letterhead
  - Auto-filename: "penyata-{vendor}-{date}.pdf"
- **Claims Page Integration**: "Penyata" button on each vendor card generates full claim statement
  - Shows all deliveries for that vendor
  - Automatic date range detection (earliest to latest delivery)
  - Toast notifications for user feedback
  - 2-button layout: Penyata + WhatsApp share

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server for fast hot module replacement
- Wouter for lightweight client-side routing (replacing React Router)
- Mobile-first responsive design approach

**UI Component System**
- Shadcn/ui component library built on Radix UI primitives
- Tailwind CSS for utility-first styling with custom design tokens
- Custom color palette implementing light/dark mode support
- Typography system using Poppins (headings), Quicksand (body), and JetBrains Mono (numbers)
- Consistent design language with dessert-themed aesthetics (soft cream, dusty rose, warm browns)

**State Management**
- TanStack Query (React Query) for server state management and caching
- React Hook Form with Zod validation for form state and validation
- Context API for theme management (light/dark mode toggle)

**Key Design Patterns**
- Component composition with Radix UI primitives wrapped in custom components
- Custom hooks for reusable logic (useIsMobile, useToast)
- Centralized API request handling through queryClient utilities
- Consistent toast notifications for user feedback

### Backend Architecture

**Server Framework**
- Express.js for REST API implementation
- TypeScript for type safety across the stack
- Custom middleware for request logging and error handling
- Vite integration for development with HMR support

**API Design**
- RESTful API endpoints organized by resource:
  - `/api/products` - Product and recipe management
  - `/api/production` - Production batch tracking
  - `/api/vendors` - Vendor management
  - `/api/deliveries` - Delivery tracking with items
  - `/api/sales` - Sales recording
  - `/api/expenses` - Expense tracking by category
  - `/api/reports` - Financial reporting and analytics
  - `/api/dashboard/stats` - Dashboard statistics

**Data Access Layer**
- Storage abstraction layer (`storage.ts`) providing interface between routes and database
- Type-safe data operations using Drizzle ORM types
- Separation of concerns: routes handle HTTP, storage handles data logic

### Database Architecture

**ORM & Database**
- Drizzle ORM for type-safe database operations
- PostgreSQL as the primary database (via Neon serverless)
- WebSocket connection pooling for serverless environment
- Schema-first approach with TypeScript type generation

**Database Schema Design**

*Core Entities:*
- **Products** - Product catalog with auto-generated IDs, cost tracking
- **Ingredients** - Recipe components linked to products with quantity and pricing
- **Production Batches** - Daily production records with batch dates and expiry tracking
- **Vendors** - Vendor contact information and addresses
- **Deliveries** - Delivery records with status tracking (delivered, claimed, pending, rejected)
- **Delivery Items** - Line items for each delivery linking products and quantities
- **Sales** - Sales transactions with optional vendor association
- **Expenses** - Expense tracking with categorization (bahan, minyak, upah, plastik, lain)

*Relationships:*
- Products → Ingredients (one-to-many with cascade delete)
- Products → Production Batches (one-to-many with cascade delete)
- Deliveries → Delivery Items (one-to-many with cascade delete)
- Vendors → Deliveries (one-to-many)
- Products → Delivery Items (many-to-one)
- Products → Sales (many-to-one)

*Key Design Decisions:*
- UUID primary keys (gen_random_uuid) for distributed-friendly IDs
- Decimal types for precise financial calculations (10,2 precision)
- Enum types for controlled vocabularies (delivery status, expense categories)
- Denormalization of product names in batches/deliveries for historical accuracy
- Automatic cost calculation stored at batch/delivery creation time

**Schema Management**
- Drizzle Kit for migrations with schema file as source of truth
- Migration files stored in `/migrations` directory
- Database URL configuration through environment variables

### Key Architectural Decisions

**1. Monolithic Full-Stack Structure**
- **Decision**: Single repository with client and server code
- **Rationale**: Simplifies deployment, shared TypeScript types, easier development for small team
- **Trade-offs**: Less flexibility for independent scaling, but appropriate for this use case

**2. Type-Safe Data Flow**
- **Decision**: Shared schema types between client and server using Drizzle Zod integration
- **Rationale**: Eliminates type mismatches, automatic validation, single source of truth
- **Implementation**: Schema defined in `/shared/schema.ts`, imported by both client and server

**3. Cost Calculation Strategy**
- **Decision**: Calculate and store costs at creation time rather than dynamically
- **Rationale**: Preserves historical accuracy when ingredient prices change, improves query performance
- **Implementation**: Total costs computed from ingredients during product creation and stored in batches/deliveries

**4. Delivery Status Workflow**
- **Decision**: Four-stage delivery status (delivered → claimed → pending → rejected)
- **Rationale**: Matches real-world vendor payment workflow, enables payment tracking
- **Trade-offs**: Requires status management, but provides essential business tracking

**5. Mobile-First Design**
- **Decision**: Responsive design prioritizing mobile experience
- **Rationale**: Target users (dessert vendors) primarily work from mobile devices
- **Implementation**: Tailwind breakpoints, collapsible sidebar, touch-optimized UI

**6. PDF Generation for Invoices**
- **Decision**: Client-side PDF generation using jsPDF
- **Rationale**: No server-side processing needed, immediate user feedback, works offline
- **Implementation**: Utility functions in `/client/src/lib/pdf-utils.ts`

## External Dependencies

### Database & Infrastructure
- **Neon Serverless PostgreSQL** - Managed PostgreSQL database with WebSocket support for serverless environments
- **Drizzle ORM** - TypeScript ORM for type-safe database operations and migrations

### UI & Component Libraries
- **Radix UI** - Unstyled, accessible component primitives (dialogs, dropdowns, forms, etc.)
- **Tailwind CSS** - Utility-first CSS framework for styling
- **Shadcn/ui** - Pre-built component library built on Radix UI and Tailwind
- **Lucide React** - Icon library for consistent iconography

### Form & Validation
- **React Hook Form** - Performant form state management
- **Zod** - TypeScript-first schema validation
- **@hookform/resolvers** - Integration between React Hook Form and Zod

### Data Visualization & Reporting
- **Recharts** - Composable charting library for reports and analytics
- **jsPDF & jsPDF-AutoTable** - Client-side PDF generation for invoices and reports

### State Management & Data Fetching
- **TanStack Query (React Query)** - Server state management, caching, and synchronization
- **date-fns** - Date manipulation and formatting utilities

### Development Tools
- **Vite** - Build tool and dev server with HMR
- **TypeScript** - Type safety across the application
- **ESBuild** - Fast JavaScript bundler for production builds

### Fonts (External CDN)
- Google Fonts: Poppins, Quicksand, JetBrains Mono

### Environment Requirements
- Node.js runtime
- DATABASE_URL environment variable for PostgreSQL connection