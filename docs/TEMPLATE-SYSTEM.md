# Template System and Questionnaire Builder

The My Accounting Dashboard features a comprehensive template system that enables staff to create custom questionnaires with 14+ question types, conditional logic, section organization, and response tracking for structured data collection from clients.

## Overview

The template system consists of:
- **Template Builder**: Visual interface for creating and editing questionnaires
- **Question Types**: 14+ different input types for various data collection needs
- **Section Organization**: Logical grouping of related questions
- **Conditional Logic**: Dynamic question display based on previous responses
- **Response Collection**: Structured storage and tracking of client answers
- **Analytics**: Response analysis and completion tracking

## Database Schema

### Templates Table
```typescript
templates: {
  name: string                     // Template title
  description?: string            // Optional template description
  sections?: Array<{              // Optional section groupings
    id: string                    // Unique section identifier
    title: string                 // Section display title
    description?: string          // Optional section description
    collapsed?: boolean           // Default collapsed state
  }>
  questions: Array<{              // Template questions
    id: string                    // Unique question identifier
    type: QuestionType            // Question input type
    title: string                 // Question text
    description?: string          // Additional instructions
    required: boolean             // Whether answer is required
    sectionId?: string           // Parent section (optional)
    options?: string[]           // For choice-based questions
    validations?: {              // Input validation rules
      min?: number
      max?: number
      pattern?: string
      minLength?: number
      maxLength?: number
    }
    condition?: {                // Conditional display logic
      questionId: string         // Reference question ID
      operator: "equals" | "not_equals" | "contains"
      value: string             // Condition value
    }
  }>
  locked?: boolean               // Prevent further editing
  externalId?: string           // External system reference
  createdBy: Id<"users">        // Template creator
}
```

### Template Responses Table
```typescript
templateResponses: {
  taskId: Id<"tasks">             // Associated task
  templateId: Id<"templates">     // Template being answered
  templateSnapshot?: {            // Template version at response time
    // Frozen copy of template structure
    name: string
    description?: string
    sections?: Section[]
    questions: Question[]
  }
  answers: Array<{               // User responses
    questionId: string           // Question being answered
    value: any                   // Answer value (typed per question)
  }>
  currentQuestionIndex: number   // Progress tracking
  status: "in_progress" | "completed"
  completedAt?: number          // Completion timestamp
  lastSavedAt: number           // Auto-save timestamp
}
```

## Template Creation Process

### Template Builder Interface
The visual template builder provides:

#### Template Metadata
- **Name Field**: Required template title
- **Description**: Optional template description
- **Created By**: Automatically tracks template creator

#### Section Management
- **Add Section**: Create new question groupings
- **Section Title**: Editable section names
- **Section Description**: Optional section instructions
- **Collapsible**: Sections can be collapsed/expanded
- **Remove Section**: Delete sections (moves questions to unsectioned)

#### Question Editor
- **Question Type**: Dropdown selection from 14+ types
- **Question Text**: Required question title
- **Description**: Optional additional instructions
- **Required Toggle**: Mark questions as mandatory
- **Section Assignment**: Move questions between sections

```typescript
// Template builder component structure
<TemplateBuilder>
  <TemplateMetadata />
  <SectionManager>
    <Section>
      <QuestionList>
        <QuestionEditor />
      </QuestionList>
    </Section>
  </SectionManager>
  <SaveActions />
</TemplateBuilder>
```

### Template Builder Features

#### Drag and Drop
- **Question Reordering**: Visual drag handles for question order
- **Section Organization**: Move questions between sections
- **Bulk Operations**: Select and move multiple questions

#### Live Preview
- **Real-time Updates**: Changes immediately visible
- **Question Validation**: Instant validation of question configuration
- **Preview Mode**: See template as clients would experience it

#### Version Control
- **Template Locking**: Prevent changes to active templates
- **Snapshot System**: Response captures template version
- **Edit Tracking**: Audit trail of template modifications

## 14+ Question Types Available

### Text Input Types

#### 1. Short Text (`short_text`)
- **Use Case**: Names, titles, brief responses
- **Validation**: Min/max length, pattern matching
- **Example**: "What is your business name?"

#### 2. Long Text (`long_text`)
- **Use Case**: Descriptions, explanations, detailed responses
- **Features**: Multi-line textarea, character counting
- **Example**: "Describe your business activities in detail"

