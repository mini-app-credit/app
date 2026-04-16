# Test API Client Configuration

## Overview

Test API client supports two modes:
- **`test`** (default): In-memory NestJS application via supertest
- **`external`**: Real HTTP server (requires running server)

## Usage

### Default Mode (In-Memory)

Tests run against in-memory NestJS application - no need to start server:

```typescript
import { testApi } from '../mocks';

// Application is created automatically on first request
const response = await testApi.post('/auth/email/sign-up', payload);
```

### External Mode (Real Server)

To test against running server, set environment variable:

```bash
TEST_API_MODE=external npm run test:e2e
```

Or programmatically:

```typescript
import { createTestApiClient } from '../mocks/test-api-client';

const api = createTestApiClient({ 
  mode: 'external',
  baseUrl: 'http://localhost:3000' 
});
```

## Factory Pattern

Use factory for flexible configuration:

```typescript
import { testAppFactory, createTestApiClient } from '../mocks/test-api-client';

// Shared factory instance
const factory = testAppFactory;

// Create client with custom factory
const api = createTestApiClient({ factory });
```

## Benefits

- **No server required**: Tests run faster, no port conflicts
- **Full isolation**: Each test suite gets fresh application instance
- **Flexible**: Easy to switch between modes via env variable
- **Production-like**: Same middleware and validation as production

