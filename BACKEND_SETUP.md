# 🚀 Backend Setup & Testing Guide

## 📋 Overview

This guide covers the complete backend implementation for the AI Summarization App, including:

- **Slack → AI → Supabase Flow**: End-to-end pipeline from Slack events to stored summaries
- **AI Summary API**: `/api/summarize` endpoint with OpenAI/DeepSeek integration
- **Summary Management**: CRUD operations via `/api/summaries` endpoints
- **React Hooks**: Frontend integration with React Query
- **Testing Suite**: Comprehensive API testing

## 🏗️ Architecture

```
Slack Webhook → AI Summarizer → Supabase Database
     ↓              ↓              ↓
Event Processing → Summary Generation → Data Storage
     ↓              ↓              ↓
Auto-tagging → Skills/Flags Detection → Search & Analytics
```

## 🔧 Environment Setup

### 1. Copy Environment Variables

```bash
cp .env.example .env
```

### 2. Configure Required Variables

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI Services (Required)
DEEPSEEK_API_KEY=your_deepseek_api_key

# Slack (Optional - for webhook integration)
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
SLACK_SIGNING_SECRET=your_slack_signing_secret
```

### 3. Database Schema Setup

The enhanced schema includes:

```sql
-- Enhanced summaries table with comprehensive fields
CREATE TABLE public.summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  team_id TEXT,
  title TEXT,
  summary_text TEXT NOT NULL,
  summary JSONB NOT NULL DEFAULT '{}',
  skills_detected TEXT[] DEFAULT '{}',
  red_flags TEXT[] DEFAULT '{}',
  actions TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  source TEXT NOT NULL DEFAULT 'slack',
  raw_transcript TEXT NOT NULL,
  slack_channel TEXT,
  slack_message_ts TEXT,
  confidence_score DECIMAL(3,2),
  ai_model TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

Apply the schema:
```bash
# Run the database setup script
node scripts/setup-database.js
```

## 🔌 API Endpoints

### 1. Create Summary: `POST /api/summarize`

**Request:**
```json
{
  "transcriptText": "Meeting transcript here...",
  "userId": "user-123",
  "teamId": "team-456",
  "tags": ["meeting", "standup"],
  "context": {
    "source": "slack",
    "channel": "C123456",
    "participants": ["user1", "user2"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "summary-uuid",
    "title": "AI Generated Title",
    "summary": "Concise summary text",
    "bullets": ["Key point 1", "Key point 2"],
    "actionItems": ["Action 1", "Action 2"],
    "skills": ["JavaScript", "React"],
    "redFlags": ["Missing tests"],
    "confidence": 0.95,
    "processingTimeMs": 1500,
    "model": "gpt-4o-mini"
  }
}
```

### 2. Get Summaries: `GET /api/summaries`

**Query Parameters:**
- `userId` - Filter by user ID
- `teamId` - Filter by team ID
- `source` - Filter by source (slack, manual, api)
- `search` - Full-text search
- `tags` - Filter by tags
- `dateFrom` / `dateTo` - Date range filter
- `limit` / `offset` - Pagination
- `includeStats` - Include statistics

**Example:**
```bash
GET /api/summaries?userId=user-123&source=slack&limit=10&includeStats=true
```

### 3. Get Single Summary: `GET /api/summaries/[id]`

### 4. Update Summary: `PUT /api/summaries/[id]`

### 5. Delete Summary: `DELETE /api/summaries/[id]`

### 6. Slack Webhook: `POST /api/slack/webhook`

Automatically processes Slack events and creates summaries for messages containing trigger keywords.

## 🧠 AI Integration

### Supported AI Services

1. **DeepSeek Chat** (Primary)
2. **Mock Fallback** (Development)

### AI Response Structure

```json
{
  "title": "Brief descriptive title",
  "summary": "2-3 sentence overview",
  "bullets": ["Key point 1", "Key point 2"],
  "actionItems": ["Action 1", "Action 2"],
  "speakerBreakdown": [
    {
      "speaker": "John",
      "keyPoints": ["React experience"],
      "sentiment": "positive"
    }
  ],
  "skills": ["React", "TypeScript"],
  "redFlags": ["Limited testing experience"],
  "sentiment": "positive",
  "urgency": "medium",
  "confidence": 0.95
}
```

