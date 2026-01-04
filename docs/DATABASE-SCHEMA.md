# Database Schema Documentation

## Overview

The My Accounting Dashboard uses Convex as its database platform, providing a strongly-typed, real-time database with automatic validation and indexing. This document provides a comprehensive overview of the database schema, relationships, and performance optimizations.

## Schema Definition

The database schema is defined using Convex's `defineSchema` and `defineTable` functions with strict validation through the `v` (values) library. All schemas are centrally managed in `/convex/schema.ts`.

### Base Configuration

```typescript
import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Convex Auth tables (authAccounts, authSessions, authRefreshTokens, etc.)
  ...authTables,
  
  // Custom application tables...
});
```

## Complete Schema Description

### 1. Settings Table

**Purpose:** Global application configuration and integration settings.

```typescript
settings: defineTable({
  name: v.string(),
  roles: v.array(v.string()),
  integrationSource: v.union(v.literal("airtable"), v.literal("monday"), v.literal("clickup")),
  webhookSecret: v.optional(v.string()),
})
```

**Fields:**
- `name` - Configuration name/identifier
- `roles` - Array of available user roles in the system
- `integrationSource` - External integration platform (Airtable, Monday.com, ClickUp)
- `webhookSecret` - Optional secret for webhook authentication

**Use Cases:**
- System-wide configuration management
- Integration platform selection
- Webhook security configuration

### 2. Users Table (Extended Auth)

**Purpose:** User accounts with custom fields extending Convex Auth.

```typescript
users: defineTable({
  // Auth Fields
  email: v.optional(v.string()),
  emailVerificationTime: v.optional(v.number()),
  phone: v.optional(v.string()),
  phoneVerificationTime: v.optional(v.number()),
  image: v.optional(v.string()),
  isAnonymous: v.optional(v.boolean()),
  
  // Custom Fields
  role: v.optional(v.union(v.literal("owner"), v.literal("admin"), v.literal("member"))),
  isStaff: v.optional(v.boolean()),
  isActive: v.optional(v.boolean()),
  externalId: v.optional(v.string()),
  firstName: v.optional(v.string()),
  lastName: v.optional(v.string()),
  selectedAccountId: v.optional(v.id("accounts")),
})
.index("email", ["email"])
.index("phone", ["phone"])
.index("by_externalId", ["externalId"])
.index("by_isStaff", ["isStaff"])
```

**Key Features:**
- Extends Convex Auth with custom fields
- Role-based access control (owner/admin/member)
- Staff vs. client differentiation
- External system integration via `externalId`
- Account selection for multi-account access

### 3. Accounts Table

**Purpose:** Client accounts (personal or business) that users can access.

```typescript
accounts: defineTable({
  name: v.string(),
  type: v.union(v.literal("personal"), v.literal("business")),
  externalId: v.optional(v.string()),
  deletedAt: v.optional(v.number()),
})
.index("by_externalId", ["externalId"])
.index("by_type", ["type"])
```

**Relationships:**
- One-to-many with `users` via `accountAccess`
- One-to-many with `workItems`
- One-to-many with `folders`
- One-to-many with `documents`

### 4. Account Access Table (Junction)

**Purpose:** Many-to-many relationship between users and accounts.

```typescript
accountAccess: defineTable({
  accountId: v.id("accounts"),
  userId: v.id("users"),
})
.index("by_accountId", ["accountId"])
.index("by_userId", ["userId"])
.index("by_accountId_userId", ["accountId", "userId"])
```

**Design Pattern:** Junction table for many-to-many relationships with optimized compound indexes.

### 5. Work Item Types Table

**Purpose:** Categories of accounting work with status progression configuration.

```typescript
workItemTypes: defineTable({
  name: v.string(),
  statusConfig: v.array(
    v.object({
      status: v.string(),
      progress: v.number(),
    }),
  ),
  deletedAt: v.optional(v.number()),
})
.index("by_name", ["name"])
```

**Features:**
- Configurable status workflows
- Progress tracking for each status
- Soft deletion support

### 6. Work Items Table

**Purpose:** Major accounting projects/engagements for clients.

```typescript
workItems: defineTable({
  accountId: v.id("accounts"),
  typeId: v.id("workItemTypes"),
  status: v.string(),
  externalId: v.optional(v.string()),
  name: v.optional(v.string()),
  dueAt: v.optional(v.number()),
  _deletionTime: v.optional(v.number()),
})
.index("by_accountId", ["accountId"])
.index("by_typeId", ["typeId"])
.index("by_externalId", ["externalId"])
.index("by_accountId_status", ["accountId", "status"])
```