#### 3. Email (`email`)
- **Use Case**: Email address collection
- **Validation**: Built-in email format validation
- **Features**: Auto-complete support
- **Example**: "What is your primary email address?"

#### 4. Phone (`phone`)
- **Use Case**: Phone number collection
- **Validation**: Phone number format validation
- **Features**: International format support
- **Example**: "What is your primary phone number?"

### Numeric and Date Types

#### 5. Number (`number`)
- **Use Case**: Numeric data, quantities, amounts
- **Validation**: Min/max values, decimal precision
- **Example**: "How many employees does your business have?"

#### 6. Date (`date`)
- **Use Case**: Date selection
- **Features**: Calendar picker interface
- **Validation**: Date range restrictions
- **Example**: "When was your business established?"

### Choice-Based Types

#### 7. Single Choice (`single_choice`)
- **Use Case**: Select one option from multiple choices
- **Features**: Radio button interface
- **Options**: Customizable option list
- **Example**: "What is your filing status?" (Single, Married, etc.)

#### 8. Multiple Choice (`multiple_choice`)
- **Use Case**: Select multiple options
- **Features**: Checkbox interface
- **Validation**: Min/max selection limits
- **Example**: "Which tax forms do you need?" (Check all that apply)

#### 9. Dropdown (`dropdown`)
- **Use Case**: Single selection from many options
- **Features**: Searchable dropdown interface
- **Example**: "Select your state" (50 state options)

### Specialized Types

#### 10. Consent (`consent`)
- **Use Case**: Legal agreements, terms acceptance
- **Features**: Checkbox with required acceptance
- **Example**: "I agree to the terms and conditions"

#### 11. File Upload (`file_upload`)
- **Use Case**: Document collection within forms
- **Features**: Multiple file support, drag-drop interface
- **Example**: "Upload your previous year's tax return"

```typescript
// File upload question component
<FileUploadQuestion
  questionId={question.id}
  value={files}
  onChange={handleFileChange}
  required={question.required}
/>
```

#### 12. Signature (`signature`)
- **Use Case**: Digital signature collection
- **Features**: Touch/mouse signature capture
- **Example**: "Please provide your digital signature"

#### 13. Rating (`rating`)
- **Use Case**: Satisfaction scores, quality ratings
- **Features**: Star or numeric scale
- **Validation**: Min/max rating values
- **Example**: "Rate your satisfaction with our service"

#### 14. Address (`address`)
- **Use Case**: Complete address collection
- **Features**: Structured address fields (street, city, state, zip, country)
- **Validation**: Address format validation
- **Example**: "What is your business address?"

```typescript
// Address question structure
interface AddressValue {
  street?: string
  city?: string
  state?: string
  zip?: string
  country?: string
}
```

## Section Organization

### Section Structure
```typescript
interface Section {
  id: string                    // Unique identifier
  title: string                // Display name
  description?: string         // Optional instructions
  collapsed?: boolean          // Default state
}
```

### Section Features

#### Visual Organization
- **Collapsible Sections**: Sections can be expanded/collapsed
- **Section Headers**: Clear visual separation
- **Progress Indicators**: Show completion status per section
- **Question Count**: Display number of questions per section

#### Unsectioned Questions
- **Default Container**: Questions without section assignment
- **Flexible Organization**: Questions can exist without sections
- **Simple Templates**: Small forms may not need sections

#### Section Management
- **Add/Remove**: Dynamic section creation and deletion
- **Question Migration**: Move questions between sections
- **Reordering**: Change section display order

## Conditional Logic

### Condition Structure
```typescript
interface Condition {
  questionId: string           // Reference to previous question
  operator: "equals" | "not_equals" | "contains"
  value: string               // Comparison value
}
```

### Conditional Display Rules

#### Question Dependencies
- **Sequential Logic**: Conditions only reference previous questions
- **Multiple Conditions**: Questions can have multiple condition sets
- **Nested Logic**: Complex conditional flows supported

#### Supported Operators

##### Equals Operator
- **Exact Match**: Question shows only if previous answer equals specific value
- **Use Case**: "If filing status is 'Married', show spouse information"

