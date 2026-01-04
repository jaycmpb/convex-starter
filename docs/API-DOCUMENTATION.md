# HTTP API Documentation

## Overview

The My Accounting Dashboard provides a comprehensive HTTP API built on the Hono framework with Convex backend integration. The API supports authentication, webhook handling, and OpenAPI documentation for easy integration and testing.

## Base Configuration

### Framework
- **Server Framework:** Hono with Convex integration (`HonoWithConvex`)
- **OpenAPI Support:** Automatic documentation generation via `hono-openapi`
- **API Documentation UI:** Scalar API reference viewer

### Base URL Structure
```
https://your-domain.com/api/
```

### Content Type
All API endpoints accept and return `application/json` unless otherwise specified.

## Available Endpoints and Methods

### 1. Authentication Endpoints

#### POST `/api/auth/send-otp`
Send a one-time password to an email address for authentication.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "OTP sent."
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Your account is inactive."
}
```

**Status Codes:**
- `200` - OTP sent successfully
- `400` - Email is required or failed to send OTP
- `403` - Account is inactive

#### POST `/api/auth/verify-otp`
Verify the OTP code and receive authentication tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Response (Success):**
```json
{
  "success": true,
  "token": "jwt_access_token_here",
  "refreshToken": "refresh_token_here"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Invalid or expired code."
}
```

**Status Codes:**
- `200` - Authentication successful
- `400` - Email and code are required
- `401` - Invalid or expired code

#### POST `/api/auth/refresh`
Exchange a refresh token for a new authentication token.

**Headers:**
```
Cookie: x-refresh-token=refresh_token_here
```

**Response (Success):**
```json
{
  "success": true,
  "token": "new_jwt_access_token",
  "refreshToken": "new_refresh_token"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Invalid refresh token."
}
```

**Status Codes:**
- `200` - Token refreshed successfully
- `400` - Refresh token is required
- `401` - Invalid refresh token

### 2. Webhook Endpoints

#### POST `/api/webhooks/monday?type={entity_type}`
Receive and process Monday.com webhook events.

**Query Parameters:**
- `type` (required) - Entity type: `client`, `contact`, `team`, `task`, `update`, `work-item`

**Request Body (Monday.com Webhook Payload):**
```json
{
  "event": {
    "type": "create_pulse",
    "pulseId": 123456789,
    "boardId": 987654321,
    "groupId": "group_1",
    "columnId": "status"
  },
  "body": {
    // Additional Monday.com webhook data
  }
}
```

**Response (Success):**
```json
{
  "success": true
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Missing required 'type' query parameter."
}
```

**Status Codes:**
- `200` - Webhook processed successfully
- `400` - Missing parameters or unsupported event/entity type
- `500` - Internal server error during processing

### 3. OpenAPI and Documentation

#### GET `/api/openapi`
Returns the OpenAPI specification for the entire API.

**Response:**
```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Convex API",
    "version": "1.0.0",
    "description": "Convex API"
  },
  "paths": {
    // API endpoint definitions
  },
  "components": {
    "securitySchemes": {
      "bearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT",
        "description": "Authentication Token"
      }
    }
  }
}
```

#### GET `/api/scalar`
Interactive API documentation viewer using Scalar.

**Response:** HTML page with interactive API explorer

### 4. OpenID Connect Discovery

#### GET `/.well-known/openid-configuration`
OpenID Connect discovery endpoint for JWT verification.

**Response:**
```json
{
  "issuer": "https://your-domain.com",
  "jwks_uri": "https://your-domain.com/.well-known/jwks.json",
  "authorization_endpoint": "https://your-domain.com/oauth/authorize"
}
```

**Headers:**
```
Cache-Control: public, max-age=15, stale-while-revalidate=15, stale-if-error=86400
```

#### GET `/.well-known/jwks.json`
JSON Web Key Set for JWT verification.

**Response:** JWKS data from `JWKS` environment variable

**Headers:**
```
Content-Type: application/json
Cache-Control: public, max-age=15, stale-while-revalidate=15, stale-if-error=86400
```

## Authentication Requirements

### Bearer Token Authentication

Most API endpoints require JWT authentication:

**Header Format:**
```
Authorization: Bearer your_jwt_token_here
```

### Security Scheme Configuration

```json
{
  "bearerAuth": {
    "type": "http",
    "scheme": "bearer",
    "bearerFormat": "JWT",
    "description": "Authentication Token"
  }
}
```

### Token Management

1. **Obtain Token:** Use `/api/auth/send-otp` and `/api/auth/verify-otp`
2. **Use Token:** Include in `Authorization` header for protected endpoints
3. **Refresh Token:** Use `/api/auth/refresh` with HTTP-only cookie
4. **Token Expiry:** Implement token refresh logic in client applications

## Request/Response Formats

### Standard Request Format

```json
{
  "field1": "value1",
  "field2": "value2"
}
```

### Standard Success Response

```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully"
}
```

### Standard Error Response

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "status": 400,
  "details": {}
}
```

### Response Schema Definitions

