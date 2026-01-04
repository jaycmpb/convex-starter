# My Accounting Dashboard - Deployment Guide

This guide provides comprehensive instructions for deploying My Accounting Dashboard in both development and production environments.

## Prerequisites

### System Requirements
- **Runtime**: Node.js 18+ or Bun 1.0+
- **Package Manager**: Bun (recommended) or npm/yarn
- **Git**: For version control and deployment

### Required Services
- **Convex Account**: Backend and database hosting
- **Resend Account**: Email notifications and OTP delivery
- **Vercel Account**: Frontend hosting (recommended)
- **PostHog Account**: Analytics (optional)

### External Integrations (Choose One)
- **Airtable**: Project management integration
- **Monday.com**: Project management integration  
- **ClickUp**: Project management integration

## Environment Setup

### Required Environment Variables

Create a `.env.local` file in the project root with the following variables:

```bash
# Convex Configuration (Required)
CONVEX_DEPLOYMENT=https://your-deployment-name.convex.cloud
CONVEX_URL=https://your-deployment-name.convex.cloud

# Resend Configuration (Required for email/OTP)
RESEND_API_KEY=re_your_resend_api_key

# AI Services (Required for document analysis)
ANTHROPIC_API_KEY=sk-ant-your_anthropic_key
OPENAI_API_KEY=sk-your_openai_key

# PostHog Analytics (Optional)
POSTHOG_API_KEY=phc_your_posthog_api_key

# Integration Webhook Secrets (Required for chosen platform)
AIRTABLE_WEBHOOK_SECRET=your_airtable_webhook_secret
MONDAY_WEBHOOK_SECRET=your_monday_webhook_secret
CLICKUP_WEBHOOK_SECRET=your_clickup_webhook_secret

# Authentication (Auto-configured by Convex)
CONVEX_SITE_URL=https://your-app-domain.com
```

### Service Configuration

#### 1. Convex Setup

1. **Create Convex Project**
   ```bash
   npm install -g convex
   convex login
   convex init
   ```

2. **Deploy Backend**
   ```bash
   convex deploy
   ```

3. **Configure Authentication**
   ```bash
   # Auth is configured via convex/auth.config.js
   # Webhook providers are set in convex/auth.js
   ```

#### 2. Resend Configuration