**Key Features:**
- Links to account and work item type
- External system synchronization
- Status-based filtering
- Soft deletion with `_deletionTime`

### 7. Tasks Table

**Purpose:** Individual tasks within work items with AI analysis capabilities.

```typescript
tasks: defineTable({
  workItemId: v.id("workItems"),
  name: v.string(),
  status: v.string(),
  type: v.optional(v.union(v.literal("document"), v.literal("questionnaire"), v.literal("question"), v.literal("chat"))),
  description: v.optional(v.string()),
  dueAt: v.optional(v.number()),
  externalId: v.optional(v.string()),
  teamAssigneeId: v.optional(v.id("users")),
  templateId: v.optional(v.id("templates")),
  deletedAt: v.optional(v.number()),
  
  /** AI-generated analysis of uploaded documents. Staff-only, not visible to clients. */
  aiAnalysis: v.optional(
    v.object({
      /** Plain-English summary of uploaded documents. */
      summary: v.string(),
      /** Completeness assessment: complete, incomplete, or unclear. */
      completeness: v.union(v.literal("complete"), v.literal("incomplete"), v.literal("unclear")),
      /** List of items that appear to be missing. */
      missingItems: v.array(v.string()),
      /** List of items that seem suspicious or need review. */
      suspiciousItems: v.array(v.string()),
      /** Timestamp of when the analysis was generated. */
      analyzedAt: v.number(),
      /** IDs of documents that were analyzed. */
      analyzedDocumentIds: v.array(v.id("documents")),
    }),
  ),
})
.index("by_workItemId", ["workItemId"])
.index("by_externalId", ["externalId"])
.index("by_workItemId_status", ["workItemId", "status"])
.index("by_teamAssigneeId", ["teamAssigneeId"])
.index("by_templateId", ["templateId"])
```

**Special Features:**
- AI analysis integration for document intake
- Multiple task types (document, questionnaire, question, chat)
- Template-based task creation
- Team assignment tracking

### 8. Chat Messages Table

**Purpose:** Communication between staff and clients within tasks.

```typescript
chatMessages: defineTable({
  taskId: v.id("tasks"),
  content: v.string(),
  senderType: v.union(v.literal("contact"), v.literal("employee"), v.literal("ai")),
  senderName: v.string(),
  senderId: v.optional(v.id("users")),
  externalId: v.optional(v.string()),
  createdAt: v.number(),
})
.index("by_taskId", ["taskId"])
.index("by_externalId", ["externalId"])
.index("by_taskId_createdAt", ["taskId", "createdAt"])
```

**Features:**
- Multi-participant messaging (contacts, employees, AI)
- Chronological message ordering
- External system synchronization

### 9. Folders Table (Hierarchical)

**Purpose:** Hierarchical document organization with materialized path pattern.

```typescript
folders: defineTable({
  accountId: v.id("accounts"),
  parentFolderId: v.optional(v.id("folders")),
  name: v.string(),
  /** Materialized path for fast breadcrumb/ancestor queries. Format: "/folderId1/folderId2/..." */
  path: v.string(),
  /** Depth level (0 = root folder). */
  depth: v.number(),
  deletedAt: v.optional(v.number()),
})
.index("by_accountId", ["accountId"])
.index("by_parentFolderId", ["parentFolderId"])
.index("by_accountId_parentFolderId", ["accountId", "parentFolderId"])
.index("by_path", ["path"])
.index("by_accountId_depth", ["accountId", "depth"])
```

**Design Pattern:** Materialized path for efficient hierarchical queries:
- Fast ancestor/descendant lookups
- Breadcrumb generation
- Depth-based organization

### 10. Documents Table

**Purpose:** File storage with multi-context linking.

```typescript
documents: defineTable({
  storageId: v.id("_storage"),
  folderId: v.optional(v.id("folders")),
  accountId: v.optional(v.id("accounts")),
  workItemId: v.optional(v.id("workItems")),
  taskId: v.optional(v.id("tasks")),
  name: v.string(),
  mimeType: v.optional(v.string()),
  size: v.optional(v.number()),
  uploadedBy: v.id("users"),
  deletedAt: v.optional(v.number()),
})
.index("by_folderId", ["folderId"])
.index("by_accountId", ["accountId"])
.index("by_workItemId", ["workItemId"])
.index("by_taskId", ["taskId"])
.index("by_uploadedBy", ["uploadedBy"])
```

