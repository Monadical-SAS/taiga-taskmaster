# @vibe-generated

# Taiga API Test Package

This package provides manual testing capabilities for the Taiga API functionality, including authentication, token refresh, and various endpoint testing.

## Features

- Tests Taiga API authentication and token refresh
- Validates HTTP client functionality
- Tests multiple API endpoints (Tasks, User Stories, Task Statuses)
- Supports both one-time and continuous testing scenarios
- Comprehensive error handling and logging

## Usage

```bash
# From project root - run different test scenarios
npx dotenv -e ./.env -- pnpm --filter @taiga-task-master/taiga-api-test run test:minimal
npx dotenv -e ./.env -- pnpm --filter @taiga-task-master/taiga-api-test run test:long-running
npx dotenv -e ./.env -- pnpm --filter @taiga-task-master/taiga-api-test run test:auth-retry
```

## Test Scenarios

### Minimal Test (One-time)

Tests basic API functionality:

```bash
npx dotenv -e ./.env -- pnpm --filter @taiga-task-master/taiga-api-test run test:minimal
```

**What it does:**
- Authenticates with Taiga API using direct fetch
- Tests taiga-api factory authentication
- Attempts basic API calls (tasks, user stories)
- Validates API responses

### Long-Running Test (Continuous)

Tests token refresh and sustained API usage:

```bash
npx dotenv -e ./.env -- pnpm --filter @taiga-task-master/taiga-api-test run test:long-running
```

**What it does:**
- Makes API calls every 60 seconds
- Tests different endpoints (Tasks, User Stories, Task Statuses)
- Shows detailed logging of requests, responses, and token refresh
- Validates automatic token refresh functionality
- Continues until you press Ctrl+C

### Auth Retry Test

Tests authentication retry mechanisms:

```bash
npx dotenv -e ./.env -- pnpm --filter @taiga-task-master/taiga-api-test run test:auth-retry
```

**What it does:**
- Tests authentication failure scenarios
- Validates retry logic
- Tests credential storage and refresh

## Environment Variables

Requires Taiga API credentials in `.env` file at project root:
- `TAIGA_USERNAME` - Your Taiga username
- `TAIGA_PASSWORD` - Your Taiga password

## Test Flow

1. **Authentication**: Test both direct fetch and factory-based auth
2. **API Validation**: Test various endpoints with authenticated requests
3. **Token Management**: Validate automatic token refresh functionality
4. **Error Handling**: Test failure scenarios and retry mechanisms

## What Gets Tested

- HTTP client functionality
- Authentication flow
- Token refresh mechanisms
- API endpoint responses
- Error handling and retries
- Credential management
