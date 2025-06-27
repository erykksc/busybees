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

   This is for any scripts that run on the SST app using the `sst shell` CLI and [`tsx`](https://www.npmjs.com/package/tsx).
   For example, you can run the example script using:

   ```bash
   npm run shell src/example.ts
   ```

### Infrastructure

The `infra/` directory stores the infrastructure of the app using SST.
