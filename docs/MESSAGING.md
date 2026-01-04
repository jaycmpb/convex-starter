# Messaging System

The My Accounting Dashboard features a comprehensive real-time messaging system that enables seamless communication between staff and clients throughout the work engagement process, with chat integration tied directly to specific tasks.

## Overview

The messaging system provides:
- **Real-time Chat**: Instant messaging between staff and clients
- **Task Integration**: Messages tied to specific tasks for context
- **Message History**: Persistent conversation storage and retrieval
- **Multiple Sender Types**: Support for different message senders (staff, clients, AI)
- **Message State Management**: Read/unread status and timestamps
- **Conversation Locking**: Disable messaging when tasks are complete

## Database Schema

### Chat Messages Table
```typescript
chatMessages: {
  taskId: Id<"tasks">              // Associated task
  content: string                  // Message content
  senderType: "contact" | "employee" | "ai"  // Message sender type
  senderName: string               // Display name for sender
  senderId?: Id<"users">           // User ID (if not AI)
  externalId?: string             // External system reference
  createdAt: number               // Message timestamp
}
```

### Message Indexing
Optimized for fast retrieval:
- **By Task**: `by_taskId` - All messages for a specific task
- **By Sender**: `by_externalId` - External system message tracking
- **By Time**: `by_taskId_createdAt` - Chronological message ordering

## Real-time Chat Functionality

### Chat Dialog Interface
```typescript
interface ChatDialogProps {
  taskId: string                   // Target task for conversation
  open: boolean                   // Dialog visibility state
  onOpenChange: (open: boolean) => void
}
```

### Chat Features

#### Message Display
- **Conversation Bubbles**: Distinct styling for sender vs recipient
- **Message Grouping**: Messages grouped by sender with timestamps
- **Sender Identification**: Clear indication of message sender
- **Time Stamps**: Relative and absolute time display
- **Auto-scroll**: Automatic scroll to newest messages

#### Message Input
- **Text Area**: Multi-line message composition
- **Send Button**: Click or keyboard shortcut (Enter) to send
- **Character Limit**: Reasonable limits on message length
- **Input Validation**: Prevent empty message submission

#### Real-time Updates
- **Live Messages**: New messages appear instantly
- **Typing Indicators**: Optional typing status indicators
- **Message Status**: Delivery and read receipt tracking
- **Connection Status**: Handle network connectivity issues

### Message Flow
```typescript
// Message sending flow
const handleSend = async () => {
  // 1. Validate message content
  if (!message.trim() || !currentUser || isComplete) return
  
  // 2. Determine sender information
  const senderName = `${currentUser.firstName} ${currentUser.lastName}`
  const senderType = isStaff ? "employee" : "contact"
  
  // 3. Send message via mutation
  await sendMessage({
    taskId: taskId as any,
    content: message.trim(),
    senderName,
    senderType,
  })
  
  // 4. Clear input and update UI
  setMessage("")
}
```

## Message Types and Senders

### Sender Types

#### Contact (`senderType: "contact"`)
- **Client Users**: Customers and clients asking questions
- **Account Access**: Can only message tasks for their account
- **Display Name**: Shows client's first and last name
- **Permissions**: Can view and send messages, cannot edit or delete

#### Employee (`senderType: "employee"`)
- **Staff Members**: Internal team members
- **Full Access**: Can view messages across all accounts they manage
- **Display Name**: Shows staff member's full name
- **Permissions**: Full message management capabilities

#### AI (`senderType: "ai"`)
- **Automated Messages**: System-generated messages and responses
- **No User ID**: Not associated with specific user account
- **Display Name**: "AI Assistant" or similar system identifier
- **Use Cases**: Automated notifications, status updates, helpful suggestions

### Sender Identification
```typescript
// Visual message styling based on sender
const isOwnMessage = msg.senderId === currentUser?._id

return (
  <div className={`flex flex-col gap-1.5 ${isOwnMessage ? "items-end" : "items-start"}`}>
    <span className="text-xs font-medium text-muted-foreground">
      {msg.senderName}
    </span>
    <div className={`message-bubble ${isOwnMessage ? "own-message" : "other-message"}`}>
      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
    </div>
    <span className="text-xs text-muted-foreground">
      {formatTime(msg.createdAt)}
    </span>
  </div>
)
```

## Chat Integration with Tasks

### Task Context
Every chat conversation is bound to a specific task:

#### Contextual Messaging
- **Task Information**: Chat dialog shows task name and description
- **Status Display**: Current task status visible in chat header
- **Due Dates**: Task deadlines shown for context
- **Assignment Info**: Staff assignment displayed

#### Task Status Integration
```typescript
// Chat dialog header shows task context
<DialogHeader>
  <div className="flex items-center gap-3">
    <DialogTitle>{task?.name || "Chat"}</DialogTitle>
    {task?.status && (
      <Badge variant={isComplete ? "secondary" : "outline"}>
        {task.status}
      </Badge>
    )}
  </div>
  {task?.description && (
    <DialogDescription>{task.description}</DialogDescription>
  )}
</DialogHeader>
```