## 🎣 React Hooks Integration

### useSummaries Hook

```typescript
import { useSummaries } from '@/hooks/useSummaries';

function SummariesPage() {
  const { data, isLoading, error } = useSummaries({
    userId: 'user-123',
    limit: 20
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.data?.summaries.map(summary => (
        <SummaryCard key={summary.id} summary={summary} />
      ))}
    </div>
  );
}
```

### useCreateSummary Hook

```typescript
import { useCreateSummary } from '@/hooks/useSummaries';

function CreateSummaryForm() {
  const createSummary = useCreateSummary();

  const handleSubmit = async (transcript: string) => {
    try {
      const result = await createSummary.mutateAsync({
        transcriptText: transcript,
        userId: 'user-123',
        tags: ['manual']
      });
      console.log('Summary created:', result.data.id);
    } catch (error) {
      console.error('Failed to create summary:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

## 🧪 Testing

### 1. Run Backend Tests

```bash
# Start the development server
npm run dev

# Run comprehensive API tests
node scripts/test-backend.js
```

### 2. Unit Tests

```bash
# Run Jest tests
npm test

# Run specific test files
npm test tests/api/summarize.test.ts
npm test tests/api/summaries.test.ts
```

### 3. Manual Testing with cURL

```bash
# Create a summary
curl -X POST http://localhost:3000/api/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "transcriptText": "Test meeting transcript",
    "userId": "test-user",
    "tags": ["test"]
  }'

# Get summaries
curl "http://localhost:3000/api/summaries?limit=5"

# Search summaries
curl "http://localhost:3000/api/summaries?search=React&limit=10"
```

## 🔍 Monitoring & Debugging

### Database Queries

```sql
-- Check recent summaries
SELECT id, title, created_at, ai_model, confidence_score 
FROM summaries 
ORDER BY created_at DESC 
LIMIT 10;

-- Search summaries
SELECT id, title, summary_text 
FROM summaries 
WHERE to_tsvector('english', summary_text) @@ plainto_tsquery('english', 'React');

-- Get statistics
SELECT 
  source,
  COUNT(*) as count,
  AVG(confidence_score) as avg_confidence
FROM summaries 
GROUP BY source;
```

### Error Handling

The API includes comprehensive error handling:

- **400**: Bad Request (missing/invalid parameters)
- **404**: Not Found (summary doesn't exist)
- **500**: Internal Server Error (AI/database failures)

### Logging

All API endpoints log:
- Request parameters
- Processing time
- AI model responses
- Database operations
- Error details

## 🚀 Production Deployment

### Environment Variables for Production

```env
# Production Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_production_service_key

# Production AI Keys
DEEPSEEK_API_KEY=your_production_deepseek_key

# Security
NEXTAUTH_SECRET=your_production_secret
```

### Performance Considerations

1. **Database Indexing**: Indexes on user_id, team_id, created_at, and full-text search
2. **Caching**: React Query caching for frontend
3. **Rate Limiting**: Implement rate limiting for AI API calls
4. **Error Recovery**: Retry logic for AI service failures

## 📊 Analytics & Insights

The backend provides rich analytics:

- **Summary Statistics**: Total count, average confidence, processing times
- **Skill Tracking**: Most detected skills across summaries
- **Source Analysis**: Breakdown by source (Slack, manual, API)
- **User Activity**: Recent activity and engagement metrics
- **Search Analytics**: Popular search terms and patterns

## 🔐 Security

- **Row Level Security (RLS)**: Implemented on Supabase tables
- **Input Validation**: Comprehensive validation on all endpoints
- **Rate Limiting**: Protection against abuse
- **Error Sanitization**: No sensitive data in error responses
- **Audit Logging**: All operations logged with metadata

---

## 🎯 Next Steps

1. **Set up environment variables** in `.env`
2. **Run database setup**: `node scripts/setup-database.js`
3. **Start development server**: `npm run dev`
4. **Run backend tests**: `node scripts/test-backend.js`
5. **Integrate with frontend** using provided React hooks

The backend is now production-ready with comprehensive AI integration, robust error handling, and scalable architecture! 🚀
