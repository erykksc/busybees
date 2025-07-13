# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Busy Bees is a serverless calendar coordination app built with SST v3 that helps groups find common free time slots. It syncs calendars from different providers (Google, Apple, Microsoft Outlook) while preserving privacy by not showing event details.

## Architecture

This is a monorepo using npm workspaces with 4 main packages:

- **`packages/core/`** - Shared utilities and business logic modules
- **`packages/functions/`** - AWS Lambda functions for API endpoints
- **`packages/website/`** - React Router v7 frontend application
- **`packages/scripts/`** - Utility scripts that run via `sst shell`
- **`infra/`** - SST infrastructure definitions

### Infrastructure Components

- **API**: AWS API Gateway v2 with JWT authentication via AWS Cognito
- **Database**: DynamoDB with Redis caching for session storage
- **Authentication**: AWS Cognito User Pools
- **Frontend**: React Router v7 deployed as AWS React component
- **Secrets**: SST secrets for Google OAuth credentials and configuration

### Key Data Patterns

- **Users**: Stored with `userId` (Cognito sub) as primary key, contains Google Calendar OAuth tokens
- **Events**: Stored with composite key `groupId#YYYY-MM` for efficient monthly queries
- Users can belong to multiple groups and have multiple connected calendars

## Development Commands

### Environment Setup

```bash
# Install dependencies
npm install

# Start development environment (deploys to AWS)
npx sst dev

# Deploy to production
npx sst deploy
```

### Package-Specific Commands

```bash
# Format code across all workspaces
npm run format

# Test core package
cd packages/core && npm test
# or
sst shell vitest

# Run website locally
cd packages/website && npm run dev

# Build website
cd packages/website && npm run build

# Type check website
cd packages/website && npm run typecheck

# Run scripts
sst shell src/example.ts
```

### Framework-Specific Notes

- Uses SST v3 framework for AWS deployment and local development
- All Lambda functions automatically get access to linked resources (database, auth, etc.)
- Local development uses `sst dev` which deploys actual AWS resources for testing
- The `sst shell` command provides access to deployed resources for scripts and testing

### Redis Caching (Development Only)

For performance optimization, the app uses Redis caching for expensive Google Calendar API calls:

- **Development**: Uses local Redis via Docker container
- **Production**: Caching disabled to avoid AWS Redis costs
- **Cache TTL**: 24 hours for freebusy data
- **Cache Key**: `freebusy:{authSub}:{timeMin}:{timeMax}`

#### Setup Redis for Development

```bash
# Start Redis container
docker-compose up -d redis

# Verify Redis is running
docker-compose ps redis

# Stop Redis when done
docker-compose down
```

The cache service automatically:
- Connects to `redis://localhost:6379` in development
- Falls back gracefully if Redis is unavailable
- Disables caching entirely in production environments

## Testing

- Core package uses Vitest for unit testing via `sst shell vitest`
- Run tests from the core package directory or use `npm test`

## Key Technologies

- **Frontend**: React Router v7, TailwindCSS, TypeScript
- **Backend**: AWS Lambda, API Gateway v2, DynamoDB, Redis
- **Auth**: AWS Cognito with JWT
- **Calendar Integration**: Google APIs (googleapis v150.0.1), Google Calendar OAuth 2.0
- **Infrastructure**: SST v3, AWS CDK under the hood
- **Deployment**: AWS (serverless)

## Google Calendar Integration

The app implements Google Calendar OAuth 2.0 integration:

### Setup Requirements

```bash
# Set required SST secrets
sst secret set GoogleClientId "your-google-client-id"
sst secret set GoogleClientSecret "your-google-client-secret"
sst secret set GoogleRedirectUri "https://your-api-domain/api/oauth/google/callback"
```

### Key Components

- **OAuth Flow**: Complete 3-step OAuth implementation with state validation
- **Data Storage**: Google Calendar tokens stored securely in DynamoDB users table
- **API Endpoints**:
  - `GET /api/oauth/google/start` - Initiates OAuth (authenticated)
  - `GET /api/oauth/google/callback` - Handles callback (unauthenticated)
  - `GET /api/user/calendars` - Returns connections (authenticated)
- **Frontend Route**: `/calendar` - Calendar integration page with connection management
- **Security**: OAuth state parameter validation, sensitive tokens never exposed to frontend