### Task State Impact on Messaging

#### Active Tasks
- **Full Functionality**: Users can send and receive messages
- **Real-time Updates**: Messages sync immediately
- **Message History**: Full conversation history accessible

#### Completed Tasks
- **Conversation Lock**: Message input disabled when task is complete
- **Read-only Mode**: Users can view message history but not add new messages
- **Lock Indicator**: Visual indication that conversation is locked
- **Historical Access**: Full message history remains accessible

```typescript
// Conversation locking for completed tasks
const isComplete = task?.status === "Complete"

{isComplete ? (
  <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-muted/50 border text-muted-foreground">
    <Lock className="h-4 w-4" />
    <span className="text-sm">This conversation is complete.</span>
  </div>
) : (
  <MessageInput />
)}
```

## Message History and Persistence

### Message Storage
All messages are permanently stored with full context:

#### Data Persistence
- **Database Storage**: Messages stored in persistent database
- **Full History**: Complete conversation history maintained
- **Cross-session**: Messages persist across user sessions
- **Audit Trail**: Complete record of all communications

#### Message Retrieval
```typescript
// Query messages for task with pagination
const messages = useQuery(
  api.src.chatMessages.queries.getMessagesByTaskId,
  { taskId: taskId as any }
)
```

### Message Ordering
- **Chronological**: Messages ordered by creation timestamp
- **Consistent Display**: Same message order across all users
- **Real-time Insertion**: New messages inserted in correct chronological position

### Message Formatting
```typescript
// Message timestamp formatting
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], { 
    hour: "2-digit", 
    minute: "2-digit" 
  })
}
```

## User Experience Features

### Conversation Management

#### Message Bubbles
- **Visual Distinction**: Different styling for own vs. others' messages
- **Sender Alignment**: Own messages right-aligned, others left-aligned
- **Color Coding**: Different background colors for message types
- **Responsive Design**: Messages adapt to screen size

#### Auto-scroll Behavior
```typescript
// Automatic scroll to newest messages
useEffect(() => {
  if (messagesEndRef.current) {
    messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
  }
}, [messages])
```

#### Loading States
- **Message Loading**: Skeleton or spinner while fetching messages
- **Send Loading**: Loading indicator while sending messages
- **Connection Status**: Indicator for network connectivity
- **Error Handling**: Clear error messages for failed operations

### Keyboard Shortcuts
- **Enter to Send**: Standard message sending behavior
- **Shift+Enter**: New line in message composition
- **Escape**: Close chat dialog
- **Tab Navigation**: Accessible keyboard navigation

### Mobile Responsiveness
- **Touch Optimized**: Touch-friendly interface for mobile devices
- **Responsive Layout**: Adapts to different screen sizes
- **Mobile Keyboard**: Optimized for mobile text input
- **Gesture Support**: Swipe gestures where appropriate

## Integration Points

### Notification System
Chat messages trigger notifications:

#### Real-time Alerts
- **New Message Notifications**: Alert users of new messages
- **Unread Count**: Show number of unread messages
- **Task Context**: Notifications include task information
- **User Targeting**: Notifications sent to relevant users only

#### Email Integration
- **Email Notifications**: Option to send email alerts for new messages
- **Digest Options**: Summary emails for multiple messages
- **Preference Management**: User control over notification preferences

### Task Management Integration
- **Status Updates**: Chat activity can influence task status
- **Progress Tracking**: Messages contribute to engagement metrics
- **Assignment Context**: Messages visible to assigned team members
- **Work Item Visibility**: Messages accessible through work item view

### External System Sync
```typescript
// Monday.com integration for message tracking
chatMessages: {
  externalId?: string  // Reference to external comment/update
}
```

## Security and Privacy

### Access Control
- **Account Isolation**: Users only see messages for accessible accounts
- **Role-based Access**: Staff vs. client permission differences
- **Task Association**: Messages only visible to task participants
- **Audit Logging**: Track message access and modifications

### Data Protection
- **Message Encryption**: Messages encrypted in transit and at rest
- **Retention Policies**: Configurable message retention periods
- **Export Options**: Ability to export conversation history
- **Deletion Policies**: Controlled message deletion procedures

### Privacy Features
- **User Identification**: Clear sender identification
- **Message Attribution**: Proper attribution of all messages
- **Edit History**: Track any message modifications
- **Deletion Tracking**: Log any message deletions

## Performance Optimization

### Real-time Updates
- **WebSocket Connections**: Efficient real-time message delivery
- **Connection Pooling**: Optimize connection management
- **Reconnection Logic**: Handle network interruptions gracefully
- **Message Queuing**: Queue messages during connection issues

### Data Loading
- **Pagination**: Load messages in chunks for performance
- **Virtual Scrolling**: Efficient rendering of long conversations
- **Caching**: Cache recent messages for faster access
- **Lazy Loading**: Load message history on demand

This messaging system provides a comprehensive communication solution that maintains context, ensures security, and delivers an excellent user experience for both staff and clients throughout the engagement lifecycle.