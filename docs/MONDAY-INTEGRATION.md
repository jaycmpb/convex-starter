# Monday.com Integration Documentation

## Overview

The My Accounting Dashboard integrates with Monday.com to provide bidirectional synchronization of accounting workflows, client management, and task tracking. This integration supports real-time webhook notifications and API-based data exchanges.

## Webhook Setup and Configuration

### Endpoint Configuration

**Webhook URL:** `https://your-domain.com/api/webhooks/monday`

**Required Query Parameter:** `type={entity_type}`

Example webhook URLs:
- `https://your-domain.com/api/webhooks/monday?type=client`
- `https://your-domain.com/api/webhooks/monday?type=task`
- `https://your-domain.com/api/webhooks/monday?type=work-item`

### Authentication

Monday.com webhooks are authenticated using:
- **API Key:** Set via `MONDAY_API_KEY` environment variable
- **Webhook Secret:** Optional, configured in the `settings` table with `webhookSecret` field

### Environment Variables

```env
MONDAY_API_KEY=your_monday_api_key_here
```

## Supported Entity Types

The integration handles six primary entity types, each with specific event handlers:

### 1. Clients (`type=client`)
- **Events Handled:** Pulse creation, updates, column changes
- **Synchronization:** Monday.com client items ↔ Application accounts
- **Key Fields:** Name, type (personal/business), external ID

### 2. Contacts (`type=contact`)
- **Events Handled:** Pulse creation, updates, column changes
- **Synchronization:** Monday.com contact items ↔ Application users
- **Key Fields:** First name, last name, email, phone, external ID

### 3. Team Members (`type=team`)
- **Events Handled:** User assignments, role changes
- **Synchronization:** Monday.com team assignments ↔ Application user roles
- **Key Fields:** User ID, role, staff status

### 4. Work Items (`type=work-item`)
- **Events Handled:** Item creation, status updates, group moves
- **Synchronization:** Monday.com work items ↔ Application work items
- **Key Fields:** Name, status, type, due date, account assignment

### 5. Tasks (`type=task`)
- **Events Handled:** Sub-item creation, status changes, assignments
- **Synchronization:** Monday.com sub-items ↔ Application tasks
- **Key Fields:** Name, status, description, due date, assignee, parent work item

### 6. Updates (`type=update`)
- **Events Handled:** Comment/post creation, updates
- **Synchronization:** Monday.com updates ↔ Application chat messages
- **Key Fields:** Content, sender, timestamp, associated item

## Event Handling and Synchronization

### Event Types

The integration processes these Monday.com webhook events:

#### Common Events
- `create_pulse` - New item/sub-item creation
- `change_column_value` - Column value updates
- `move_pulse_into_group` - Group/status changes
- `create_update` - New comment/post

#### Item-Specific Events
- `archive_pulse` - Item archival
- `delete_pulse` - Item deletion
- `assign_user` - User assignment changes

### Event Processing Flow

1. **Webhook Reception**
   ```typescript
   POST /api/webhooks/monday?type={entity_type}
   ```

2. **Event Dispatch**
   ```typescript
   dispatchMondayEvent(ctx, entityType, payload)
   ```

3. **Handler Execution**
   - Route to appropriate entity handler
   - Validate payload structure
   - Execute synchronization logic
   - Return success/error response

4. **Error Handling**
   - Comprehensive logging for debugging
   - Graceful fallback for unsupported events
   - HTTP status codes for webhook responses

### Handler Registry

```typescript
const handlers: Record<string, Record<string, MondayHandler>> = {
  contact: contactHandlers,
  client: clientHandlers,
  team: teamHandlers,
  task: taskHandlers,
  update: updateHandlers,
  "work-item": workItemHandlers,
};
```

## Bidirectional Data Flow

### Monday.com → Application

**Trigger:** Webhook events from Monday.com
**Process:**
1. Receive webhook payload
2. Parse event data and entity type
3. Update/create corresponding application records
4. Handle linked relationships (e.g., task → work item)

### Application → Monday.com

**Trigger:** Application state changes
**Process:**
1. Detect application record changes
2. Format data for Monday.com API
3. Use GraphQL API to update Monday.com
4. Handle API responses and errors

### API Operations

#### Read Operations
- `fetchItem(pulseId)` - Get single item with relationships
- `fetchItemWithSubitems(pulseId)` - Get item with all sub-items
- `fetchSubItem(pulseId)` - Get sub-item with parent context
- `fetchUser(userId)` - Get user information
- `fetchItemUpdates(itemId)` - Get item comments/posts

#### Write Operations
- `updateItemColumnValue(itemId, boardId, columnId, value)` - Update column values
- `createItem(boardId, itemName, groupId?)` - Create new items
- `createItemUpdate(itemId, body)` - Create comments/posts

## Configuration Requirements

