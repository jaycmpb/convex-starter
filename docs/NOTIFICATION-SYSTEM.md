# Notification System

The My Accounting Dashboard features a comprehensive notification system that delivers real-time in-app notifications and email alerts to keep users informed about task assignments, status changes, deadlines, and other important events throughout the work engagement process.

## Overview

The notification system provides:
- **In-app Notifications**: Real-time notifications within the application interface
- **Email Notifications**: Automated email alerts for important events
- **Notification Types**: Multiple types for different events and contexts
- **User Preferences**: Customizable notification settings per user
- **Read Status Tracking**: Mark notifications as read/unread
- **Notification Bell**: Visual indicator with unread count

## Database Schema

### Notifications Table
```typescript
notifications: {
  userId: Id<"users">              // Target user for notification
  accountId: Id<"accounts">        // Associated account context
  type: NotificationType           // Notification category
  title: string                    // Notification headline
  message: string                  // Detailed notification text
  taskId?: Id<"tasks">            // Associated task (optional)
  workItemId?: Id<"workItems">    // Associated work item (optional)
  readAt?: number                 // Read timestamp (null = unread)
  emailSentAt?: number            // Email delivery timestamp
}
```

### Notification Types
```typescript
type NotificationType = 
  | "task_assigned"      // New task assigned to user
  | "task_completed"     // Task marked as complete
  | "task_reminder"      // Due date approaching
  | "task_reopened"      // Task status changed back to active
  | "workitem_completed" // Work item finished
```

### Indexing Strategy
Optimized for fast retrieval:
- **By User**: `by_userId` - All notifications for user
- **By Read Status**: `by_userId_readAt` - Unread notifications
- **By Account**: `by_accountId` - Account-specific notifications

## Email Notification System

### Email Integration
The system uses Resend for reliable email delivery:

#### Email Service Configuration
```typescript
// Email service integration
resend: {
  apiKey: process.env.RESEND_API_KEY
  fromAddress: "notifications@accountingdashboard.com"
  replyTo: "support@accountingdashboard.com"
}
```

#### Email Templates
Structured email notifications with:
- **HTML Templates**: Rich formatting with branding
- **Plain Text Fallback**: Accessibility and compatibility
- **Dynamic Content**: Personalized information insertion
- **Call-to-Action**: Direct links to relevant tasks

### Email Notification Flow
```typescript
// Notification creation with email delivery
const createNotification = async (notificationData) => {
  // 1. Create notification record
  const notificationId = await db.insert("notifications", {
    userId: targetUserId,
    accountId: accountId,
    type: "task_assigned",
    title: "New Task Assigned",
    message: `You have been assigned: ${taskName}`,
    taskId: taskId
  })
  
  // 2. Send email notification
  await sendEmailNotification({
    to: userEmail,
    subject: "New Task Assigned",
    template: "task_assigned",
    data: notificationData
  })
  
  // 3. Update email sent timestamp
  await db.patch(notificationId, {
    emailSentAt: Date.now()
  })
}
```

### Email Preferences
Users can control email notification delivery:
- **All Notifications**: Receive emails for all notifications
- **Important Only**: Only critical notifications via email
- **Disabled**: No email notifications (in-app only)
- **Digest Mode**: Periodic summary emails instead of individual emails

## In-app Notifications

### Notification Bell Component
```typescript
interface NotificationBellProps {
  // Component automatically fetches user data and unread count
}

// Features:
// - Visual bell icon in navigation
// - Red badge with unread count
// - Dropdown with recent notifications
// - Mark as read functionality
```

### Notification Bell Features

#### Visual Indicators
- **Bell Icon**: Standard notification bell in application header
- **Unread Badge**: Red circular badge with unread count
- **Badge Text**: Shows count (1-9) or "9+" for higher numbers
- **Accessibility**: Screen reader support for notification status

#### Dropdown Interface
```typescript
<DropdownMenu>
  <DropdownMenuTrigger>
    <Button variant="ghost" size="icon" className="relative">
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <Badge variant="destructive" className="notification-badge">
          {unreadCount > 9 ? "9+" : unreadCount}
        </Badge>
      )}
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <NotificationDropdown userId={currentUser._id} />
  </DropdownMenuContent>
</DropdownMenu>
```

### Notification Dropdown

