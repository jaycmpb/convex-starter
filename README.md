# Convex Starter with Hono HTTP API

A production-ready Convex starter project with Hono HTTP endpoints, error handling, and PostHog integration.

## Features

- 🚀 **Convex Backend**: Database, real-time subscriptions, and cloud functions
- 🌐 **Hono HTTP API**: Fast, lightweight web framework with OpenAPI documentation
- 📊 **Error Logging**: Automatic PostHog integration for error tracking
- 🔧 **Type Safety**: Full TypeScript support with proper error handling
- 📝 **OpenAPI Docs**: Auto-generated API documentation with Scalar UI
- ✅ **Validation**: Zod schema validation for all requests

## Quick Start

### 1. Install Dependencies

```bash
bun install
```

### 2. Set Up Environment Variables

Copy the example environment file and update with your values:

```bash
cp env.example .env.local
```

Then edit `.env.local` with your actual values:

```env
# Convex
CONVEX_DEPLOYMENT=https://your-deployment-url.convex.cloud

# PostHog (optional - for error logging)
POSTHOG_API_KEY=phc_your_posthog_api_key_here
```

### 3. Start Development Server

```bash
bun convex dev
```

This will:

- Start the Convex development server
- Deploy your functions to Convex Cloud
- Start the HTTP API server
- Open the Convex dashboard

### 4. Access API Documentation

Once running, visit:

- **API Documentation**: `http://localhost:3000/api/scalar`
- **OpenAPI Spec**: `http://localhost:3000/api/openapi`

## API Endpoints

### Counters API

All endpoints are prefixed with `/api/`:

| Method   | Endpoint                      | Description             |
| -------- | ----------------------------- | ----------------------- |
| `GET`    | `/api/counters`               | Get all counters        |
| `GET`    | `/api/counters/:name`         | Get counter by name     |
| `POST`   | `/api/counters`               | Create a new counter    |
| `POST`   | `/api/counters/:id/increment` | Increment a counter     |
| `POST`   | `/api/counters/:id/decrement` | Decrement a counter     |
| `POST`   | `/api/counters/:id/reset`     | Reset a counter to zero |
| `DELETE` | `/api/counters/:id`           | Delete a counter        |

### Example Usage

#### Create a Counter

```bash
curl -X POST http://localhost:3000/api/counters \
  -H "Content-Type: application/json" \
  -d '{"name": "my-counter", "value": 0}'
```

#### Increment a Counter

```bash
curl -X POST http://localhost:3000/api/counters/COUNTER_ID/increment \
  -H "Content-Type: application/json" \
  -d '{"amount": 5}'
```

#### Get All Counters

```bash
curl http://localhost:3000/api/counters
```

## Project Structure

```
convex/
├── src/
│   ├── _shared/           # Shared utilities
│   │   ├── errorCodes.ts  # Error handling and logging
│   │   └── http.ts        # HTTP response schemas
│   ├── example/           # Example feature
│   │   ├── mutations.ts   # Database mutations
│   │   ├── queries.ts     # Database queries
│   │   └── http.ts        # HTTP endpoints
│   └── internal/          # Internal functions
│       └── logging/       # Error logging to PostHog
│           └── logging.ts
├── schema.ts              # Database schema
└── http.ts                # Main HTTP router
```

## Error Handling

The project includes a comprehensive error handling system:

### Expected Errors (No Logging)

For business logic errors that are expected:

```typescript
return c.json(
  { ...ErrorCodes.NOT_FOUND, message: "Counter not found." },
  ErrorCodes.NOT_FOUND.status as any
);
```

### Unexpected Errors (With Logging)

For unexpected errors that should be logged to PostHog:

```typescript
const errorData = await logAndReturnError(
  c,
  ErrorCodes.INTERNAL_ERROR,
  "Failed to create counter."
);
return c.json(errorData, errorData.status);
```

## PostHog Integration

Error logging is automatically handled via PostHog:

1. Set `POSTHOG_API_KEY` in your `.env.local`
2. Unexpected errors are automatically logged to PostHog
3. Logging happens in the background without blocking responses
4. Errors include stack traces, context, and metadata

## Development

### Adding New Features

1. **Create a new feature folder** in `convex/src/[feature-name]/`
2. **Add functions** following the pattern:
   - `mutations.ts` - Database write operations
   - `queries.ts` - Database read operations
   - `http.ts` - HTTP endpoints
3. **Register routes** in `convex/http.ts`
4. **Follow the established patterns** for error handling and validation

### Code Style

- Use `@convex` alias for all imports
- Full sentences with punctuation in all comments and messages
- Use `describeRoute` for OpenAPI documentation
- Use `validator` for request validation
- Follow the error handling patterns established

## Environment Variables

| Variable            | Required | Description                       |
| ------------------- | -------- | --------------------------------- |
| `CONVEX_DEPLOYMENT` | Yes      | Your Convex deployment URL        |
| `POSTHOG_API_KEY`   | No       | PostHog API key for error logging |

## Scripts

```bash
# Start development server
bun convex dev

# Deploy to production
bun convex deploy

# Run tests
bun test
```

## Learn More

- [Convex Documentation](https://docs.convex.dev)
- [Hono Documentation](https://hono.dev)
- [PostHog Documentation](https://posthog.com/docs)