**Features:**
- Convex file storage integration
- Multiple context associations (folder, account, work item, task)
- File metadata tracking
- Upload attribution

### 11. Notifications Table

**Purpose:** In-app and email notifications for users.

```typescript
notifications: defineTable({
  userId: v.id("users"),
  accountId: v.id("accounts"),
  type: v.union(v.literal("task_assigned"), v.literal("task_completed"), v.literal("task_reminder"), v.literal("task_reopened"), v.literal("workitem_completed")),
  title: v.string(),
  message: v.string(),
  taskId: v.optional(v.id("tasks")),
  workItemId: v.optional(v.id("workItems")),
  readAt: v.optional(v.number()),
  emailSentAt: v.optional(v.number()),
})
.index("by_userId", ["userId"])
.index("by_userId_readAt", ["userId", "readAt"])
.index("by_accountId", ["accountId"])
```

**Notification Types:**
- Task assignment notifications
- Task completion updates
- Reminder notifications
- Work item status changes

### 12. Templates Table

**Purpose:** Questionnaire and form templates with conditional logic.

```typescript
templates: defineTable({
  name: v.string(),
  description: v.optional(v.string()),
  sections: v.optional(v.array(v.object({
    id: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    collapsed: v.optional(v.boolean()),
  }))),
  questions: v.array(v.object({
    id: v.string(),
    type: v.union(
      v.literal("short_text"), v.literal("long_text"), v.literal("email"),
      v.literal("phone"), v.literal("number"), v.literal("date"),
      v.literal("single_choice"), v.literal("multiple_choice"), v.literal("dropdown"),
      v.literal("consent"), v.literal("file_upload"), v.literal("signature"),
      v.literal("rating"), v.literal("address")
    ),
    title: v.string(),
    description: v.optional(v.string()),
    required: v.boolean(),
    sectionId: v.optional(v.string()),
    options: v.optional(v.array(v.string())),
    validations: v.optional(v.object({
      min: v.optional(v.number()),
      max: v.optional(v.number()),
      pattern: v.optional(v.string()),
      minLength: v.optional(v.number()),
      maxLength: v.optional(v.number()),
    })),
    condition: v.optional(v.object({
      questionId: v.string(),
      operator: v.union(v.literal("equals"), v.literal("not_equals"), v.literal("contains")),
      value: v.string(),
    })),
  })),
  locked: v.optional(v.boolean()),
  externalId: v.optional(v.string()),
  createdBy: v.id("users"),
  deletedAt: v.optional(v.number()),
})
.index("by_externalId", ["externalId"])
.index("by_createdBy", ["createdBy"])
```

**Advanced Features:**
- Rich question types (text, choice, file upload, signature, etc.)
- Conditional logic between questions
- Section organization
- Comprehensive validation rules
- Template locking for finalized forms

### 13. Template Responses Table

**Purpose:** User responses to template questionnaires with progress tracking.

```typescript
templateResponses: defineTable({
  taskId: v.id("tasks"),
  templateId: v.id("templates"),
  templateSnapshot: v.optional(/* ... complete template structure ... */),
  answers: v.array(v.object({
    questionId: v.string(),
    value: v.any(),
  })),
  currentQuestionIndex: v.number(),
  status: v.union(v.literal("in_progress"), v.literal("completed")),
  completedAt: v.optional(v.number()),
  lastSavedAt: v.number(),
})
.index("by_taskId", ["taskId"])
.index("by_templateId", ["templateId"])
.index("by_taskId_status", ["taskId", "status"])
```

**Features:**
- Template versioning through snapshots
- Progressive completion tracking
- Auto-save functionality
- Flexible answer storage

## Table Relationships and Indexes

### Primary Relationships

```
accounts (1) ←→ (M) accountAccess (M) ←→ (1) users
accounts (1) ←→ (M) workItems
accounts (1) ←→ (M) folders
accounts (1) ←→ (M) documents

workItemTypes (1) ←→ (M) workItems
workItems (1) ←→ (M) tasks

tasks (1) ←→ (M) chatMessages
tasks (1) ←→ (M) documents
tasks (1) ←→ (1) templates
tasks (1) ←→ (1) templateResponses

folders (1) ←→ (M) folders (self-referencing)
folders (1) ←→ (M) documents

users (1) ←→ (M) notifications
users (1) ←→ (M) documents (uploadedBy)
users (1) ←→ (M) tasks (teamAssigneeId)
users (1) ←→ (M) templates (createdBy)
```

### Index Strategy

