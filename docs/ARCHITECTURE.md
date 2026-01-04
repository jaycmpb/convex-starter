# My Accounting Dashboard - Technical Architecture

## System Architecture Overview

My Accounting Dashboard is built as a modern, serverless web application that seamlessly integrates with external project management tools while providing a unified client portal experience. The architecture emphasizes real-time collaboration, secure document management, and efficient data synchronization.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                External Project Management Tools             │
│          (Airtable, Monday.com, ClickUp)                    │
└─────────────────────┬───────────────────────────────────────┘
                      │ Webhooks
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    Convex Backend                           │
│  ┌─────────────────┬──────────────────┬─────────────────┐   │
│  │   Auth System   │   Data Layer     │  File Storage   │   │
│  │  (Convex Auth)  │ (Real-time DB)   │   (Built-in)    │   │
│  └─────────────────┴──────────────────┴─────────────────┘   │
│  ┌─────────────────┬──────────────────┬─────────────────┐   │
│  │   AI Services   │   Integrations   │   Notifications │   │
│  │ (Claude/OpenAI) │    (Webhook)     │    (Resend)     │   │
│  └─────────────────┴──────────────────┴─────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │ Real-time Updates
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   Next.js Frontend                          │
│  ┌─────────────────┬──────────────────┬─────────────────┐   │
│  │  Client Portal  │  Staff Dashboard │  Admin Panel    │   │
│  │   (React UI)    │   (React UI)     │   (React UI)    │   │
│  └─────────────────┴──────────────────┴─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack Deep Dive

### Frontend Layer

#### Next.js 15 with App Router
- **Framework**: React 19 with Next.js 15 for modern web application development
- **Routing**: App Router architecture for file-based routing and layout composition
- **TypeScript**: Full type safety across the application stack
- **Server Components**: Leveraging React Server Components for optimal performance

#### UI Components & Styling
- **Tailwind CSS**: Utility-first styling with custom design tokens
- **Radix UI**: Headless, accessible component primitives
- **Component Library**: Custom design system built on top of shadcn/ui
- **Dark Mode**: Theme switching with next-themes
- **Icons**: Lucide React for consistent iconography

#### State Management & Data Fetching
- **Convex React**: Real-time data synchronization with optimistic updates
- **React Hook Form**: Performant form handling with validation
- **Zod**: Runtime type validation for form schemas
- **Context API**: Global state for account selection and user preferences

### Backend Layer

#### Convex Serverless Platform
- **Runtime**: JavaScript/TypeScript serverless functions
- **Database**: Real-time document database with automatic scaling
- **File Storage**: Built-in file storage with CDN distribution
- **Real-time**: WebSocket connections for live data updates
- **Transactions**: ACID transactions for data consistency

#### Authentication System
- **Convex Auth**: Built-in authentication with multiple provider support
- **OTP Authentication**: Email-based one-time passwords via Resend
- **Session Management**: Secure session handling with automatic refresh
- **Role-Based Access**: Hierarchical permissions (owner, admin, member)

#### Data Architecture
- **Schema Definition**: Type-safe database schema with Convex validators
- **Indexing**: Optimized database indexes for query performance
- **Soft Deletes**: Audit trail preservation with deletedAt timestamps
- **External ID Mapping**: Synchronization with external systems

### Integration Layer

#### Webhook Processing
- **Inbound Webhooks**: Real-time data synchronization from external tools
- **Data Normalization**: Transform external data to internal schema
- **Deduplication**: Prevent duplicate records using external IDs
- **Error Handling**: Robust error recovery and retry mechanisms

#### AI Services Integration
- **Anthropic Claude**: Document analysis and content generation
- **OpenAI**: Additional AI capabilities and embeddings
- **Content Analysis**: Automated document completeness assessment
- **Suspicious Item Detection**: AI-powered risk assessment

## Database Schema Architecture

### Core Entity Relationships

```
Users (Staff & Clients)
├── accountAccess (Many-to-Many)
│   └── Accounts (Client Entities)
│       ├── WorkItems (Service Engagements)
│       │   ├── Tasks (Action Items)
│       │   │   ├── TemplateResponses
│       │   │   ├── ChatMessages
│       │   │   └── Documents
│       │   └── Documents
│       ├── Folders (Document Organization)
│       └── Documents
├── Notifications
└── Templates (Staff Created)
```

### Key Tables

#### Users Table
- **Authentication Fields**: Email, phone, verification timestamps
- **Profile Data**: Name, image, role, staff status
- **Account Relationships**: Selected account, access permissions
- **External Integration**: External ID for sync with project management tools

