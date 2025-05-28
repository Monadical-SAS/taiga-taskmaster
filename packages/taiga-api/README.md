# @vibe-generated

This package implements the Taiga API layer following the interface definitions from `@taiga-task-master/taiga-api-interface`.

## Features

- HTTP client implementation using undici
- Authentication service with normal login and token refresh
- CRUD operations for Tasks, User Stories, Task Statuses, and Task Custom Attributes
- Effect Schema validation for all API requests/responses
- Type-safe interfaces with branded types

## Usage

```typescript
import { taigaApiFactory } from '@taiga-task-master/taiga-api';

const api = taigaApiFactory.create({
  baseUrl: 'https://api.taiga.io' as any, // cast to Url type
  defaultHeaders: {
    'Authorization': 'Bearer your-token' as any // cast to HeaderKey/HeaderValue
  }
});

// Login
const authResponse = await api.auth.login({
  username: 'user@example.com',
  password: 'password',
  type: 'normal'
});

// List tasks
const tasks = await api.tasks.list({ project: 1 });
```

## Implementation Notes

- Uses undici for HTTP requests
- All responses include status codes and headers
- Automatic JSON serialization/deserialization
- Request cancellation support via AbortSignal
- Proper error handling for HTTP errors