# Document Management System

The My Accounting Dashboard application includes a comprehensive document management system that handles file uploads, organization, preview, and secure access controls integrated with the work management workflow.

## Overview

The document management system supports:
- **File Upload**: Drag-and-drop and traditional file selection
- **Folder Hierarchy**: Organized structure with breadcrumb navigation
- **File Preview**: Built-in preview for images and PDFs
- **Access Controls**: Permission-based file access
- **Integration**: Documents linked to work items and tasks

## Database Schema

### Documents Table
```typescript
documents: {
  storageId: Id<"_storage">        // Convex storage reference
  folderId?: Id<"folders">         // Parent folder (optional)
  accountId?: Id<"accounts">       // Associated client account
  workItemId?: Id<"workItems">     // Associated work item
  taskId?: Id<"tasks">             // Associated task
  name: string                     // File name with extension
  mimeType?: string               // File MIME type
  size?: number                   // File size in bytes
  uploadedBy: Id<"users">         // User who uploaded the file
  deletedAt?: number              // Soft deletion timestamp
}
```

### Folders Table
```typescript
folders: {
  accountId: Id<"accounts">        // Owner account
  parentFolderId?: Id<"folders">   // Parent folder for nesting
  name: string                     // Folder display name
  path: string                     // Materialized path (/folder1/folder2/)
  depth: number                    // Nesting level (0 = root)
  deletedAt?: number              // Soft deletion timestamp
}
```

## Document Upload Capabilities

### Upload Interface
The document upload system features:

#### File Dropzone Component
- **Drag and Drop**: Visual drop zone for intuitive file uploads
- **File Selection**: Traditional file picker as backup
- **Multiple Files**: Support for batch uploads
- **Progress Tracking**: Real-time upload progress indicators
- **File Validation**: Size and type restrictions

```typescript
// File upload flow
1. User selects files via drag-drop or file picker
2. System generates secure upload URL via Convex
3. Files uploaded directly to Convex storage
4. Document records created with metadata
5. Task status automatically updated to "Client Responded"
```

### Upload Contexts

#### Task-Based Upload
When uploading to document tasks:
- Files automatically associated with specific task
- Task status updated upon successful upload
- Work item progress recalculated
- Notifications sent to assigned staff members

#### General Upload
For staff uploads not tied to specific tasks:
- Files uploaded to account folder structure
- Can be organized into custom folders
- Available for future task association

## Folder Hierarchy and Organization

### Folder Structure
```
Account Root/
├── Tax Documents/
│   ├── 2023/
│   │   ├── W-2s/
│   │   └── 1099s/
│   └── 2024/
├── Financial Statements/
├── Contracts/
└── Correspondence/
```

### Materialized Path System
For efficient folder navigation and breadcrumbs:
- **Path Field**: Stores complete folder path as string
- **Depth Field**: Enables level-based queries
- **Fast Queries**: Ancestor and descendant lookups

```typescript
// Example folder paths
{
  name: "W-2s",
  path: "/tax-documents-id/2023-id/",
  depth: 2
}
```

### Breadcrumb Navigation
Automatic breadcrumb generation from materialized paths:
- Root folder always shows account name
- Clickable navigation to any parent folder
- Current folder highlighted in interface

## File Preview and Download Features

### Preview Capabilities

#### Image Preview
Supported formats: JPEG, PNG, GIF, WebP
- **Inline Display**: Full image rendered in dialog
- **Click to Expand**: Opens full-size in new tab
- **Responsive Sizing**: Adapts to container width

#### PDF Preview
- **Embedded Viewer**: PDF displayed in iframe
- **Full Page**: 600px height with scrolling
- **External Link**: "Open in new tab" option
- **Download Option**: Direct download button

#### Other File Types
For unsupported file types:
- **File Icon**: Generic document icon
- **File Name**: Truncated with tooltip
- **Download Link**: Direct download option
- **MIME Type**: Display file type information

### Download Security
```typescript
// Secure download flow
1. User requests file download
2. System verifies access permissions
3. Temporary signed URL generated
4. Download initiated with expiring link
```

### Preview Component
```typescript
<DocumentPreview
  storageId={document.storageId}
  mimeType={document.mimeType}
  name={document.name}
  className="max-h-[400px]"
/>
```

