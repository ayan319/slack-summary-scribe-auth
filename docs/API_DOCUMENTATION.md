# SummaryAI API Documentation

## Overview

SummaryAI provides a comprehensive REST API for creating AI-powered summaries, managing teams, and integrating with external services. This documentation covers all available endpoints, authentication, and usage examples.

## Base URL

```
Production: https://summaryai.com/api
Development: http://localhost:3000/api
```

## Authentication

All API requests require authentication using a Bearer token in the Authorization header:

```bash
Authorization: Bearer YOUR_API_TOKEN
```

### Getting an API Token

1. Log in to your SummaryAI account
2. Go to Settings → API Keys
3. Generate a new API key
4. Copy and securely store your token

## Rate Limiting

- **Free Plan**: 100 requests per hour
- **Pro Plan**: 1,000 requests per hour  
- **Enterprise Plan**: 10,000 requests per hour

Rate limit headers are included in all responses:
- `X-RateLimit-Limit`: Request limit per hour
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Time when limit resets (Unix timestamp)

## Error Handling

All errors return a consistent JSON format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### HTTP Status Codes

- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Rate Limited
- `500` - Internal Server Error

## Endpoints

### Summaries

#### Create Summary

Create a new AI summary from text content.

```http
POST /api/summarize
```

**Request Body:**
```json
{
  "text": "Your conversation or meeting transcript here...",
  "title": "Optional summary title",
  "options": {
    "includeActionItems": true,
    "includeSentiment": true,
    "includeSkills": true,
    "customPrompt": "Optional custom prompt"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "summary_123",
    "title": "Team Meeting Summary",
    "summary": "Key points from the conversation...",
    "actionItems": ["Follow up on project X", "Schedule next meeting"],
    "sentiment": "positive",
    "skills": ["project management", "communication"],
    "confidence": 0.95,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

#### Get Summary

Retrieve a specific summary by ID.

```http
GET /api/summaries/{id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "summary_123",
    "title": "Team Meeting Summary",
    "summary": "Key points from the conversation...",
    "actionItems": ["Follow up on project X"],
    "sentiment": "positive",
    "skills": ["project management"],
    "confidence": 0.95,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

#### List Summaries

Get a paginated list of summaries.

```http
GET /api/summaries?page=1&limit=20&team_id=team_123
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `team_id` (optional): Filter by team ID
- `date_from` (optional): Filter from date (ISO 8601)
- `date_to` (optional): Filter to date (ISO 8601)

**Response:**
```json
{
  "success": true,
  "data": {
    "summaries": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

#### Update Summary

Update an existing summary.

```http
PUT /api/summaries/{id}
```

**Request Body:**
```json
{
  "title": "Updated title",
  "summary": "Updated summary content"
}
```

#### Delete Summary

Delete a summary.

```http
DELETE /api/summaries/{id}
```

### Export

#### Export to Notion

Export a summary to Notion.

```http
POST /api/export/notion
```

**Request Body:**
```json
{
  "summaryId": "summary_123",
  "notionPageId": "page_456",
  "title": "Meeting Summary - Jan 15"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "notionPageId": "page_789",
    "notionUrl": "https://notion.so/page_789",
    "status": "success"
  }
}
```

#### Export to PDF

Generate a PDF of a summary.

```http
POST /api/export/pdf
```

**Request Body:**
```json
{
  "summaryId": "summary_123",
  "options": {
    "includeMetadata": true,
    "template": "standard"
  }
}
```

### Teams

#### Get Team Info

Get information about the current user's team.

```http
GET /api/team
```

#### List Team Members

Get a list of team members.

```http
GET /api/team/members
```

#### Invite Team Member

Send a team invitation.

```http
POST /api/team/invite
```

**Request Body:**
```json
{
  "email": "colleague@company.com",
  "role": "member",
  "message": "Join our team!"
}
```

### Usage

#### Get Usage Stats

Get current usage statistics.

```http
GET /api/usage
```

**Response:**
```json
{
  "success": true,
  "data": {
    "used": 45,
    "limit": 100,
    "resetDate": "2024-02-01T00:00:00Z",
    "plan": "pro"
  }
}
```

### Webhooks

#### Slack Webhook

Receive Slack events for automatic summarization.

```http
POST /api/slack/webhook
```

**Request Body:**
```json
{
  "token": "slack_verification_token",
  "event": {
    "type": "message",
    "text": "Meeting notes...",
    "user": "U123456",
    "channel": "C789012",
    "ts": "1234567890.123456"
  }
}
```

## SDKs and Libraries

### JavaScript/TypeScript

```bash
npm install @summaryai/sdk
```

```javascript
import { SummaryAI } from '@summaryai/sdk';

const client = new SummaryAI({
  apiKey: 'your_api_key',
  baseUrl: 'https://summaryai.com/api'
});

// Create a summary
const summary = await client.summaries.create({
  text: 'Your meeting transcript...',
  title: 'Team Meeting'
});

console.log(summary.data);
```

### Python

```bash
pip install summaryai-python
```

```python
from summaryai import SummaryAI

client = SummaryAI(api_key='your_api_key')

# Create a summary
summary = client.summaries.create(
    text='Your meeting transcript...',
    title='Team Meeting'
)

print(summary.data)
```

### cURL Examples

#### Create Summary

```bash
curl -X POST https://summaryai.com/api/summarize \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Meeting transcript here...",
    "title": "Team Meeting Summary"
  }'
```

#### Get Summary

```bash
curl -X GET https://summaryai.com/api/summaries/summary_123 \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

## Webhooks

SummaryAI can send webhooks to notify your application of events:

### Webhook Events

- `summary.created` - New summary created
- `summary.updated` - Summary updated
- `export.completed` - Export finished
- `export.failed` - Export failed

### Webhook Payload

```json
{
  "event": "summary.created",
  "data": {
    "id": "summary_123",
    "title": "Team Meeting Summary",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Webhook Security

Webhooks are signed with HMAC-SHA256. Verify the signature using the `X-Signature` header:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return signature === `sha256=${expectedSignature}`;
}
```

## Best Practices

### Error Handling

Always check the `success` field in responses:

```javascript
const response = await fetch('/api/summarize', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ text: transcript })
});

const result = await response.json();

if (!result.success) {
  console.error('API Error:', result.error);
  return;
}

// Use result.data
console.log(result.data);
```

### Rate Limiting

Implement exponential backoff for rate-limited requests:

```javascript
async function makeRequest(url, options, retries = 3) {
  const response = await fetch(url, options);
  
  if (response.status === 429 && retries > 0) {
    const delay = Math.pow(2, 3 - retries) * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
    return makeRequest(url, options, retries - 1);
  }
  
  return response;
}
```

### Pagination

Handle paginated responses properly:

```javascript
async function getAllSummaries() {
  let page = 1;
  let allSummaries = [];
  
  while (true) {
    const response = await client.summaries.list({ page, limit: 100 });
    
    if (!response.success) break;
    
    allSummaries.push(...response.data.summaries);
    
    if (page >= response.data.pagination.pages) break;
    page++;
  }
  
  return allSummaries;
}
```

## Support

- **Documentation**: https://docs.summaryai.com
- **API Status**: https://status.summaryai.com
- **Support Email**: api-support@summaryai.com
- **Discord Community**: https://discord.gg/summaryai

## Changelog

### v1.2.0 (2024-01-15)
- Added team management endpoints
- Improved error handling
- Added webhook support

### v1.1.0 (2024-01-01)
- Added export endpoints
- Added usage tracking
- Performance improvements

### v1.0.0 (2023-12-01)
- Initial API release
- Core summarization endpoints
- Authentication system

---

*For component documentation, see [COMPONENT_DOCUMENTATION.md](./COMPONENT_DOCUMENTATION.md)*