### Database Configuration

The `settings` table contains Monday.com configuration:

```sql
settings: {
  name: string,
  roles: string[],
  integrationSource: "monday",  -- Required for Monday.com integration
  webhookSecret?: string        -- Optional webhook authentication
}
```

### Schema Requirements

Key schema elements for Monday.com integration:

```typescript
// External ID tracking
accounts: { externalId?: string }
users: { externalId?: string }
workItems: { externalId?: string }
tasks: { externalId?: string }
templates: { externalId?: string }
chatMessages: { externalId?: string }

// Monday.com specific indexes
users.index("by_externalId", ["externalId"])
accounts.index("by_externalId", ["externalId"])
workItems.index("by_externalId", ["externalId"])
tasks.index("by_externalId", ["externalId"])
templates.index("by_externalId", ["externalId"])
chatMessages.index("by_externalId", ["externalId"])
```

## Error Handling and Troubleshooting

### Common Error Scenarios

#### 1. Missing API Key
```
Error: MONDAY_API_KEY is not set
Solution: Configure MONDAY_API_KEY environment variable
```

#### 2. Unsupported Entity Type
```
Error: Unsupported entity type 'invalid-type'
Solution: Use one of: client, contact, team, task, update, work-item
```

#### 3. Missing Event Type
```
Error: Missing event type in webhook payload
Solution: Ensure Monday.com webhook includes event.type field
```

#### 4. Handler Not Found
```
Error: Unsupported event type 'custom_event' for entity 'client'
Solution: Add handler for the event type or filter at Monday.com webhook level
```

### Debugging Tools

#### Webhook Logging
Comprehensive logging is enabled for all webhook events:

```typescript
console.log("[Webhook] Received Monday.com webhook:", {
  queryType: query?.type,
  eventType: body?.event?.type ?? body?.type,
  pulseId: body?.event?.pulseId ?? body?.pulseId,
  boardId: body?.event?.boardId ?? body?.boardId,
  groupId: body?.event?.groupId ?? body?.groupId,
  columnId: body?.event?.columnId ?? body?.columnId,
});
```

#### Handler Execution Tracking
Each handler execution is logged with:
- Entity type and event type
- Processing status and timing
- Success/failure indicators
- Error details when applicable

### Performance Considerations

#### Rate Limiting
- Monday.com API has rate limits (check current limits in Monday.com documentation)
- Webhook processing is designed for real-time responsiveness
- Consider implementing retry logic for failed API calls

#### Data Volume
- Large webhook payloads are truncated in logs (500 characters)
- Sub-item queries include parent context to minimize API calls
- Indexes on `externalId` fields optimize lookup performance

## Integration Examples

### Setting Up a Client Webhook

1. **Monday.com Configuration:**
   - Create webhook pointing to: `https://your-app.com/api/webhooks/monday?type=client`
   - Configure for pulse events: create_pulse, change_column_value

2. **Application Result:**
   - New Monday.com client items create `accounts` records
   - Column changes update account properties
   - External ID maintains synchronization link

### Task Management Flow

1. **Work Item Creation (Monday.com):**
   - Creates Monday.com pulse → triggers webhook
   - Application creates `workItems` record with `externalId`

2. **Task Creation (Monday.com Sub-items):**
   - Creates Monday.com sub-item → triggers webhook
   - Application creates `tasks` record linked to parent work item

3. **Status Updates:**
   - Monday.com status change → webhook → application task status update
   - Application task completion → API call → Monday.com sub-item status update

### Comment Synchronization

```typescript
// Monday.com update → Application chat message
createItemUpdate(itemId: string, body: string) → chatMessages.insert()

// Application message → Monday.com update  
chatMessages.insert() → createItemUpdate(externalId, content)
```

## Security Considerations

1. **API Key Management:** Store Monday.com API key securely in environment variables
2. **Webhook Validation:** Implement webhook secret validation when available
3. **Rate Limiting:** Respect Monday.com API rate limits
4. **Error Exposure:** Avoid exposing sensitive error details in webhook responses
5. **Data Validation:** Validate all incoming webhook payloads before processing

## Monitoring and Maintenance

### Health Checks
- Monitor webhook endpoint availability
- Track API key validity
- Verify synchronization accuracy

### Performance Metrics
- Webhook response times
- API call success rates
- Data synchronization lag

### Regular Maintenance
- Update Monday.com API client library
- Review and update event handlers for new Monday.com features
- Monitor for deprecated API endpoints

## Future Enhancements

### Planned Features
- Enhanced error recovery mechanisms
- Batch synchronization for large data sets
- Real-time synchronization status dashboard
- Advanced conflict resolution for bidirectional updates

### API Evolution
- Support for new Monday.com webhook events
- Enhanced GraphQL query optimization
- Custom field mapping configuration
- Multi-workspace support