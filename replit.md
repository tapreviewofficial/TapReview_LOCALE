# TapReview - Full-Stack Review Collection Platform

## Overview

TapReview is a full-stack web application designed to help businesses collect customer reviews through NFC technology. The platform enables users to create personalized public profiles where customers can easily leave reviews by tapping an NFC card. The application combines a luxury black and gold theme (#0a0a0a / #CC9900) with modern React components to deliver a premium user experience.

**Deployment Status:** Fully converted to Vercel serverless architecture with 30 complete API routes covering all functionality (auth, profiles, links, analytics, admin panel, promotions, tickets, public pages, promotional contacts).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side application is built with React, TypeScript, and Vite, providing a modern development experience with hot module replacement. The UI is constructed using shadcn/ui components built on top of Radix UI primitives, ensuring accessibility and consistency. TailwindCSS provides utility-first styling with custom CSS variables for the luxury theme. State management is handled by TanStack React Query for server state synchronization, while Wouter provides lightweight client-side routing.

### Backend Architecture  
The application uses **Vercel serverless functions** for backend operations, with all API logic converted from Express to individual Vercel API routes. The serverless architecture includes:
- **Shared Utilities** (`/lib/shared`): Database client with connection pooling (Neon serverless driver), JWT auth helpers, storage layer, email service
- **30 API Routes** (`/api/*`): Complete REST API covering auth (7), profile/links (4), analytics (3), admin (4), promos/tickets (7), public (4), and other features (1)
- **Stateless Design**: All functions are stateless, using connection pooling for database access and JWT for authentication
- **Error Handling**: Centralized with proper HTTP status codes and JSON responses across all serverless functions

### Authentication & Authorization
Authentication uses JWT tokens stored in HTTP-only cookies with a 30-day expiration. Passwords are hashed using bcryptjs with a salt rounds of 12. The system includes middleware for protected routes (requireAuth) and optional authentication checking (getCurrentUser). Cookie security adapts to environment - secure:false in development, secure:true in production.

### Database Design
The application uses Drizzle ORM with **Supabase PostgreSQL** as the database (Neon-backed for serverless compatibility), defined with a clear schema in shared/schema.ts. The data model consists of:
- **Users & Profiles**: Core authentication and public-facing user information
- **Links & Clicks**: User-managed review links with click tracking and analytics
- **Promos, Tickets & PublicPages**: Promotional campaigns with ticket generation and custom landing pages
- **PromotionalContacts**: Database of customers who requested promotions
- **PasswordResets & ScanLogs**: Supporting tables for password recovery and ticket scanning

All schemas include proper foreign key relationships with cascade deletion for data integrity. Connection pooling is enabled via Neon serverless driver for optimal serverless performance.

### Development & Build Pipeline
The monorepo structure separates client, server, and shared concerns:
- **Client**: Vite-powered React app with TypeScript, builds to static assets for Vercel hosting
- **API**: Serverless functions in `/api` directory, auto-deployed as Vercel Functions
- **Shared**: Common types, schemas, and utilities shared between client and serverless backend
- **Database**: Drizzle ORM with Neon PostgreSQL (connection pooling for serverless)

**Local Development**: `npm run dev` starts Express server (for local testing). 
**Production Deployment**: Vercel automatically builds frontend and deploys serverless functions. See `VERCEL_DEPLOY.md` for complete deployment instructions.

## External Dependencies

### Core Runtime
- Node.js 20 as the JavaScript runtime environment
- Express.js for HTTP server and API routing
- Vite for frontend development server and build tooling

### Database & ORM
- Drizzle ORM for type-safe database operations
- SQLite as the development database (configurable via DATABASE_URL)
- Drizzle Kit for schema migrations and database management

### Authentication & Security  
- jsonwebtoken for JWT token generation and verification
- bcryptjs for password hashing and verification
- cookie-parser for HTTP cookie handling

### UI Framework & Components
- React 18 with TypeScript for component architecture
- Radix UI primitives for accessible component foundations
- shadcn/ui component library for pre-built UI elements
- TailwindCSS for utility-first styling system

### State Management & Data Fetching
- TanStack React Query for server state management and caching
- React Hook Form with Zod for form handling and validation
- Wouter for lightweight client-side routing

### Development Tools
- TypeScript for static type checking across the entire stack
- PostCSS with Autoprefixer for CSS processing
- Various @types packages for TypeScript definitions

### Environment Configuration
The application expects the following environment variables:
- DATABASE_URL: Database connection string (defaults to SQLite file)
- JWT_SECRET: Secret key for JWT token signing
- NODE_ENV: Environment mode (development/production)
- FRONTEND_URL: Frontend URL for CORS configuration (production only)