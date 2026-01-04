# My Accounting Dashboard (MAD)

A comprehensive client-facing dashboard application for accounting firms that enables seamless interaction between clients and their accounting services. This platform provides a unified interface for managing accounting engagements, document uploads, task tracking, and real-time collaboration.

## Project Overview

My Accounting Dashboard is a modern web application designed specifically for accounting firms to streamline client interactions and improve service delivery. The platform serves both clients and staff with role-based access, providing secure, real-time access to accounting services, document management, and engagement tracking.

### Key Benefits

- **Client Self-Service**: Empowers clients to track progress, upload documents, and manage their accounting requirements independently
- **Staff Efficiency**: Provides accounting staff with centralized client management, task assignment, and document review capabilities
- **Seamless Integration**: Connects with popular project management tools (Airtable, Monday.com, ClickUp) via webhooks
- **Real-Time Updates**: Live synchronization ensures all parties have access to the latest information
- **Secure Document Management**: Enterprise-grade security with role-based access control

## Key Features

### For Clients
- **Multi-Account Management**: Access personal, business, and other account types from one dashboard
- **Engagement Tracking**: Real-time visibility into service progress with percentage completion
- **Document Upload**: Secure file uploads with automatic organization and version management
- **Task Management**: View assigned tasks and mark them complete when requirements are met
- **Chat Communication**: Direct messaging with assigned staff members
- **Questionnaire System**: Complete structured forms and questionnaires for service requirements
- **Notification System**: Email and in-app alerts for important updates

### For Staff
- **Client Portfolio Management**: Centralized view of all clients and their accounts
- **Work Item Assignment**: Assign and track accounting engagements across team members
- **AI-Powered Document Analysis**: Automated analysis of uploaded documents for completeness and suspicious items
- **Template Builder**: Create and manage questionnaire templates for different service types
- **Progress Tracking**: Update engagement statuses with automatic client notifications
- **Document Review**: Efficient review and approval workflows for client-submitted documents
- **Reporting Dashboard**: Analytics and insights on client engagement and service delivery

### Integration Capabilities
- **Webhook Integration**: Real-time sync with Airtable, Monday.com, and ClickUp
- **Email Notifications**: Automated alerts via Resend for task updates and status changes
- **External ID Tracking**: Maintains synchronization with external project management systems
- **User Provisioning**: Automatic user creation when new clients are added to external tools

## Technology Stack

### Frontend
- **Next.js 15**: React-based framework with App Router and TypeScript support
- **React 19**: Latest React features with improved performance and developer experience
- **Tailwind CSS**: Utility-first styling with custom design system
- **Radix UI**: Accessible component primitives for consistent user interface
- **React Hook Form**: Performant forms with validation
- **Lucide React**: Modern icon library
- **Sonner**: Toast notifications
- **Next Themes**: Dark/light mode support

### Backend & Database
- **Convex**: Serverless backend with real-time database and built-in file storage
- **Convex Auth**: Authentication system with OTP via Resend
- **TypeScript**: End-to-end type safety
- **Zod**: Runtime type validation and schema definition

### AI & Integrations
- **Anthropic Claude**: AI-powered document analysis and insights
- **OpenAI**: Additional AI capabilities for content generation
- **Resend**: Email service for notifications and OTP delivery
- **Monday.com API**: Project management integration
- **Hono**: Lightweight web framework for API endpoints

### Development Tools
- **Bun**: Fast JavaScript runtime and package manager
- **Prettier**: Code formatting
- **ESLint**: Code linting and quality assurance
- **Vitest**: Fast unit testing framework
- **React Email**: Email template system

## User Roles

### Client Users
- **Access Level**: Account-specific access with role-based permissions
- **Capabilities**: Document upload, task completion, progress tracking, communication
- **Authentication**: Email-based OTP authentication via Resend
- **Multi-Account Support**: Can access multiple accounts (personal, business, etc.)

### Staff Users
- **Access Level**: Full system access with administrative capabilities
- **Capabilities**: Client management, work item assignment, document review, reporting
- **Special Features**: AI analysis tools, template builder, advanced notifications
- **Permissions**: Can be assigned as account owners or collaborators

## Quick Start Guide

### Prerequisites
- Node.js 18+ or Bun runtime
- Convex account for backend services
- Resend account for email notifications

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd accounting-dashboard
   ```

2. **Install dependencies**
   ```bash
   bun install
   # or
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Configure the following variables:
   - `CONVEX_DEPLOYMENT`: Your Convex deployment URL
   - `CONVEX_URL`: Your Convex backend URL
   - `POSTHOG_API_KEY`: Optional analytics key

4. **Initialize Convex backend**
   ```bash
   bun convex dev
   ```

5. **Start development server**
   ```bash
   bun dev
   ```

6. **Access the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser

### First Steps
1. Configure your integration source (Airtable, Monday.com, or ClickUp)
2. Set up webhook endpoints for data synchronization
3. Create initial user accounts and assign roles
4. Configure work item types and status workflows
5. Set up document folder structures

## Project Structure

```
accounting-dashboard/
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   └── lib/                # Utility functions
├── convex/                 # Backend functions and schema
├── emails/                 # Email templates
├── docs/                   # Documentation
└── public/                 # Static assets
```

## Support & Documentation

- **Architecture Documentation**: See [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Deployment Guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **API Documentation**: Available at `/api/docs` when running locally

## License

This project is proprietary and intended for use by authorized accounting firms only.