1. **Create Resend Account**: Sign up at [resend.com](https://resend.com)
2. **Generate API Key**: Create API key in dashboard
3. **Verify Domain**: Add and verify your sending domain
4. **Configure Templates**: Set up email templates for notifications

#### 3. AI Service Setup

1. **Anthropic Claude**
   - Create account at [console.anthropic.com](https://console.anthropic.com)
   - Generate API key for document analysis features

2. **OpenAI (Optional)**
   - Create account at [platform.openai.com](https://platform.openai.com)
   - Generate API key for additional AI features

## Development Deployment

### Local Development Setup

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd accounting-dashboard
   ```

2. **Install Dependencies**
   ```bash
   # Using Bun (recommended)
   bun install
   
   # Or using npm
   npm install
   ```

3. **Set Up Environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Initialize Convex**
   ```bash
   bun convex dev
   # This will:
   # - Set up your Convex backend
   # - Deploy schema and functions
   # - Start development mode
   ```

5. **Start Development Server**
   ```bash
   # In a separate terminal
   bun dev
   ```

6. **Access Application**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Convex Dashboard: [https://dashboard.convex.dev](https://dashboard.convex.dev)

### Development Workflow

1. **Database Schema Changes**
   ```bash
   # Edit convex/schema.ts
   # Changes are automatically deployed in dev mode
   ```

2. **Backend Function Updates**
   ```bash
   # Edit files in convex/
   # Convex dev mode provides hot reloading
   ```

3. **Frontend Changes**
   ```bash
   # Edit files in src/
   # Next.js dev server provides hot reloading
   ```

## Production Deployment

### Frontend Deployment (Vercel)

1. **Prepare for Production**
   ```bash
   bun run build
   bun run start # Test production build locally
   ```

2. **Deploy to Vercel**
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Deploy
   vercel
   
   # Or connect GitHub repository for automatic deployments
   ```

3. **Configure Environment Variables in Vercel**
   - Go to Vercel project settings
   - Add all required environment variables
   - Redeploy if needed

### Backend Deployment (Convex)

1. **Deploy Production Backend**
   ```bash
   # From your local environment
   convex deploy --prod
   ```

2. **Configure Production Environment**
   ```bash
   # Set production environment variables in Convex dashboard
   convex env set RESEND_API_KEY your_production_key --prod
   convex env set ANTHROPIC_API_KEY your_production_key --prod
   # Add all other required environment variables
   ```

3. **Update Frontend Configuration**
   ```bash
   # Update .env.local or Vercel environment variables
   CONVEX_DEPLOYMENT=https://your-prod-deployment.convex.cloud
   CONVEX_URL=https://your-prod-deployment.convex.cloud
   ```

### Database Migration

1. **Schema Deployment**
   ```bash
   # Schema changes are automatically applied
   # Convex handles migrations automatically
   ```

2. **Data Seeding (if needed)**
   ```bash
   # Create seed functions in convex/seed.ts
   # Run via Convex dashboard or CLI
   ```

## Integration Configuration

### Webhook Setup

1. **Configure Webhook Endpoints**
   ```
   Production: https://your-domain.com/api/webhooks/[provider]
   Development: https://your-convex-deployment.convex.site/api/webhooks/[provider]
   ```

2. **Airtable Integration**
   ```bash
   # Configure webhook in Airtable base
   # Point to: /api/webhooks/airtable
   # Include webhook secret in headers
   ```

3. **Monday.com Integration**
   ```bash
   # Configure webhook in Monday.com
   # Point to: /api/webhooks/monday
   # Include webhook secret in payload
   ```

4. **ClickUp Integration**
   ```bash
   # Configure webhook in ClickUp
   # Point to: /api/webhooks/clickup
   # Include webhook secret in headers
   ```

### Authentication Configuration

1. **Email Templates**
   - Configure OTP email templates in Resend
   - Customize branding and styling
   - Set up sender domain and reputation

2. **Session Configuration**
   ```javascript
   // Configured in convex/auth.js
   export const { auth, signIn, signOut } = convexAuth({
     providers: [ResendOTP],
     sessionDuration: 1000 * 60 * 60 * 24 * 30, // 30 days
   });
   ```

## Security Configuration

### SSL/TLS Setup

1. **Domain Configuration**
   ```bash
   # Vercel automatically provides SSL for custom domains
   # Configure custom domain in Vercel dashboard
   ```

2. **Security Headers**
   ```javascript
   // next.config.ts includes security headers
   // Content Security Policy
   // X-Frame-Options
   // X-Content-Type-Options
   ```

### API Security

1. **Rate Limiting**
   ```bash
   # Configured in Convex functions
   # Automatic DDoS protection via Convex
   ```

2. **CORS Configuration**
   ```javascript
   // Configured in Convex HTTP actions
   // Restricts origins to your domain
   ```

## Monitoring & Maintenance

### Health Checks

1. **Application Monitoring**
   ```bash
   # Set up health check endpoint
   # Monitor via Vercel Analytics or external service
   ```

2. **Database Monitoring**
   ```bash
   # Convex provides built-in monitoring
   # View metrics in Convex dashboard
   ```

### Backup & Recovery

1. **Data Backup**
   ```bash
   # Convex provides automatic backups
   # Export data via Convex dashboard if needed
   ```

2. **File Storage Backup**
   ```bash
   # Files stored in Convex are automatically backed up
   # No additional configuration required
   ```

### Performance Optimization

1. **Frontend Optimization**
   ```bash
   # Next.js automatically optimizes bundles
   # Monitor Core Web Vitals via Vercel Analytics
   ```

2. **Backend Optimization**
   ```bash
   # Monitor function performance in Convex dashboard
   # Optimize queries and database indexes as needed
   ```

## Troubleshooting

### Common Issues

1. **Environment Variable Issues**
   ```bash
   # Check variable names and values
   # Ensure all required variables are set
   # Restart services after changes
   ```

2. **Database Connection Issues**
   ```bash
   # Verify Convex deployment URL
   # Check Convex dashboard for errors
   # Ensure schema is properly deployed
   ```

3. **Email/OTP Issues**
   ```bash
   # Verify Resend API key and domain
   # Check email deliverability settings
   # Test with different email providers
   ```

4. **Integration Webhook Issues**
   ```bash
   # Verify webhook URLs and secrets
   # Check webhook logs in provider dashboard
   # Test webhook endpoints manually
   ```

### Debug Mode

1. **Enable Detailed Logging**
   ```bash
   # Development mode provides detailed logs
   # Check Convex dashboard for function logs
   # Use browser dev tools for frontend issues
   ```

2. **Performance Debugging**
   ```bash
   # Use React DevTools Profiler
   # Monitor Convex function execution times
   # Check network requests in browser dev tools
   ```

## Scaling Considerations

### Performance Scaling
- **Convex**: Automatically scales based on usage
- **Vercel**: Edge deployment with global CDN
- **Database**: Built-in horizontal scaling

### Feature Scaling
- **Multi-tenancy**: Design supports single-firm architecture
- **User Limits**: No hard limits, scales with Convex pricing
- **Storage**: Unlimited file storage with Convex

For additional support, refer to the service documentation:
- [Convex Documentation](https://docs.convex.dev)
- [Vercel Documentation](https://vercel.com/docs)
- [Resend Documentation](https://resend.com/docs)