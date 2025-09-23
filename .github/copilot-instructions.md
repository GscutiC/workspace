# AI Agent Instructions

This is a PNPM monorepo workspace for a virtual office platform with real-time collaboration features.

## Architecture Overview

**Backend (apps/backend)**: NestJS + GraphQL + Prisma + PostgreSQL
- Uses both TypeORM and Prisma (inconsistent - Prisma schema is comprehensive, TypeORM entities are minimal)
- GraphQL schema auto-generated with Apollo Server
- Clerk.com integration for authentication via webhooks
- Database models include User, Organization, Space, Room, Message with gamification features

**Frontend (apps/frontend)**: Next.js 15 + Pixi.js game engine + Clerk auth
- 2D virtual office using Pixi.js with A* pathfinding
- Real-time avatar movement and chat system
- Entity-Component-System architecture for game logic
- Zustand for state management, TanStack Query for data fetching

## Key Development Patterns

### Backend Patterns
- **Service Layer**: Injectable services with Prisma client dependency injection (`constructor(private prisma: PrismaService)`)
- **GraphQL Integration**: Resolvers use `@Resolver()`, `@Query()`, `@Mutation()` decorators with type-safe returns
- **Input Types**: Use `@InputType()` classes for mutations (e.g., `UpdateUserContactInput`)
- **Prisma Relations**: Include related data with `include` in queries (`include: { organization: true, achievements: true }`)
- **Error Handling**: Use NestJS exceptions (`NotFoundException`, validation pipes)

### Frontend Game Engine Patterns
- **Systems Architecture**: Separate systems for Input, Movement, Render in `src/lib/game/systems/`
- **Game State**: Central `GameState` object passed between systems
- **Viewport Management**: Custom viewport class handles camera, zoom, world-to-screen conversion
- **Object Pooling**: Reuse Pixi.js objects for performance (`ObjectPool` system)
- **Configuration-Driven**: Game constants in `src/constants/game.ts` drive behavior

### Data Flow
- Backend exposes GraphQL endpoint at `http://localhost:3001/graphql`
- Frontend uses `graphql-request` client configured in `src/lib/graphql.ts`
- Clerk webhooks sync user data: `POST /api/webhooks/clerk` → UserService
- Real-time features use GraphQL subscriptions (Apollo Server)

## Development Workflow

### Commands (from workspace root)
```bash
pnpm dev          # Start both apps in development
pnpm build        # Build all apps
pnpm lint         # Lint all apps
```

### Backend-specific
```bash
pnpm start:dev    # NestJS development with watch
pnpm test         # Jest unit tests
pnpm test:e2e     # End-to-end tests
```

### Database Management
- Prisma schema: `apps/backend/prisma/schema.prisma`
- Seed file: `apps/backend/prisma/seed.ts`
- Use Prisma CLI for migrations: `prisma migrate dev`, `prisma studio`

## Critical Integration Points

### Authentication Flow
1. Clerk handles frontend auth (`@clerk/nextjs`)
2. Clerk webhook sends user events to `/api/webhooks/clerk`
3. Backend creates/updates users via `UserService.createUser()`
4. GraphQL queries use `userByClerkId` for user lookup

### Game Engine Integration
- Game initialization: `GameEngine.init(canvas)` → systems setup → `start()`
- Input events flow: InputSystem → MovementSystem → RenderSystem
- Pathfinding: A* algorithm in `src/lib/game/pathfinding/AStar.ts`
- Performance: Use `ObjectPool` for Pixi.js sprites, viewport culling

### Database Schema Notes
- Users have gamification fields: `totalPoints`, `level`, `streak`
- Spaces contain JSON `layout` field for 2D map data
- Organizations have subscription limits: `maxUsers`, `maxSpaces`
- Messages support different types: `TEXT`, `SYSTEM`, `JOIN`, `LEAVE`

## Project-Specific Conventions

- **File Organization**: Services, resolvers, entities co-located in `/src`
- **Naming**: Use `snake_case` for database columns, `camelCase` for TypeScript
- **GraphQL**: Auto-generate types, manual input types for mutations
- **Error Messages**: Descriptive error logging with NestJS Logger
- **Game Constants**: Centralized in `/constants` with TypeScript types
- **Component Props**: Use TypeScript interfaces, prefer composition over inheritance

## Missing/Incomplete Features
- Frontend testing setup (no Jest/Vitest configured)
- Production database migration strategy
- Real-time GraphQL subscriptions implementation
- Shared package utilities (currently empty)
- Error boundaries in React components