# Work Management System

The My Accounting Dashboard application features a comprehensive work management system that organizes client work through work items and tasks with a flexible workflow system.

## Overview

The work management system is built around two core entities:
- **Work Items**: High-level projects or engagements for clients
- **Tasks**: Specific deliverables within work items that can be assigned, tracked, and completed

## Work Items Structure

### Database Schema
```typescript
workItems: {
  accountId: Id<"accounts">     // Associated client account
  typeId: Id<"workItemTypes">   // Type configuration (tax prep, audit, etc.)
  status: string                // Current status from type configuration
  externalId?: string          // Monday.com board item ID
  name?: string                // Work item title
  dueAt?: number               // Due date timestamp
}
```

### Work Item Types
Work item types define the available workflow statuses and their completion percentages:

```typescript
workItemTypes: {
  name: string                 // Type name (e.g., "Tax Preparation", "Audit")
  statusConfig: Array<{
    status: string             // Status name
    progress: number          // Completion percentage (0-100)
  }>
}
```

Example status configurations:
- **Tax Preparation**: "Not Started" (0%) → "In Progress" (25%) → "Client Review" (75%) → "Complete" (100%)
- **Audit**: "Planning" (10%) → "Fieldwork" (40%) → "Review" (80%) → "Complete" (100%)

## Tasks Structure

### Database Schema
```typescript
tasks: {
  workItemId: Id<"workItems">      // Parent work item
  name: string                     // Task title
  status: string                   // Current status
  type?: "document" | "questionnaire" | "question" | "chat"
  description?: string             // Task description
  dueAt?: number                  // Due date timestamp
  externalId?: string             // Monday.com task ID
  teamAssigneeId?: Id<"users">    // Staff member assigned
  templateId?: Id<"templates">    // Associated questionnaire template
  aiAnalysis?: {                  // AI-generated document analysis (staff-only)
    summary: string
    completeness: "complete" | "incomplete" | "unclear"
    missingItems: string[]
    suspiciousItems: string[]
    analyzedAt: number
    analyzedDocumentIds: Id<"documents">[]
  }
}
```

### Task Types

#### 1. Document Tasks (`type: "document"`)
- Require clients to upload specific documents
- Support file preview and download
- Include AI-powered analysis for staff review
- Automatically update status to "Client Responded" when documents uploaded

#### 2. Questionnaire Tasks (`type: "questionnaire"`)
- Use custom templates with multiple question types
- Track response progress and completion
- Support conditional logic and validation
- Store structured response data

#### 3. Chat Tasks (`type: "chat"`)
- Enable real-time messaging between staff and clients
- Support message history and persistence
- Lock conversation when task is complete

#### 4. Question Tasks (`type: "question"`)
- Simple single-question tasks
- Quick data collection without full questionnaire

## Status Tracking and Progress Visualization

### Work Item Progress
- Progress calculated from associated task completion
- Visual progress bars show completion percentage
- Status updates sync with external systems (Monday.com)

### Task Status Flow
Common task status progression:
1. **New** → Task created but not started
2. **In Progress** → Staff working on task
3. **Client Review** → Awaiting client response/documents
4. **Client Responded** → Client has provided required information
5. **Complete** → Task finished and approved

### Status Icons
- ✅ **Complete/Done/Closed**: Green checkmark
- 🔄 **In Progress/Working**: Blue clock
- ⭕ **New/Pending**: Gray circle

## Filtering and Search Capabilities

### Client View Filters
- **Status Filter**: Filter work items by status
- **Type Filter**: Filter by work item type
- **Due Date**: Sort by upcoming deadlines
- **Search**: Text search across work item and task names

### Staff View Additional Filters
- **Assigned To**: Filter by team member
- **Account**: Filter by client account
- **Priority**: Based on due dates and status

## Staff vs Client Views

### Staff View Features
- Full visibility into all work items and tasks
- AI analysis results for document tasks
- Task assignment and status management
- Integration with Monday.com for external syncing
- Document upload capabilities for initial materials
- Progress analytics and reporting

### Client View Features
- Work items and tasks specific to their account
- Task completion through document upload or questionnaire
- Chat functionality for questions and clarification
- Progress tracking with visual indicators
- Document download for previously uploaded files
- Read-only view of completed work

### Permission Differences
```typescript
// User roles determine access level
users: {
  isStaff?: boolean           // Staff vs client designation
  role?: "owner" | "admin" | "member"  // Permission level
}
```

## Work Item Lifecycle

### Creation
1. Work items typically created via Monday.com webhook integration
2. Associated with client account through external ID mapping
3. Initial status set based on work item type configuration

### Task Assignment
1. Tasks created as work progresses
2. Staff can assign tasks to specific team members
3. Due dates set based on work item timeline
4. Task types determined by required client deliverables

### Client Interaction
1. Clients receive notifications when tasks assigned
2. Document upload or questionnaire completion marks client response
3. Chat enables real-time communication
4. Task status updates trigger notifications

### Completion
1. All tasks must be completed before work item completion
2. Final status update triggers completion notifications
3. Documents and responses archived for future reference
4. Integration updates external systems

## Integration Points

### Monday.com Synchronization
- Bidirectional sync of work items, tasks, and status updates
- External IDs maintain mapping between systems
- Webhooks handle real-time updates

### Notification System
- Task assignment notifications
- Status change alerts
- Due date reminders
- Completion confirmations

### Document Management
- Tasks can be associated with specific documents
- File organization within work item context
- Version control for document updates

## Analytics and Reporting

### Progress Tracking
- Work item completion percentages
- Task completion rates by type
- Time-to-completion metrics
- Client response times

### Staff Performance
- Tasks completed by team member
- Average completion times
- Client satisfaction tracking
- Workload distribution analysis

This work management system provides a comprehensive solution for tracking client engagements from initial assignment through completion, with clear visibility and communication channels for both staff and clients.