#### Performance Indexes
- **Single Column:** Primary lookup fields (`email`, `phone`, `externalId`)
- **Composite:** Multi-field queries (`accountId + status`, `taskId + createdAt`)
- **Hierarchical:** Path-based queries for folders

#### Query Optimization Examples
```typescript
// Efficient status filtering
.index("by_accountId_status", ["accountId", "status"])

// Chronological message retrieval
.index("by_taskId_createdAt", ["taskId", "createdAt"])

// Hierarchical folder queries
.index("by_path", ["path"])
.index("by_accountId_depth", ["accountId", "depth"])

// Staff-specific queries
.index("by_isStaff", ["isStaff"])

// External system synchronization
.index("by_externalId", ["externalId"])
```

## Data Models and Validation

### Convex Validation System

All fields use strict validation through the `v` library:

```typescript
// String validation
name: v.string(),

// Optional fields
description: v.optional(v.string()),

// Union types for controlled values
status: v.union(v.literal("pending"), v.literal("completed")),

// Array validation
roles: v.array(v.string()),

// Object validation with nested structure
aiAnalysis: v.optional(v.object({
  summary: v.string(),
  completeness: v.union(v.literal("complete"), v.literal("incomplete"), v.literal("unclear")),
  missingItems: v.array(v.string()),
  // ...
})),

// Reference validation
accountId: v.id("accounts"),

// Any type for flexible data
value: v.any(),
```

### Validation Benefits

1. **Runtime Type Safety:** Automatic validation on all database operations
2. **Development Experience:** TypeScript integration with full type inference
3. **Data Integrity:** Prevention of invalid data insertion
4. **API Consistency:** Automatic validation for all endpoints

### Custom Validation Patterns

#### Soft Deletion
```typescript
deletedAt: v.optional(v.number()),
_deletionTime: v.optional(v.number()),
```

#### Timestamp Tracking
```typescript
createdAt: v.number(),
lastSavedAt: v.number(),
analyzedAt: v.number(),
```

#### External System Integration
```typescript
externalId: v.optional(v.string()),
```

#### Hierarchical Data
```typescript
path: v.string(),           // "/folder1/folder2/folder3"
depth: v.number(),          // 3
parentFolderId: v.optional(v.id("folders")),
```

## Migration Considerations

### Schema Evolution Strategy

Convex provides automatic schema migration with these considerations:

#### Adding Fields
```typescript
// Safe - new optional fields
newField: v.optional(v.string()),
```

#### Modifying Fields
```typescript
// Requires data migration
// Old: status: v.string()
// New: status: v.union(v.literal("pending"), v.literal("completed"))
```

#### Removing Fields
```typescript
// Safe - fields not in schema are ignored
// Remove field definition from schema
```

### Migration Best Practices

1. **Additive Changes:** Prefer adding optional fields over modifying existing ones
2. **Data Transformation:** Use migration scripts for complex schema changes
3. **Backward Compatibility:** Maintain compatibility during transition periods
4. **Index Updates:** Plan for index rebuilding on large tables

### Version Control

```typescript
// Schema versioning approach
const SCHEMA_VERSION = "v1.2.0";

// Migration tracking
migrations: defineTable({
  version: v.string(),
  appliedAt: v.number(),
  description: v.string(),
})
```

## Performance Optimizations

### Index Design Principles

#### 1. Query-Driven Indexing
```typescript
// Common query: Get tasks by work item and status
.index("by_workItemId_status", ["workItemId", "status"])

// Common query: Get unread notifications for user
.index("by_userId_readAt", ["userId", "readAt"])
```

#### 2. Hierarchical Data Optimization
```typescript
// Materialized path for O(1) ancestor queries
folders: {
  path: "/parent1/parent2/current",    // Full path
  depth: 3,                           // For level-based queries
}
```

#### 3. External System Integration
```typescript
// Fast external ID lookups
.index("by_externalId", ["externalId"])
```

### Query Performance

#### Efficient Filtering
```typescript
// Use indexes for filtering
await ctx.db
  .query("tasks")
  .withIndex("by_workItemId_status", (q) => 
    q.eq("workItemId", workItemId).eq("status", "pending")
  )
  .collect();
```

#### Limit Result Sets
```typescript
// Use pagination for large datasets
.take(50)  // Limit results
.paginate(paginationOpts)  // Built-in pagination
```

#### Compound Queries
```typescript
// Combine indexed fields for complex queries
.withIndex("by_accountId_depth", (q) => 
  q.eq("accountId", accountId).eq("depth", 0)
)  // Root folders only
```

