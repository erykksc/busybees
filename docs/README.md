# Busy Bees Documentation

## Tech Stack

- React-router (frontend framework)
- AWS API Gateway v2
- Lambda functions (backend)
- AWS Cognito (authentication)
- AWS DynamoDB (database)
- Amazon ElastiCache for Redis (caching and session storage)

## Requirements

### Functional Requirements

- Users add their calendars to their profiles, a user can have multiple calendars added e.g., multiple Google Calendars, Apple Calendar, Microsoft outlook...
- Users can create and join groups with others.
- User can be a member of many groups.
- Every user in a group has a view at the current or any other month, where he sees all the events of every group member (without details e.g., name of the events).
- Every user has an option to change the view from events into the free time slots (the reverse view) of the month.
- There is automatic and manual way to synchronize the state of the app with the users calendars

### Non-Functional Requirements

- The application is horizontally scalable, with no single component that would become a bottleneck
- The application is scaled up/out, it should not be possible to overload another component (i.e., there needs to be some mitigation strategy for very high load).

### Data Access patterns

For reads the typical query is to find all the events for a given month of every user in the group.
For write, the user should be able to sync all his calendars and it should be visible in all the groups he belongs to.

### DynamoDB Schema

**'users' table**

- Primary key: `userId` (Cognito sub)
- Stores user profile and connected calendar integrations
- Each user can have multiple Google Calendar connections with OAuth tokens

**'events' table**
The primary key is "groupId#YYYY-MM", this way a lookup for the events of the group will be simple Query for specific primary key.

## Code structure

This template uses [npm Workspaces](https://docs.npmjs.com/cli/v8/using-npm/workspaces). It has 4 packages

1. `core/`

   This is for any shared code. It's defined as modules. For example, there's the `Example` module.

   ```ts
   export module Example {
     export function hello() {
       return "Hello, world!";
     }
   }
   ```

   That can be used across other packages using.

   ```ts
   import { Example } from "@aws-monorepo/core/example";

   Example.hello();
   ```

   We also have [Vitest](https://vitest.dev/) configured for testing this package with the `sst shell` CLI.

   ```bash
   npm test
   ```

2. `functions/`

   This is for Lambda functions and it uses the `core` package as a local dependency.

3. `website/`

   This is for the react-router frontend app.

4. `scripts/`

   This is for any scripts for the project.
   The scripts can run in the context of the SST app, its variables and resources.

   You can run the scripts from the root of the project using `npm run <script-name>`.

   Available scripts:
   - `npm run format` - Format code across all workspaces
   - `npm run signup-user -- --username user@example.com --password Passw0rd!` - Create a new Cognito user
   - `npm run confirm-signup -- --username user@example.com` - Confirm user signup (skip email verification)
   - `npm run list-users` - List all users in the Cognito user pool
   - `npm run delete-user -- --username user@example.com` - Delete a Cognito user
   - `npm run get-user -- --username user@example.com` - Get Cognito user details

   > Note: All scripts defined in `packages/scripts` should be defined in the root `package.json` for easy access and documented here.

### Infrastructure

The `infra/` directory stores the infrastructure of the app using SST.

## Google Calendar OAuth Integration

The app implements a complete Google Calendar OAuth 2.0 flow to allow users to connect their calendars with readonly access.

### Setup Requirements

Set the following SST secrets before deployment:

```bash
sst secret set GoogleClientId "your-google-client-id"
sst secret set GoogleClientSecret "your-google-client-secret"
sst secret set GoogleRedirectUri "https://your-api-domain/api/oauth/google/callback"
```

### OAuth Flow

1. **Initiate OAuth** (`/api/oauth/google/start`)
   - User clicks "Add Google Calendar" on `/calendar` page
   - Authenticated endpoint generates Google OAuth URL with user ID as state parameter
   - Redirects user to Google consent screen with `calendar.readonly` scope

2. **OAuth Callback** (`/api/oauth/google/callback`)
   - Google redirects back with authorization code and user ID state
   - Unauthenticated endpoint exchanges code for access/refresh tokens
   - Fetches user's primary calendar details via Google Calendar API
   - Stores calendar connection in DynamoDB users table
   - Redirects user back to `/calendar` page

3. **View Connections** (`/api/user/calendars`)
   - Authenticated endpoint returns user's connected calendars (without sensitive tokens)
   - Frontend displays connection details on `/calendar` page

### Security Features

- OAuth state parameter validates user identity across the flow
- Sensitive tokens (access/refresh) never exposed to frontend
- Callback endpoint is unauthenticated but validates user via state parameter
- Calendar connection details stored securely in DynamoDB

### API Endpoints

- `GET /api/oauth/google/start` - Initiates OAuth flow (authenticated)
- `GET /api/oauth/google/callback` - Handles OAuth callback (unauthenticated)
- `GET /api/user/calendars` - Returns user's calendar connections (authenticated)

### Frontend Routes

- `/calendar` - Calendar integration page with "Add Google Calendar" button
- Uses React Router v7 loader function for server-side data fetching