#### Notification List
- **Recent Notifications**: Shows last 20 notifications
- **Chronological Order**: Newest notifications first
- **Visual Distinction**: Unread notifications highlighted
- **Pagination**: Scroll to load more notifications

#### Notification Display
Each notification shows:
- **Icon**: Type-specific icon (clock, checkmark, alert)
- **Title**: Bold notification headline
- **Message**: Detailed notification text
- **Timestamp**: Relative time display ("2 minutes ago")
- **Type Badge**: Color-coded notification type
- **Read Status**: Visual indicator for unread notifications

```typescript
// Notification item rendering
<div className={`notification-item ${isUnread ? "bg-muted/30" : ""}`}>
  <div className="notification-icon">
    {getNotificationIcon(notification.type)}
  </div>
  <div className="notification-content">
    <div className="notification-header">
      <span className="notification-title">{notification.title}</span>
      <Badge variant={getNotificationVariant(notification.type)}>
        {notification.type.replace("_", " ")}
      </Badge>
    </div>
    <p className="notification-message">{notification.message}</p>
    <span className="notification-time">
      {formatDistanceToNow(notification._creationTime, { addSuffix: true })}
    </span>
  </div>
  {isUnread && <div className="unread-indicator" />}
</div>
```

## Notification Types and Triggers

### Task Assignment (`task_assigned`)
Triggered when a task is assigned to a user:

#### Trigger Conditions
- New task created with team assignee
- Task reassigned to different team member
- Task assignment added to existing unassigned task

#### Notification Content
```typescript
{
  type: "task_assigned",
  title: "New Task Assigned",
  message: `You have been assigned the task: ${taskName}`,
  icon: <Clock className="h-4 w-4" />,
  badge: "outline",
  taskId: assignedTaskId
}
```

### Task Completion (`task_completed`)
Triggered when a task is marked as complete:

#### Trigger Conditions
- Task status changed to "Complete", "Done", or "Closed"
- All required deliverables submitted
- Staff approval of task completion

#### Notification Content
```typescript
{
  type: "task_completed",
  title: "Task Completed",
  message: `Task "${taskName}" has been completed`,
  icon: <CheckSquare className="h-4 w-4" />,
  badge: "default",
  taskId: completedTaskId
}
```

### Task Reminder (`task_reminder`)
Triggered based on due date proximity:

#### Trigger Conditions
- Task due within 24 hours
- Task overdue
- Custom reminder schedule per task type

#### Notification Content
```typescript
{
  type: "task_reminder",
  title: "Task Reminder",
  message: `Task "${taskName}" is due ${dueDateRelative}`,
  icon: <AlertCircle className="h-4 w-4" />,
  badge: "destructive",
  taskId: reminderTaskId
}
```

### Task Reopened (`task_reopened`)
Triggered when a completed task is reopened:

#### Trigger Conditions
- Task status changed from complete back to active status
- Additional work required on completed task
- Client requests changes to completed work

#### Notification Content
```typescript
{
  type: "task_reopened",
  title: "Task Reopened",
  message: `Task "${taskName}" has been reopened for additional work`,
  icon: <Clock className="h-4 w-4" />,
  badge: "outline",
  taskId: reopenedTaskId
}
```

### Work Item Completion (`workitem_completed`)
Triggered when an entire work item is finished:

#### Trigger Conditions
- All tasks in work item completed
- Work item status updated to final state
- Client engagement concluded

#### Notification Content
```typescript
{
  type: "workitem_completed",
  title: "Work Item Completed",
  message: `Work item "${workItemName}" has been completed`,
  icon: <CheckSquare className="h-4 w-4" />,
  badge: "default",
  workItemId: completedWorkItemId
}
```

## User Preferences and Settings

### Notification Preferences
Users can customize their notification experience:

#### In-app Preferences
- **Enable/Disable**: Toggle in-app notifications on/off
- **Notification Types**: Select which types to receive
- **Auto-dismiss**: Automatically mark notifications as read
- **Sound Alerts**: Audio notification for new notifications

#### Email Preferences
```typescript
interface EmailPreferences {
  enabled: boolean                    // Master email toggle
  types: NotificationType[]          // Which types to email
  frequency: "immediate" | "digest"   // Delivery timing
  digestTime: "daily" | "weekly"     // Digest schedule
}
```

