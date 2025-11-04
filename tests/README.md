# PocketBizz Test Suite

## Overview

Comprehensive test suite for PocketBizz using Vitest and Supertest.

## Test Structure

```
tests/
├── setup.ts              # Global test setup
├── factories.ts          # Mock data generators
├── helpers.ts            # Test utilities (auth, db cleanup)
├── auth.test.ts          # Authentication tests
├── products.test.ts      # Products API tests
└── storage.test.ts       # Storage layer tests
```

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

## Test Coverage

Current coverage targets:
- **API Endpoints**: Authentication, Products, Sales, Deliveries
- **Storage Layer**: CRUD operations, business logic
- **Security**: Auth middleware, rate limiting

## Writing New Tests

### API Endpoint Tests

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestAuthHelper } from './helpers';

describe('My API', () => {
  let authHelper: TestAuthHelper;
  let testCookie: string;

  beforeAll(async () => {
    const { setupTestApp } = await import('../server/index');
    const app = setupTestApp();
    authHelper = new TestAuthHelper(app);
    const { cookie } = await authHelper.createAuthenticatedUser();
    testCookie = cookie;
  });

  it('should do something', async () => {
    const agent = authHelper.getAuthenticatedAgent(testCookie);
    const response = await agent.get('/api/endpoint').expect(200);
    expect(response.body).toBeDefined();
  });
});
```

### Storage Layer Tests

```typescript
import { describe, it, expect } from 'vitest';
import { DatabaseStorage } from '../server/storage';

describe('Storage Layer', () => {
  const storage = new DatabaseStorage();

  it('should perform operation', async () => {
    const result = await storage.someMethod();
    expect(result).toBeDefined();
  });
});
```

## Continuous Integration

Tests run automatically on every push and pull request via GitHub Actions.

See `.github/workflows/test.yml` for CI configuration.

## Environment Variables

Tests use a separate test database. Required env vars:
- `DATABASE_URL` - Test database connection string
- `SESSION_SECRET` - Test session secret
- `NODE_ENV=test` - Automatically set by test runner

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data in `afterAll` or `afterEach`
3. **Mock Data**: Use factories for consistent test data
4. **Descriptive Names**: Test names should clearly describe what they test
5. **Assertions**: Be specific about what you're testing

## Common Issues

### Database Connection

If tests fail with database errors:
```bash
# Ensure DATABASE_URL is set
export DATABASE_URL="postgresql://user:pass@localhost:5432/test_db"

# Run migrations
npm run db:push
```

### Session Errors

If authentication tests fail:
- Check SESSION_SECRET is set
- Verify cookie handling in supertest

### Import Errors

If modules can't be found:
- Check tsconfig paths
- Verify vitest.config.ts resolve aliases

## Future Enhancements

- [ ] Add e2e tests with Playwright
- [ ] Increase coverage to 80%+
- [ ] Add performance benchmarks
- [ ] Add visual regression tests
- [ ] Add load testing with k6