#### Success Response Schema
```typescript
const SuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.any(),
  message: z.string().optional(),
});
```

#### Error Response Schema
```typescript
const ErrorResponseSchema = z.object({
  error: z.string(),
  code: z.string(),
  status: z.number(),
  details: z.any().optional(),
});
```

## Error Handling

### HTTP Status Codes

The API uses standard HTTP status codes:

- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (invalid/missing authentication)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `422` - Unprocessable Entity (validation errors)
- `429` - Too Many Requests (rate limiting)
- `500` - Internal Server Error
- `502` - Bad Gateway
- `503` - Service Unavailable

### Error Response Structure

All errors follow a consistent format:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_ERROR_CODE",
  "status": 400,
  "details": {
    "field": "Additional error context"
  }
}
```

### Common Error Scenarios

#### Authentication Errors
```json
{
  "success": false,
  "error": "Invalid or expired code.",
  "status": 401
}
```

#### Validation Errors
```json
{
  "success": false,
  "error": "Email is required.",
  "status": 400
}
```

#### Permission Errors
```json
{
  "success": false,
  "error": "Your account is inactive.",
  "status": 403
}
```

#### Webhook Processing Errors
```json
{
  "success": false,
  "error": "Unsupported entity type 'invalid-type'.",
  "status": 400
}
```

## Rate Limiting

### Implementation Status
Rate limiting is implemented through the Convex platform and can be configured per endpoint.

### Rate Limit Headers
When rate limiting is active, responses include:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### Rate Limit Exceeded Response
```json
{
  "success": false,
  "error": "Rate limit exceeded. Try again later.",
  "status": 429
}
```

## Integration Examples

### Authentication Flow

#### 1. Request OTP
```bash
curl -X POST https://your-domain.com/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

#### 2. Verify OTP
```bash
curl -X POST https://your-domain.com/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "code": "123456"}'
```

#### 3. Use Token
```bash
curl -X GET https://your-domain.com/api/protected-endpoint \
  -H "Authorization: Bearer your_jwt_token_here"
```

#### 4. Refresh Token
```bash
curl -X POST https://your-domain.com/api/auth/refresh \
  -H "Cookie: x-refresh-token=your_refresh_token"
```

### Webhook Integration

#### Monday.com Webhook Setup
```javascript
// Configure Monday.com webhook
const webhookUrl = 'https://your-domain.com/api/webhooks/monday?type=client';
const events = ['create_pulse', 'change_column_value'];
```

#### Webhook Handler Example
```javascript
// Process webhook response
const response = await fetch(webhookUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(mondayWebhookPayload)
});

const result = await response.json();
if (result.success) {
  console.log('Webhook processed successfully');
} else {
  console.error('Webhook error:', result.error);
}
```

## API Client Libraries

### JavaScript/TypeScript Example

```typescript
class APIClient {
  private baseURL: string;
  private token?: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async authenticate(email: string): Promise<void> {
    // Send OTP
    await fetch(`${this.baseURL}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    // Verify OTP (code would be entered by user)
    const code = prompt('Enter OTP code:');
    const response = await fetch(`${this.baseURL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });

    const result = await response.json();
    if (result.success) {
      this.token = result.token;
    }
  }

  async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    return response.json();
  }
}

// Usage
const client = new APIClient('https://your-domain.com');
await client.authenticate('user@example.com');
const data = await client.makeRequest('/api/some-endpoint');
```

## Development and Testing

### Local Development

```bash
# Start development server
npm run dev

# API available at
http://localhost:3000/api/
```

### Testing Endpoints

#### Using curl
```bash
# Test OTP endpoint
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

#### Using Postman
1. Import OpenAPI spec from `/api/openapi`
2. Configure bearer token authentication
3. Test endpoints with sample data

### API Documentation Access

- **OpenAPI Spec:** `https://your-domain.com/api/openapi`
- **Interactive Docs:** `https://your-domain.com/api/scalar`

## Deployment Considerations

### Environment Variables

Required environment variables for API functionality:

```env
# Authentication
JWKS=your_jwks_configuration

# Monday.com Integration
MONDAY_API_KEY=your_monday_api_key

# Convex Configuration
CONVEX_SITE_URL=your_convex_site_url
```

### CORS Configuration

Configure CORS settings for frontend integration:
```typescript
// Example CORS configuration
app.use('*', cors({
  origin: ['https://your-frontend-domain.com'],
  credentials: true
}));
```

### Security Headers

Recommended security headers:
```
Content-Security-Policy: default-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
```

## Performance and Monitoring

### Caching Strategy

- **OpenID Configuration:** Cached for 15 seconds with stale-while-revalidate
- **JWKS:** Cached for 15 seconds with fallback for errors

### Logging and Monitoring

All API endpoints include comprehensive logging:
- Request/response logging
- Error tracking
- Performance metrics
- Webhook processing status

### Health Checks

Implement health check endpoints for monitoring:
```typescript
app.get('/health', (c) => c.json({ status: 'ok', timestamp: Date.now() }));
```