#### Preference Management
- **User Settings**: Accessible from user profile/settings
- **Per-notification Type**: Granular control over each type
- **Account-level**: Different preferences per account
- **Default Settings**: Sensible defaults for new users

### Do Not Disturb
- **Quiet Hours**: Suppress notifications during specified hours
- **Weekend Mode**: Reduced notifications on weekends
- **Vacation Mode**: Temporarily disable all notifications
- **Emergency Override**: Critical notifications bypass DND

## Notification Delivery Logic

### Targeting Rules
Notifications are delivered based on:

#### User Role
- **Staff Members**: Receive task assignments and completions
- **Clients**: Receive task updates and reminders
- **Account Admins**: Receive account-wide notifications

#### Account Access
```typescript
// Notification targeting logic
const getNotificationTargets = (event: NotificationEvent) => {
  const targets = []
  
  // Add assigned team member
  if (event.taskId && task.teamAssigneeId) {
    targets.push(task.teamAssigneeId)
  }
  
  // Add account contacts
  if (event.accountId) {
    const accountUsers = getAccountUsers(event.accountId)
    targets.push(...accountUsers.filter(u => !u.isStaff))
  }
  
  // Add supervising staff
  const staffMembers = getStaffForAccount(event.accountId)
  targets.push(...staffMembers)
  
  return deduplicateTargets(targets)
}
```

### Delivery Timing
- **Immediate**: Real-time for urgent notifications
- **Batched**: Group similar notifications together
- **Scheduled**: Respect user time zone preferences
- **Retry Logic**: Handle failed delivery attempts

### Rate Limiting
- **Per-user Limits**: Prevent notification spam
- **Type-based Limits**: Different limits per notification type
- **Cooldown Periods**: Prevent duplicate notifications
- **Escalation Rules**: Increase urgency for repeated events

## Notification Management

### Read Status Tracking
```typescript
// Mark notification as read
const markAsRead = async (notificationId: Id<"notifications">) => {
  await db.patch(notificationId, {
    readAt: Date.now()
  })
}

// Mark all notifications as read
const markAllAsRead = async (userId: Id<"users">) => {
  const unreadNotifications = await db
    .query("notifications")
    .filter(q => q.and(
      q.eq(q.field("userId"), userId),
      q.eq(q.field("readAt"), undefined)
    ))
    .collect()
    
  for (const notification of unreadNotifications) {
    await markAsRead(notification._id)
  }
}
```

### Notification Cleanup
- **Retention Policy**: Automatically delete old notifications
- **Storage Optimization**: Archive old notifications
- **User Cleanup**: Allow users to delete notifications
- **Bulk Operations**: Mass mark as read/delete functionality

### Analytics and Metrics
- **Delivery Rates**: Track email delivery success
- **Read Rates**: Monitor notification engagement
- **User Preferences**: Analyze preference patterns
- **Performance Metrics**: Notification system performance

## Integration Points

### Task Management Integration
Notifications are automatically triggered by:
- Task creation and assignment
- Status changes
- Due date modifications
- Completion events

### Monday.com Synchronization
- **External Events**: Monday.com updates trigger notifications
- **Bidirectional Sync**: Local changes notify external systems
- **Event Mapping**: Map external events to notification types

### Email Service Integration
```typescript
// Resend email service integration
const sendEmailNotification = async (emailData: EmailNotificationData) => {
  return await resend.emails.send({
    from: "notifications@accountingdashboard.com",
    to: emailData.to,
    subject: emailData.subject,
    html: await renderEmailTemplate(emailData.template, emailData.data),
    text: await renderTextTemplate(emailData.template, emailData.data)
  })
}
```

## Real-time Updates

### WebSocket Integration
- **Live Updates**: Notifications appear immediately
- **Connection Management**: Handle disconnections gracefully
- **Message Queuing**: Queue notifications during offline periods
- **Synchronization**: Sync state when reconnecting

### Browser Notifications
- **Desktop Notifications**: Native browser notification support
- **Permission Management**: Request notification permissions
- **Fallback Strategy**: In-app notifications if permission denied
- **Cross-tab Sync**: Consistent state across browser tabs

This notification system ensures users stay informed about important events while providing the flexibility to customize their notification experience based on their role, preferences, and work patterns.