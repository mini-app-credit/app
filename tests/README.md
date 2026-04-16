# Testing Guide

This document describes how to run different types of tests for the billing module and the entire application.

## Test Types

### Unit Tests
- **Location**: `tests/unit/`
- **Purpose**: Test individual components in isolation (domain logic, mappers, utilities)
- **Dependencies**: Minimal (no database, no external services)
- **Speed**: Fast

### Integration Tests
- **Location**: `tests/integration/`
- **Purpose**: Test integration with external services (Stripe API, webhooks)
- **Dependencies**: External services (Stripe test mode)
- **Speed**: Medium

### E2E Tests
- **Location**: `tests/e2e/`
- **Purpose**: Test complete flows through HTTP endpoints
- **Dependencies**: Database, Redis, in-memory NestJS application
- **Speed**: Slower

## Running Tests

### Run All Tests

```bash
npm run test
```

### Run Unit Tests Only

```bash
# Run once
npm run test:unit

# Watch mode
npm run test:unit:watch

# Debug mode
npm run test:unit:debug
```

**Examples:**
```bash
# Run all unit tests
npm run test:unit

# Run specific unit test file
npm run test:unit -- stripe-event-mapper.spec.ts

# Run unit tests matching pattern
npm run test:unit -- --testNamePattern="Stripe Event Mapper"
```

### Run Integration Tests Only

```bash
# Run once
npm run test:integration

# Watch mode
npm run test:integration:watch

# Debug mode
npm run test:integration:debug
```

**Prerequisites:**
- Set `STRIPE_SECRET_KEY` environment variable (test mode key)
- Stripe test account configured

**Examples:**
```bash
# Run all integration tests
STRIPE_SECRET_KEY=sk_test_... npm run test:integration

# Run specific integration test
STRIPE_SECRET_KEY=sk_test_... npm run test:integration -- payment-intent-success.spec.ts
```

### Run E2E Tests Only

```bash
# Run once
npm run test:e2e

# Watch mode
npm run test:e2e:watch

# Debug mode
npm run test:e2e:debug
```

**Prerequisites:**
- PostgreSQL database running (test database)
- Redis running (test instance)
- Environment variables configured

**Examples:**
```bash
# Run all e2e tests
npm run test:e2e

# Run billing e2e tests only
npm run test:e2e -- billing

# Run specific e2e test file
npm run test:e2e -- balance.spec.ts
```

## Test Configuration Files

- **Unit Tests**: `tests/jest-unit.json`
- **Integration Tests**: `tests/jest-integration.json`
- **E2E Tests**: `tests/jest-e2e.json`

## Test Structure

### Unit Tests (`tests/unit/`)
```
tests/unit/
├── domain/
│   └── amount.vo.spec.ts
├── webhooks/
│   ├── stripe-event-mapper.spec.ts
│   └── webhook-signature.spec.ts
```

### Integration Tests (`tests/integration/`)
```
tests/integration/
├── stripe/
│   └── payment-intent-success.spec.ts
└── webhooks/
    └── payment-intent-succeeded.spec.ts
```

### E2E Tests (`tests/e2e/`)
```
tests/e2e/
├── billing/
│   ├── balance.spec.ts
│   ├── charge.spec.ts
│   └── invoices.spec.ts
├── iam.spec.ts
├── messaging.spec.ts
└── rate-limiting.spec.ts
```

## Environment Variables

### Unit Tests
No special environment variables required.

### Integration Tests
```bash
STRIPE_SECRET_KEY=sk_test_...  # Stripe test mode secret key
```

### E2E Tests
```bash
DATABASE_WRITE_URL=postgresql://postgres:postgres@localhost:5432/ai-port-test
REDIS_URL=redis://localhost:6379
# ... other environment variables
```

## Running Specific Test Suites

### Run Billing Tests Only

```bash
# Unit tests for billing
npm run test:unit -- billing

# Integration tests for billing
STRIPE_SECRET_KEY=sk_test_... npm run test:integration -- billing

# E2E tests for billing
npm run test:e2e -- billing
```

### Run Tests Matching Pattern

```bash
# Unit tests matching pattern
npm run test:unit -- --testNamePattern="Stripe"

# Integration tests matching pattern
npm run test:integration -- --testNamePattern="Payment Intent"

# E2E tests matching pattern
npm run test:e2e -- --testNamePattern="Balance"
```

## Coverage Reports

### Generate Coverage for Unit Tests
```bash
npm run test:unit -- --coverage
```

### Generate Coverage for Integration Tests
```bash
npm run test:integration -- --coverage
```

### Generate Coverage for E2E Tests
```bash
npm run test:e2e -- --coverage
```

Coverage reports are generated in:
- Unit: `coverage/unit/`
- Integration: `coverage/integration/`
- E2E: `coverage/e2e/`

## Debugging Tests

### Debug Unit Tests
```bash
npm run test:unit:debug
```

### Debug Integration Tests
```bash
npm run test:integration:debug
```

### Debug E2E Tests
```bash
npm run test:e2e:debug
```

Then attach debugger to `localhost:9229` in your IDE.

## Common Issues

### Stripe Integration Tests Fail
- Ensure `STRIPE_SECRET_KEY` is set and starts with `sk_test_`
- Check Stripe test account is active
- Verify network connectivity

### E2E Tests Fail
- Ensure PostgreSQL test database is running
- Ensure Redis test instance is running
- Check environment variables are set correctly
- Verify database migrations are applied

### Tests Timeout
- Increase timeout in respective jest config file
- Check for hanging connections or unclosed resources
- Verify test cleanup is working correctly

## Best Practices

1. **Run unit tests frequently** during development (fast feedback)
2. **Run integration tests** before committing (verify external integrations)
3. **Run e2e tests** before pushing (verify complete flows)
4. **Use watch mode** during active development
5. **Use debug mode** when investigating test failures

