# AI Capabilities Documentation

## Overview

The My Accounting Dashboard incorporates AI-powered document analysis to streamline intake processes and provide intelligent insights for accounting staff. The AI system automatically analyzes uploaded documents and generates staff-only summaries to improve workflow efficiency and document completeness assessment.

## Document Intake Analysis System

### Core Functionality

The AI system automatically analyzes documents when they are uploaded to tasks, providing:

- **Document Summary:** Plain-English summary of uploaded content
- **Completeness Assessment:** Automated evaluation of document completeness
- **Missing Items Detection:** Identification of typically required but missing documents
- **Suspicious Items Flagging:** Detection of potentially unrelated or problematic documents

### AI Agent Configuration

#### Agent Setup

The system uses **Convex Agent** framework with the following configuration:

```typescript
const intakeAnalyst = new Agent(components.agent, {
  name: "Intake Analyst",
  languageModel: openai("gpt-4o-mini"),
  instructions: `You are an internal intake analyst for an accounting firm...`
});
```

#### Language Model

- **Model:** GPT-4o-mini (OpenAI)
- **Provider:** `@ai-sdk/openai`
- **Integration:** Convex Agent framework (`@convex-dev/agent`)

#### Agent Instructions

The AI agent is configured with specific instructions for accounting context:

```
You are an internal intake analyst for an accounting firm. Your job is to review documents uploaded by clients and provide a brief, actionable summary for staff.

You will receive:
- The work item type (e.g., "2024 Tax Return", "Monthly Bookkeeping")  
- The task name and description
- A list of uploaded document names and types

Guidelines for completeness:
- "complete": All expected documents for this task type appear to be present.
- "incomplete": Clearly missing required documents for this task type.
- "unclear": Cannot determine completeness (unusual task type, ambiguous documents, etc.)

For missingItems:
- List specific documents that are typically required but not uploaded.
- Be practical - for a W-2 upload task, if no W-2 is present, that's missing.

For suspiciousItems:
- Flag documents that seem unrelated to the task.
- Flag documents with unusual names that might indicate wrong files.
- Flag potential duplicates.

Keep the summary concise and professional. Do not make compliance claims or final decisions.
```

### Analysis Output Format

#### Schema Definition

The AI analysis follows a structured schema using Zod validation:

```typescript
const analysisSchema = z.object({
  summary: z.string().describe("A 1-3 sentence plain-English summary of what was uploaded and its relevance to the task."),
  completeness: z.enum(["complete", "incomplete", "unclear"]).describe("Assessment of document completeness."),
  missingItems: z.array(z.string()).describe("List of items that appear to be missing."),
  suspiciousItems: z.array(z.string()).describe("List of items that seem suspicious or need review."),
});
```

#### Database Storage

Analysis results are stored in the `tasks` table `aiAnalysis` field:

```typescript
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
```

#### Completeness Assessment

**Complete:** All expected documents for the task type appear to be present.

**Incomplete:** Clearly missing required documents for the task type.

**Unclear:** Cannot determine completeness due to:
- Unusual task type
- Ambiguous document names  
- Insufficient context

#### Example Analysis Output

```json
{
  "summary": "Client uploaded W-2 form and prior year tax return for 2024 tax preparation.",
  "completeness": "incomplete", 
  "missingItems": ["1099 forms", "Mortgage interest statement (1098)", "Charitable contribution receipts"],
  "suspiciousItems": ["vacation_photos.pdf"],
  "analyzedAt": 1704067200000,
  "analyzedDocumentIds": ["doc123", "doc456"]
}
```

## Staff-Only AI Insights

### Visibility Control

AI analysis is designed exclusively for staff members:

- **Client Visibility:** None - clients cannot see AI analysis results
- **Staff Visibility:** Full access to all analysis components
- **Database Comment:** `/** AI-generated analysis of uploaded documents. Staff-only, not visible to clients. */`

### Staff Access Control

Access to AI insights is controlled through:

```typescript
// User role checking
users: {
  isStaff: v.optional(v.boolean()),
  role: v.optional(v.union(v.literal("owner"), v.literal("admin"), v.literal("member"))),
}

// Index for efficient staff queries
users.index("by_isStaff", ["isStaff"])
```

### Use Cases for Staff

1. **Quick Document Review:** Staff can immediately see if critical documents are missing
2. **Client Follow-up:** Automated identification of items to request from clients
3. **Quality Control:** Flagging of suspicious or unrelated documents
4. **Workflow Optimization:** Understanding document completeness without manual review

## Integration with Document Upload Workflow

### Trigger Mechanism

AI analysis is automatically triggered when:

1. Documents are uploaded to a task
2. The `analyzeTaskDocuments` action is called internally
3. Analysis runs asynchronously without blocking the upload

### Workflow Integration Points

#### Document Upload Process

```typescript
// 1. Document upload to task
documents.insert({
  taskId: taskId,
  storageId: storageId,
  name: filename,
  // ... other fields
});

// 2. Automatic AI analysis trigger
await ctx.scheduler.runAfter(0, internal.src.aiWorkflows.actions.analyzeTaskDocuments, {
  taskId: taskId
});
```

#### Context Building

The system builds rich context for analysis:

```typescript
function buildPrompt(
  workItemTypeName: string,    // e.g., "2024 Tax Return"
  taskName: string,            // e.g., "Upload W-2 Forms"
  taskDescription: string?,    // Optional task details
  documents: Array<{           // All uploaded documents
    name: string,
    mimeType?: string,
    size?: number
  }>
): string
```

#### Analysis Execution Flow

1. **Context Gathering**
   - Fetch task details
   - Get work item type information
   - Collect all uploaded documents

2. **AI Processing**
   - Create agent thread
   - Generate structured analysis using schema
   - Validate output format

3. **Result Storage**
   - Update task with AI analysis
   - Track analyzed document IDs
   - Record analysis timestamp

4. **Error Handling**
   - Comprehensive error logging
   - Graceful degradation if AI fails
   - Clear analysis if no documents remain

## AI Model Usage (GPT-4o-mini)

### Model Selection Rationale

**GPT-4o-mini** was chosen for:

- **Cost Efficiency:** Optimized for high-volume document analysis
- **Speed:** Fast response times for real-time workflow integration
- **Capability:** Sufficient intelligence for document assessment tasks
- **Reliability:** Stable performance for business-critical workflows

### API Integration

#### Provider Configuration

```typescript
import { openai } from "@ai-sdk/openai";

const intakeAnalyst = new Agent(components.agent, {
  languageModel: openai("gpt-4o-mini"),
  // ...
});
```

#### Usage Patterns

- **Single-shot Analysis:** Each document upload triggers one analysis
- **Structured Output:** Uses `generateObject()` with Zod schema
- **Context-aware:** Includes work item type and task context
- **Error Handling:** Comprehensive error catching and logging

#### Performance Characteristics

- **Response Time:** Typically 2-5 seconds for document analysis
- **Token Usage:** Optimized prompts to minimize token consumption
- **Concurrency:** Handles multiple simultaneous analyses
- **Reliability:** Automatic retry logic for transient failures

### Environment Configuration

```env
# OpenAI API configuration
OPENAI_API_KEY=your_openai_api_key_here

# Convex Agent configuration (handled by framework)
```

## Error Handling and Monitoring

### Error Scenarios

#### Common Failure Cases

1. **Missing Task Context**
   ```typescript
   return { success: false, error: "Task not found or has no work item context." };
   ```

2. **AI Model Failures**
   ```typescript
   catch (error) {
     console.error("[AI Analysis] Failed:", error);
     return {
       success: false,
       error: error instanceof Error ? error.message : "AI analysis failed."
     };
   }
   ```

3. **No Documents to Analyze**
   ```typescript
   if (taskContext.documents.length === 0) {
     // Clear existing analysis
     await updateTaskAiAnalysis({ aiAnalysis: undefined });
     return { success: true };
   }
   ```

### Logging and Monitoring

#### Comprehensive Logging

```typescript
console.log(`[AI Analysis] Completed for task ${args.taskId}: ${result.object.completeness}`);
console.error("[AI Analysis] Failed:", error);
console.warn(`[AI Analysis] Task ${args.taskId} not found or deleted.`);
```

#### Performance Tracking

- Analysis completion times
- Success/failure rates
- Token usage patterns
- Error frequency and types

### Graceful Degradation

- **AI Failure:** Task workflow continues without analysis
- **Partial Results:** System handles incomplete analysis gracefully  
- **Recovery:** Analysis can be re-triggered manually if needed
- **Cleanup:** Orphaned analyses are cleared when documents are removed

## Security and Privacy Considerations

### Data Privacy

1. **Document Content:** AI only receives document metadata (names, types, sizes)
2. **No Content Analysis:** Document contents are not sent to AI model
3. **Staff Only:** Results are never exposed to clients
4. **Audit Trail:** All analyses include timestamps and document IDs

### API Security

- **API Key Management:** Secure storage in environment variables
- **Rate Limiting:** Respects OpenAI API rate limits
- **Error Sanitization:** Avoids exposing sensitive information in logs
- **Access Control:** Staff-only access enforced at database level

## Performance Optimization

### Efficient Processing

1. **Async Execution:** Analysis runs asynchronously without blocking uploads
2. **Minimal Context:** Only essential data sent to AI model
3. **Caching Strategy:** Analysis results cached until documents change
4. **Batch Processing:** Multiple documents analyzed in single AI call

### Database Optimization

```typescript
// Efficient document queries
documents
  .query("documents")
  .withIndex("by_taskId", (q) => q.eq("taskId", taskId))
  .filter((q) => q.eq(q.field("deletedAt"), undefined))

// Optimized staff queries  
users.index("by_isStaff", ["isStaff"])
```

## Future Enhancements

### Planned Features

1. **Content Analysis:** OCR integration for actual document content analysis
2. **Learning System:** Model fine-tuning based on staff feedback
3. **Confidence Scoring:** Numerical confidence levels for analysis results
4. **Batch Analysis:** Bulk analysis for existing document collections

### Integration Expansions

1. **Multi-language Support:** Analysis in multiple languages
2. **Industry Specialization:** Tax vs. bookkeeping specific analysis
3. **Client Communication:** Automated missing document requests
4. **Compliance Checking:** Regulatory requirement verification

### Advanced AI Features

1. **Document Classification:** Automatic document type detection
2. **Duplicate Detection:** Advanced duplicate document identification  
3. **Trend Analysis:** Historical pattern recognition
4. **Predictive Analytics:** Completion time predictions based on document analysis