##### Not Equals Operator
- **Exclusion Logic**: Question shows unless previous answer matches value
- **Use Case**: "If not a US citizen, show visa information"

##### Contains Operator
- **Partial Match**: Question shows if previous answer contains substring
- **Use Case**: "If business type contains 'LLC', show LLC-specific questions"

### Dynamic Form Behavior
```typescript
// Conditional logic evaluation
const shouldShowQuestion = (question: Question, answers: Answer[]) => {
  if (!question.condition) return true
  
  const refAnswer = answers.find(a => a.questionId === question.condition.questionId)
  if (!refAnswer) return false
  
  const { operator, value } = question.condition
  const answerValue = String(refAnswer.value)
  
  switch (operator) {
    case "equals": return answerValue === value
    case "not_equals": return answerValue !== value
    case "contains": return answerValue.includes(value)
  }
}
```

## Response Collection and Tracking

### Response Flow
1. **Task Assignment**: Template assigned to questionnaire task
2. **Response Creation**: Empty response record created
3. **Progressive Completion**: Users answer questions sequentially
4. **Auto-Save**: Responses saved automatically as user progresses
5. **Validation**: Required questions validated before completion
6. **Final Submission**: Status updated to completed

### Response Storage
```typescript
interface TemplateResponse {
  answers: Array<{
    questionId: string         // Question identifier
    value: any                // Typed response value
  }>
  currentQuestionIndex: number // Progress tracking
  status: "in_progress" | "completed"
  templateSnapshot: Template   // Version control
}
```

### Answer Value Types
Different question types store different value formats:
- **Text Types**: String values
- **Number**: Numeric values
- **Date**: Timestamp values
- **Choice Types**: String or string array
- **File Upload**: File object array
- **Address**: Structured object with address fields
- **Consent**: Boolean value
- **Rating**: Numeric score

### Progress Tracking
- **Question Index**: Current question being answered
- **Completion Percentage**: Calculated from answered vs total questions
- **Section Progress**: Track completion per section
- **Auto-Save Intervals**: Periodic save of partial responses

## Template Responses and Analytics

### Response Analysis

#### Completion Metrics
- **Response Rate**: Percentage of assigned templates completed
- **Time to Completion**: Average time from assignment to completion
- **Abandonment Points**: Where users typically stop responding
- **Question Difficulty**: Questions with high skip rates

#### Answer Analytics
- **Response Distribution**: How answers are distributed across options
- **Common Patterns**: Frequently occurring answer combinations
- **Data Quality**: Validation errors and incomplete responses
- **Trending Analysis**: Changes in responses over time

### Staff Analytics Dashboard
```typescript
// Template analytics data
interface TemplateAnalytics {
  totalResponses: number
  completedResponses: number
  averageCompletionTime: number
  questionAnalytics: Array<{
    questionId: string
    answerCount: number
    skipRate: number
    commonAnswers: Array<{ value: any, count: number }>
  }>
}
```

### Response Export
- **CSV Export**: Structured data export for analysis
- **PDF Reports**: Formatted response reports
- **Data Integration**: API access for external systems
- **Filtering**: Export responses by date range, completion status

## Template Management Features

### Template Lifecycle

#### Creation and Testing
- **Draft Mode**: Templates can be created and tested before deployment
- **Preview Functionality**: See template from client perspective
- **Validation Checks**: Ensure all questions properly configured

#### Deployment
- **Template Assignment**: Assign templates to questionnaire tasks
- **Version Snapshots**: Template structure frozen at assignment time
- **Active Templates**: Track which templates are in use

#### Maintenance
- **Template Locking**: Prevent changes to active templates
- **Version History**: Track changes over time
- **Deprecation**: Mark old templates as inactive

### Template Reuse
- **Template Library**: Reusable templates for common scenarios
- **Cloning**: Create new templates based on existing ones
- **Template Categories**: Organize templates by purpose or client type
- **Sharing**: Templates can be shared across staff members

### Quality Control
- **Review Process**: Templates can be reviewed before activation
- **Testing Framework**: Validate template logic and flow
- **User Experience**: Ensure optimal client experience
- **Accessibility**: Templates meet accessibility standards

This template system provides a powerful, flexible solution for creating custom questionnaires that adapt to client needs while maintaining data quality and providing valuable analytics for continuous improvement of the client onboarding and data collection process.