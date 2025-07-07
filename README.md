# Slack Summary Scribe

<!-- Test GitHub Actions: Minor change for CI/CD validation -->
A powerful SaaS application that automatically summarizes Slack conversations using AI, helping teams stay informed and productive. Built with modern web technologies and designed for scalability.

## 🚀 Features

- **🧠 AI-Powered Summaries**: Automatically generate intelligent summaries using OpenRouter (DeepSeek R1 + GPT-4o-mini fallback)
- **⚡ Real-time Integration**: Seamless integration with Slack workspaces via OAuth
- **🔐 Secure Authentication**: User management with Clerk integration
- **💾 Data Persistence**: Reliable data storage with Supabase PostgreSQL
- **📤 Export Options**: Export summaries to PDF, Notion, and CRM systems
- **📱 Responsive Design**: Modern, mobile-friendly interface built with Tailwind CSS
- **🛡️ Security**: Built-in rate limiting, CORS protection, and security headers
- **🧪 Comprehensive Testing**: Full test coverage with Jest and Testing Library

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Beautiful, accessible UI components
- **React Router** - Client-side routing
- **Tanstack Query** - Server state management

### Backend
- **Express.js** - Node.js web framework
- **TypeScript** - Type-safe server development
- **Supabase** - Backend-as-a-Service (Database, Auth, Storage)
- **Slack Web API** - Slack workspace integration
- **DeepSeek API** - AI-powered text summarization

### Security & Performance
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Express Rate Limit** - API rate limiting
- **Compression** - Response compression
- **Morgan** - HTTP request logging

### Development & Testing
- **Jest** - Testing framework
- **React Testing Library** - Component testing
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TSX** - TypeScript execution for development

## 📋 Prerequisites

- **Node.js 18+** and npm
- **Supabase** account and project
- **Slack App** with OAuth permissions
- **DeepSeek API** key (or OpenAI as alternative)
- **Git** for version control

## 🔧 Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd slack-summary-scribe-auth
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy the example environment file and configure your variables:

```bash
cp .env.example .env
```

Edit `.env` with your actual values (see `.env.example` for all options):

```env
# Essential Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret
DEEPSEEK_API_KEY=your_deepseek_api_key
FRONTEND_URL=http://localhost:5173
PORT=4000
```

### 4. Database Setup

The Supabase migrations are included in the `supabase/migrations/` directory. Apply them through your Supabase dashboard or CLI.

### 5. Development Commands

**Start Frontend Development Server:**
```bash
npm run dev
```
*Access at: http://localhost:5173*

**Start Backend API Server:**
```bash
npm run dev:api
```
*Access at: http://localhost:4000*

**Run Both Concurrently:**
```bash
npm run dev:full
```

**Other Useful Commands:**
```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build for production
npm run build

# Build server for production
npm run build:server

# Start production server
npm start

# Format code
npm run format

# Lint code
npm run lint
```

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Generate Coverage Report

```bash
npm run test:coverage
```

### Test Suites

- **Unit Tests**: Component and utility function tests
- **Integration Tests**: API endpoint tests
- **E2E Tests**: Full user workflow tests

**Current Test Status**: ✅ 6 test suites, 28 tests passing

## 🏗️ Production Build

### Build Frontend

```bash
npm run build
```

Generates optimized static files in `dist/` directory.

### Build Backend

```bash
npm run build:server
```

Compiles TypeScript server code for production.

### Start Production Server

```bash
npm start
```

## 🚀 Deployment

### Frontend Deployment (Vercel)

1. **Connect Repository**: Link your GitHub repo to Vercel
2. **Environment Variables**: Add production environment variables in Vercel dashboard
3. **Build Settings**:
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. **Deploy**: Automatic deployment on git push

**Vercel Configuration** (vercel.json):

```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    }
  ],
  "routes": [
    { "handle": "filesystem" },
    { "src": "/.*", "dest": "/index.html" }
  ]
}
```

### Backend Deployment (Render/Heroku)

#### Render Deployment

1. **Create Web Service**: Connect GitHub repository
2. **Build Command**: `npm install && npm run build:server`
3. **Start Command**: `npm start`
4. **Environment Variables**: Add all required env vars
5. **Auto-Deploy**: Enable automatic deploys from main branch

#### Heroku Deployment

```bash
# Install Heroku CLI and login
heroku create your-app-name
heroku config:set NODE_ENV=production
heroku config:set SUPABASE_URL=your_url
# Add other environment variables
git push heroku main
```

