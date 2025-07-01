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

### Key Data Patterns
- Events are stored with composite key `groupId#YYYY-MM` for efficient monthly queries
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

## Testing
- Core package uses Vitest for unit testing via `sst shell vitest`
- Run tests from the core package directory or use `npm test`

## Key Technologies
- **Frontend**: React Router v7, TailwindCSS, TypeScript
- **Backend**: AWS Lambda, API Gateway v2, DynamoDB, Redis
- **Auth**: AWS Cognito with JWT
- **Infrastructure**: SST v3, AWS CDK under the hood
- **Deployment**: AWS (serverless)