## Document Associations

### Task Integration
Documents can be associated with tasks in multiple ways:

#### Document Tasks
- **Single Document**: One primary document per task
- **Replace Function**: Users can replace existing documents
- **Version History**: Previous versions automatically cleaned up
- **Status Updates**: Upload triggers task status change

#### Supporting Documents
- **Multiple Files**: Tasks can have supporting document references
- **Contextual Upload**: Upload directly from task interface
- **Automatic Linking**: Files uploaded in task context auto-associate

### Work Item Association
- **Project Documents**: Files can be linked to entire work items
- **Cross-Task Access**: Documents available across all work item tasks
- **Organizational Structure**: Logical grouping of related files

### Account Association
- **Client Files**: All documents tied to specific client accounts
- **Access Control**: Users only see documents for accessible accounts
- **Bulk Operations**: Account-level document management

## File Security and Access Controls

### Permission Model

#### Client Access
- **Own Account Only**: Clients can only access their account's documents
- **Task Documents**: Can view/download documents for their tasks
- **Upload Rights**: Can upload documents to assigned tasks
- **No Staff Documents**: Cannot access staff-uploaded internal files

#### Staff Access
- **Full Visibility**: Can access documents for all accounts they manage
- **Account Selection**: View documents filtered by selected account
- **Upload Anywhere**: Can upload documents to any accessible location
- **AI Analysis**: Access to AI-generated document analysis

### Security Features

#### Secure URLs
- **Expiring Links**: Download URLs automatically expire
- **Permission Checks**: Every access validates user permissions
- **Storage Isolation**: Files stored securely in Convex storage
- **No Direct Access**: Files not accessible without authentication

#### Soft Deletion
- **Retention Policy**: Deleted files marked but not immediately removed
- **Recovery Window**: Ability to restore accidentally deleted files
- **Cleanup Process**: Permanent deletion after retention period

## File Upload Dialog Features

### Upload Process
```typescript
interface DocumentUploadDialogProps {
  taskId: string              // Target task for upload
  open: boolean              // Dialog visibility
  onOpenChange: (open: boolean) => void
}
```

### Dialog Capabilities
- **Existing File Display**: Shows currently uploaded document
- **AI Analysis Panel**: Staff can see AI analysis of uploaded documents
- **Replace Workflow**: Clear interface for file replacement
- **Progress Indicators**: Upload status and loading states

### AI-Powered Analysis (Staff Only)
For document tasks, staff members see AI analysis including:
- **Document Summary**: Plain-English summary of contents
- **Completeness Assessment**: Complete, incomplete, or unclear status
- **Missing Items**: List of potentially missing documents
- **Suspicious Items**: Flagged items requiring review
- **Analysis Timestamp**: When analysis was performed

```typescript
aiAnalysis: {
  summary: "Tax return documents for 2023..."
  completeness: "incomplete"
  missingItems: ["Schedule C", "1099-MISC forms"]
  suspiciousItems: ["Unusual deduction amounts"]
  analyzedAt: 1673395200000
  analyzedDocumentIds: [...]
}
```

## Storage Architecture

### Convex Storage Integration
- **Built-in Storage**: Uses Convex's native file storage system
- **Scalable**: Automatically handles storage scaling
- **CDN Integration**: Fast global file delivery
- **Backup**: Automatic replication and backup

### File Handling
```typescript
// Upload flow
generateUploadUrl() → uploadToStorage() → createDocument()

// Download flow
getDownloadUrl() → signedUrl → directDownload
```

### Cleanup Process
- **Old File Deletion**: Previous versions removed on replacement
- **Storage Optimization**: Unused files cleaned up periodically
- **Retention Policy**: Deleted files eventually purged from storage

## Integration Points

### Monday.com Sync
- Document upload events sync with Monday.com
- File attachments can be cross-referenced
- Status updates trigger external notifications

### Notification System
- Document upload triggers notifications
- AI analysis completion alerts staff
- File sharing notifications for relevant users

### Task Management
- Upload completion updates task status
- Document requirements tracked per task
- Progress calculation includes document completion

This document management system provides secure, organized, and efficient file handling integrated seamlessly with the work management workflow, ensuring both staff and clients have appropriate access to necessary documents throughout the engagement lifecycle.