### Environment Variables for Production

```env
NODE_ENV=production
FRONTEND_URL=https://your-app.vercel.app
PORT=4000
# Add all other required variables
```

## 🚀 Enhanced Deployment Guide

### Quick Deploy with Script

Use the included deployment script for easy deployment:

```bash
# Make script executable
chmod +x deploy.sh

# Deploy to Vercel
./deploy.sh vercel

# Build Docker image
./deploy.sh docker

# Check environment setup
./deploy.sh check

# Run tests before deployment
./deploy.sh test
```

### Vercel Deployment (Recommended)

1. **Install Vercel CLI:**
```bash
npm install -g vercel
```

2. **Deploy:**
```bash
npm run build
vercel --prod
```

3. **Set Environment Variables in Vercel Dashboard:**
- `NEXTAUTH_URL` - Your production URL
- `NEXTAUTH_SECRET` - Random secret string
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `DEEPSEEK_API_KEY` - DeepSeek API key
- `SLACK_BOT_TOKEN` - Slack bot token
- `NOTION_TOKEN` - Notion integration token

### Docker Deployment

```bash
# Build image
docker build -t slack-summary-scribe .

# Run container
docker run -p 3000:3000 --env-file .env slack-summary-scribe
```

### Environment Variables for Production

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXTAUTH_URL` | ✅ | Production URL (e.g., https://yourapp.vercel.app) |
| `NEXTAUTH_SECRET` | ✅ | Random secret for NextAuth.js |
| `SUPABASE_URL` | ✅ | Supabase project URL |
| `SUPABASE_ANON_KEY` | ✅ | Supabase anonymous key |
| `OPENROUTER_API_KEY` | ⚠️ | OpenRouter API key for AI analysis (DeepSeek R1 + GPT-4o-mini) |
| `DEEPSEEK_API_KEY` | ⚠️ | Legacy DeepSeek API key (deprecated - use OpenRouter) |
| `SLACK_BOT_TOKEN` | ⚠️ | Slack bot token (xoxb-...) |
| `SLACK_SIGNING_SECRET` | ⚠️ | Slack app signing secret |
| `NOTION_TOKEN` | ⚠️ | Notion integration token |
| `SALESFORCE_TOKEN` | ⚠️ | Salesforce API token |
| `HUBSPOT_TOKEN` | ⚠️ | HubSpot API token |

## 📚 API Documentation

### Base URL

- **Development**: `http://localhost:4000`
- **Production**: `https://your-api.render.com`

### Endpoints

#### Health Check

```http
GET /health
```

Returns server status and uptime.

**Response:**

```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600
}
```

#### Test API

```http
GET /api/test
```

Basic API connectivity test.

**Response:**
```json
{
  "success": true,
  "message": "Server is running!",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Summarize Messages

```http
POST /api/summarize
Content-Type: application/json
```

**Request Body:**

```json
{
  "messages": [
    {
      "user": "john.doe",
      "text": "Message content here",
      "timestamp": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "summary": "AI-generated summary of the conversation",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Get Summary by Message ID

```http
GET /api/summaries/:messageId
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "summary_123",
    "message_id": "msg_456",
    "summary": {
      "title": "Meeting Summary",
      "key_points": ["Point 1", "Point 2"],
      "action_items": ["Action 1", "Action 2"],
      "sentiment": "positive",
      "urgency": "medium",
      "participants": ["user1", "user2"],
      "tags": ["meeting", "planning"]
    },
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Test Slack Event

```http
POST /api/test-slack-event
```

Simulates Slack event processing for testing.

### Error Responses

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details"
}
```

### Rate Limiting

- **Limit**: 100 requests per 15 minutes per IP
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## 🔒 Security Features

- **Helmet**: Security headers (XSS protection, content type sniffing prevention)
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: Prevents API abuse
- **Environment Variables**: Secure configuration management
- **Input Validation**: Request data validation and sanitization
- **Authentication**: Secure user authentication with Clerk

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Write tests for new features
- Follow TypeScript best practices
- Use conventional commit messages
- Ensure all tests pass before submitting PR

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue in the GitHub repository
- Check the documentation
- Review existing issues and discussions

## 🔄 Changelog

### v1.0.0 (Current)

- Initial release
- Slack integration with OAuth
- AI-powered summarization
- User authentication
- Export functionality
- Comprehensive testing suite
- Production-ready deployment configuration

---

**Built with ❤️ using modern web technologies**
