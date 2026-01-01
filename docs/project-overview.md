# Accounting Dashboard - Project Overview

## Project Description

This is a client-facing dashboard application for an accounting firm that enables clients to interact with their accounting services, view progress, manage tasks, and handle document uploads. The dashboard serves both clients and the firm's staff, providing a unified interface for managing accounting engagements.

## Core Objectives

### Primary Goals

1. **Client Self-Service Portal**: Provide clients with a secure, user-friendly interface to:
   - View their accounts and service engagements
   - Track task progress and status
   - View and upload required documents
   - Monitor engagement progress and completion status

2. **Seamless Integration**: Integrate with the firm's existing project management tools (Airtable, Monday.com, or ClickUp) via webhooks to automatically sync data without manual entry.

3. **Unified Experience**: Create a single dashboard that both clients and staff can use, with role-based access control to ensure appropriate visibility and permissions.

4. **Document Management**: Enable efficient document organization and management with folder structures, allowing documents to be attached at multiple levels (account, work item, or task).

## Architecture Overview

### Technology Stack

- **Backend**: Convex (serverless backend with real-time database)
- **Authentication**: Convex Auth (with Resend OTP)
- **File Storage**: Convex file storage
- **Integration Sources**: Airtable, Monday.com, ClickUp (via webhooks)

### System Architecture

```
External Tool (Airtable/Monday/ClickUp)
    ↓ (webhook)
Convex Backend
    ├── Data Normalization
    ├── User Management (Convex Auth)
    ├── Document Storage
    └── Real-time Updates
    ↓
Client Dashboard (UI)
```

## Data Model

### Core Entities

The system is built around a hierarchical data structure:

```
Firm (Single Instance)
└── Users (Staff & Clients)
└── Accounts (Client Entities)
    ├── Account Access (User Permissions)
    ├── Work Items (Service Engagements)
    │   ├── Tasks (Action Items)
    │   └── Documents
    ├── Folders (Document Organization)
    └── Documents
```

### Key Concepts

- **Accounts**: Represent client entities (e.g., "John Smith Personal", "ABC Consulting LLC"). A single person can have multiple accounts (personal tax, business tax, bookkeeping, advisory, etc.).

- **Work Items**: Service engagements being delivered (e.g., "2024 Tax Return", "Monthly Bookkeeping"). Each work item has:
  - A type (configurable by the firm, e.g., "Tax Return")
  - A status that maps to progress percentage
  - An assigned staff member
  - Tasks and documents

- **Tasks**: Action items within a work item (e.g., "Upload W-2", "Review draft return"). Tasks have statuses: PENDING → IN_PROGRESS → COMPLETE.

- **Documents**: Files that can be attached at multiple levels:
  - Account level (general documents for that entity)
  - Work item level (documents for that specific service)
  - Task level (the specific file requested by that task)
  - Organized in folders for better structure

## Key Features

### For Clients

- **Account Management**: View all accounts they have access to
- **Engagement Tracking**: See work items and their progress status
- **Task Management**: View tasks and mark them as complete when requirements are met
- **Document Upload**: Upload required documents, with automatic replacement of previous versions
- **Document Organization**: Browse documents organized in folders

### For Staff

- **Client Management**: View all clients and their accounts
- **Work Item Assignment**: Assign work items to staff members
- **Progress Tracking**: Update work item statuses (maps to progress percentages)
- **Task Management**: Create and manage tasks within work items
- **Document Review**: Review and manage client-uploaded documents

### Integration Features

- **Webhook Ingestion**: Automatically receive updates from external tools
- **External ID Tracking**: Store external system IDs for deduplication and sync
- **User Provisioning**: Automatically create user records when new clients are added in the external tool

## Workflow

### Client Onboarding

1. Firm adds client/contact in their backend tool (Airtable/Monday/ClickUp)
2. Webhook fires to Convex backend
3. User record created in Convex with external ID
4. Client receives email with OTP to access the dashboard (Convex Auth + Resend)

### Document Upload Flow

1. Client uploads document via dashboard
2. Document replaces previous version if one exists (no approval workflow)
3. Document stored in Convex file storage
4. Metadata stored in database with references to account/work item/task
5. Document visible to both client and assigned staff member

### Status Tracking

- Work item statuses are configurable per work item type
- Default mapping: NOT_STARTED (0%) → IN_PROGRESS (33%) → REVIEW (66%) → COMPLETE (100%)
- Status-to-progress mapping handled in UI layer
- Firm can configure custom status flows per work item type

## Access Control

- **Account Access**: Users are granted access to specific accounts with permission levels:
  - `owner`: Full control
  - `editor`: Can edit content
  - `viewer`: Read-only access

- **Role-Based**: Users have roles (configurable per firm) and can be marked as staff or client
- **Multi-User Accounts**: Business accounts can have multiple users with access (e.g., business partners)

## Design Principles

1. **Single-Firm System**: Designed for one accounting firm, not multi-tenant
2. **Data Normalization**: External tool data is normalized to internal schema (not 1:1 mirror)
3. **Soft Deletes**: All entities support soft deletion for audit trails
4. **External ID Tracking**: All entities store external IDs for webhook deduplication
5. **Flexible Structure**: Folder organization is freeform (not template-based initially)

## Future Considerations

- Email notifications (Resend integration) for task updates, document uploads, status changes
- File size and type constraints for document uploads
- Integration with external tools to send documents back to source system
- Enhanced folder templates per engagement type
- Advanced reporting and analytics