### Storage Optimization

#### Document Storage
```typescript
documents: {
  storageId: v.id("_storage"),  // Convex file storage
  size: v.optional(v.number()), // Track file sizes
}
```

#### Soft Deletion
```typescript
// Preserve referential integrity
deletedAt: v.optional(v.number()),
```

#### Data Archival
```typescript
// Archive old records
.filter((q) => q.eq(q.field("deletedAt"), undefined))
```

## Security Considerations

### Access Control

#### User-Level Security
```typescript
// Role-based access
role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
isStaff: v.optional(v.boolean()),
```

#### Account-Level Security
```typescript
// Multi-tenant data isolation
accountAccess: defineTable({
  accountId: v.id("accounts"),
  userId: v.id("users"),
})
```

#### Data Visibility
```typescript
// Staff-only fields
/** AI-generated analysis. Staff-only, not visible to clients. */
aiAnalysis: v.optional(/* ... */),
```

### Data Integrity

#### Required Relationships
```typescript
// Ensure referential integrity
taskId: v.id("tasks"),       // Required foreign key
workItemId: v.id("workItems"), // Required parent reference
```

#### Validation Rules
```typescript
// Prevent invalid data
type: v.union(v.literal("personal"), v.literal("business")),
status: v.union(v.literal("pending"), v.literal("completed")),
```

#### Audit Trails
```typescript
// Track data changes
createdAt: v.number(),
uploadedBy: v.id("users"),
lastSavedAt: v.number(),
```

### Privacy Compliance

#### Data Anonymization
```typescript
// Support for data anonymization
isAnonymous: v.optional(v.boolean()),
```

#### Soft Deletion
```typescript
// Recoverable deletion for compliance
deletedAt: v.optional(v.number()),
```

#### External System Sync
```typescript
// Control external data sharing
externalId: v.optional(v.string()),
```

## Monitoring and Maintenance

### Performance Monitoring

#### Query Performance
- Monitor slow queries through Convex dashboard
- Track index utilization
- Identify N+1 query patterns

#### Storage Usage
```typescript
// Track storage metrics
documents: {
  size: v.optional(v.number()),
  mimeType: v.optional(v.string()),
}
```

#### Data Growth
- Monitor table growth rates
- Track document upload patterns
- Plan for scaling thresholds

### Maintenance Tasks

#### Data Cleanup
```typescript
// Regular cleanup of soft-deleted records
const deletedCutoff = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days
// Archive records older than cutoff
```

#### Index Optimization
- Review unused indexes
- Add indexes for new query patterns
- Remove redundant indexes

#### Schema Evolution
- Plan schema migrations
- Test migration scripts
- Coordinate with application deployments

### Backup and Recovery

#### Convex Built-in Features
- Automatic point-in-time recovery
- Continuous data replication
- Global data distribution

#### Application-Level Backups
```typescript
// Export critical configuration
settings: /* configuration backup */
templates: /* template definitions */
```

## Future Schema Enhancements

### Planned Additions

#### Enhanced AI Integration
```typescript
// Future AI analysis features
aiModels: defineTable({
  name: v.string(),
  version: v.string(),
  configuration: v.object(/* model config */),
})

// AI confidence scoring
aiAnalysis: {
  confidence: v.number(),
  modelVersion: v.string(),
}
```

#### Advanced Workflow Management
```typescript
// Workflow automation
workflows: defineTable({
  name: v.string(),
  triggers: v.array(v.object(/* trigger config */)),
  actions: v.array(v.object(/* action config */)),
})
```

#### Audit and Compliance
```typescript
// Comprehensive audit trail
auditLog: defineTable({
  entityType: v.string(),
  entityId: v.string(),
  action: v.string(),
  userId: v.id("users"),
  changes: v.object(/* field changes */),
  timestamp: v.number(),
})
```

#### Multi-Language Support
```typescript
// Internationalization
translations: defineTable({
  key: v.string(),
  language: v.string(),
  value: v.string(),
})
```

### Scalability Improvements

#### Partitioning Strategy
```typescript
// Time-based partitioning for large tables
partitionKey: v.string(),  // e.g., "2024-01"
```

#### Cache Layer
```typescript
// Application-level caching
cachedData: defineTable({
  key: v.string(),
  value: v.any(),
  expiresAt: v.number(),
})
```

#### Analytical Queries
```typescript
// Reporting and analytics
analyticsSnapshots: defineTable({
  date: v.string(),
  metrics: v.object(/* analytics data */),
})
```