#### Accounts Table
- **Business Logic**: Name, type (personal/business), external ID
- **Soft Deletes**: Audit trail with deletedAt timestamp
- **Access Control**: Multi-user access via accountAccess junction table

#### Work Items Table
- **Service Engagements**: Account association, type, status, due dates
- **Progress Tracking**: Status mapping to percentage completion
- **Staff Assignment**: Team member responsibility
- **External Sync**: External ID for project management integration

#### Tasks Table
- **Action Items**: Name, description, type, status, due dates
- **Template Integration**: Associated questionnaire templates
- **AI Analysis**: Document analysis results (staff-only visibility)
- **Assignment**: Team member and client responsibility

#### Documents Table
- **File Management**: Storage ID, metadata (name, size, MIME type)
- **Organizational**: Folder hierarchy, account/work item/task association
- **Access Control**: Upload tracking, deletion timestamps
- **Version Management**: Automatic replacement of previous versions

### Advanced Features

#### Template System
- **Questionnaire Builder**: Dynamic form creation with multiple question types
- **Conditional Logic**: Question dependencies and branching
- **Response Tracking**: Progress saving and completion status
- **Version Control**: Template snapshots for historical responses

#### Notification System
- **Multi-Channel**: In-app and email notification delivery
- **Event-Driven**: Automatic triggers for task assignments, completions, and reminders
- **User Preferences**: Customizable notification settings
- **Audit Trail**: Delivery tracking and read receipts

## Security Architecture

### Authentication & Authorization
- **Multi-Factor**: Email-based OTP for secure access
- **Session Security**: Secure token management with automatic expiration
- **Role-Based Access Control**: Hierarchical permissions (owner > admin > member)
- **Account Isolation**: Data access restricted by account membership

### Data Protection
- **Encryption**: Data encrypted at rest and in transit
- **File Security**: Secure file upload with type and size validation
- **Audit Logging**: Comprehensive activity tracking
- **GDPR Compliance**: Data retention and deletion policies

### API Security
- **Rate Limiting**: Request throttling to prevent abuse
- **Input Validation**: Comprehensive data validation with Zod schemas
- **CORS Configuration**: Restricted cross-origin resource sharing
- **Webhook Verification**: Signed webhook validation

## Performance & Scalability

### Frontend Optimization
- **Code Splitting**: Route-based and component-based chunking
- **Server Components**: Reduced client-side JavaScript bundle
- **Image Optimization**: Next.js automatic image optimization
- **Caching**: Aggressive caching strategies for static assets

### Backend Optimization
- **Database Indexing**: Optimized queries with strategic indexes
- **Connection Pooling**: Efficient database connection management
- **Function Optimization**: Convex function performance tuning
- **Real-time Efficiency**: Selective data subscription patterns

### Monitoring & Analytics
- **Error Tracking**: Comprehensive error monitoring and alerting
- **Performance Metrics**: Application performance monitoring
- **User Analytics**: Usage tracking with PostHog (optional)
- **Health Checks**: Automated system health monitoring

## Development Architecture

### Code Organization
```
src/
├── app/                    # Next.js App Router
│   ├── (dashboard)/       # Dashboard route group
│   ├── api/               # API routes
│   └── login/             # Authentication pages
├── components/            # React components
│   ├── ui/                # Base UI components
│   ├── providers/         # Context providers
│   ├── templates/         # Template builder
│   ├── documents/         # Document management
│   └── notifications/     # Notification system
├── hooks/                 # Custom React hooks
└── lib/                   # Utility functions

convex/
├── schema.ts              # Database schema
├── auth.js               # Authentication config
├── functions/            # Backend functions
└── components/           # Convex components
```

### Development Workflow
- **Type Safety**: End-to-end TypeScript coverage
- **Code Quality**: ESLint and Prettier for consistent code style
- **Testing**: Vitest for unit and integration testing
- **Hot Reloading**: Development server with instant updates

## Deployment Architecture

### Production Environment
- **Hosting**: Vercel for Next.js frontend deployment
- **Backend**: Convex cloud for serverless backend
- **CDN**: Global content delivery for optimal performance
- **SSL**: End-to-end HTTPS encryption

### Environment Management
- **Configuration**: Environment-based variable management
- **Secrets**: Secure secret storage and rotation
- **Monitoring**: Production monitoring and alerting
- **Backup**: Automated data backup and recovery

This architecture provides a robust, scalable foundation for accounting firms to deliver exceptional client experiences while maintaining security, performance, and integration capabilities.