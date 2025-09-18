# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is a PNPM workspace with a monorepo structure containing:
- `apps/frontend` - Next.js 15 frontend with Turbopack, Radix UI, TailwindCSS 4, and React 19
- `apps/backend` - NestJS backend with GraphQL (Apollo), TypeORM, and PostgreSQL
- `packages/shared` - Empty shared package for common utilities

## Development Commands

From the workspace root:
- `pnpm dev` - Start all apps in development mode
- `pnpm build` - Build all apps
- `pnpm start` - Start all apps in production mode
- `pnpm lint` - Lint all apps
- `pnpm test` - Run tests for all apps

### Frontend (Next.js)
- `pnpm dev` - Development server with Turbopack (runs on http://localhost:3000)
- `pnpm build` - Production build with Turbopack
- `pnpm start` - Start production server
- `pnpm lint` - ESLint

### Backend (NestJS)
- `pnpm start` - Production mode
- `pnpm start:dev` - Development mode with watch
- `pnpm start:debug` - Debug mode with watch
- `pnpm build` - Build the application
- `pnpm lint` - ESLint with auto-fix
- `pnpm format` - Prettier formatting
- `pnpm test` - Unit tests with Jest
- `pnpm test:watch` - Watch mode tests
- `pnpm test:cov` - Test coverage
- `pnpm test:e2e` - End-to-end tests
- `pnpm test:debug` - Debug tests

## Architecture

### Backend Architecture
- **Framework**: NestJS with TypeScript
- **GraphQL**: Apollo Server with auto-generated schema
- **Database**: PostgreSQL with TypeORM
- **Configuration**: Environment-based config with @nestjs/config
- **Entities**: Currently has Message entity with basic CRUD operations
- **Structure**: Single module setup with controllers, services, and resolvers co-located

### Frontend Architecture
- **Framework**: Next.js 15 with App Router
- **Build Tool**: Turbopack for faster builds
- **Styling**: TailwindCSS 4
- **UI Components**: Radix UI with Radix Themes
- **State Management**: Zustand
- **Data Fetching**: TanStack Query with GraphQL Request
- **TypeScript**: Full TypeScript support

### Database Configuration
Backend requires these environment variables:
- `DATABASE_HOST`
- `DATABASE_PORT` (defaults to 5432)
- `DATABASE_USER`
- `DATABASE_PASSWORD`
- `DATABASE_NAME`

TypeORM synchronize is enabled (development only - disable for production).

## Technology Stack

### Dependencies Overview
- **Frontend**: Next.js 15, React 19, Radix UI, TailwindCSS 4, Zustand, TanStack Query
- **Backend**: NestJS, Apollo GraphQL, TypeORM, PostgreSQL driver
- **Package Manager**: PNPM with workspace configuration
- **Testing**: Jest (backend), no frontend testing configured yet
- **Linting**: ESLint for both apps with Next.js and Prettier configs