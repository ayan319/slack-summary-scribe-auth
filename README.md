# Slack Summary Scribe

A powerful SaaS application that automatically summarizes Slack conversations using AI, helping teams stay informed and productive. Built with Next.js 15 and modern web technologies for production-ready scalability.

## 🚀 Features

- **🧠 AI-Powered Summaries**: Intelligent summaries using OpenRouter (DeepSeek R1 + GPT-4o-mini fallback)
- **⚡ Real-time Integration**: Seamless Slack workspace integration via OAuth
- **🔐 Secure Authentication**: Supabase Auth with session management
- **💾 Data Persistence**: PostgreSQL with Supabase and Prisma ORM
- **📤 Export Options**: PDF, Excel, and Notion export functionality
- **📱 Responsive Design**: Mobile-first design with Tailwind CSS and shadcn/ui
- **🛡️ Security**: Rate limiting, CORS protection, and Sentry monitoring
- **🧪 Comprehensive Testing**: Jest, Playwright E2E tests, and accessibility compliance
- **📊 Analytics**: PostHog integration for user behavior tracking
- **🎨 Dark Mode**: System-aware theme switching with next-themes

## 🛠️ Tech Stack

### Frontend & Backend
- **Next.js 15** - Full-stack React framework with App Router
- **TypeScript** - Type-safe development across the stack
- **React 18** - Modern React with Server Components
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible UI components
- **Framer Motion** - Smooth animations and micro-interactions
- **Tanstack Query** - Server state management

### Database & Auth
- **Supabase** - PostgreSQL database with real-time features
- **Prisma** - Type-safe database ORM
- **Supabase Auth** - Authentication and session management
- **Row Level Security** - Database-level security policies

### AI & Integrations
- **OpenRouter** - AI API gateway (DeepSeek R1 + GPT-4o-mini)
- **Slack Web API** - Slack workspace integration
- **Notion API** - Export summaries to Notion pages

### Monitoring & Analytics
- **Sentry** - Error tracking and performance monitoring
- **PostHog** - Product analytics and feature flags
- **Vercel Analytics** - Web vitals and performance metrics

### Development & Testing
- **Jest** - Unit and integration testing
- **Playwright** - End-to-end testing
- **React Testing Library** - Component testing
- **ESLint** - Code linting with TypeScript rules
- **TypeScript ESLint** - Advanced TypeScript linting
- **Accessibility Testing** - ARIA compliance and keyboard navigation

## 📋 Prerequisites

- **Node.js 18+** and npm/yarn/pnpm
- **Supabase** account and project
- **Slack App** with OAuth permissions
- **OpenRouter API** key (for DeepSeek R1 + GPT-4o-mini)
- **Git** for version control
- **Vercel** account (for deployment)

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

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Configure your environment variables:

```env
# Database
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=your_supabase_database_url

# AI Integration
OPENROUTER_API_KEY=your_openrouter_api_key

# Slack Integration
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret

# Application
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret

# Monitoring (Optional)
SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

### 4. Database Setup

Set up your Supabase database:

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database (development)
npx prisma db push

# Or run migrations (production)
npx prisma migrate deploy
```

### 5. Development Commands

**Start Development Server:**
```bash
npm run dev
```
*Access at: http://localhost:3000*

**Other Useful Commands:**
```bash
# Run tests
npm test

# Run E2E tests
npm run test:e2e

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Type check
npm run type-check

# Database operations
npx prisma studio          # Database GUI
npx prisma generate        # Generate client
npx prisma db push         # Push schema changes
npx prisma migrate dev     # Create migration
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

### Vercel Deployment (Recommended)

1. **Connect Repository**: Link your GitHub repo to Vercel
2. **Framework Preset**: Vercel automatically detects Next.js
3. **Environment Variables**: Add production environment variables in Vercel dashboard
4. **Build Settings**:
   - Build Command: `npm run build` (automatic)
   - Output Directory: `.next` (automatic)
5. **Deploy**: Automatic deployment on git push to main branch

**Required Environment Variables for Vercel:**

```env
# Database
SUPABASE_URL=your_production_supabase_url
SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
DATABASE_URL=your_production_database_url

# AI Integration
OPENROUTER_API_KEY=your_openrouter_api_key

# Slack Integration
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret

# Application
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your_production_secret

# Monitoring
SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
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

## 🔧 Environment Variables Reference

### Core Application Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_SITE_URL` | ✅ | Public URL of your application | `https://your-app.vercel.app` |
| `NEXTAUTH_URL` | ✅ | NextAuth.js URL (same as SITE_URL) | `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | ✅ | Random secret for NextAuth.js | `your-random-32-char-string` |

### Database Configuration

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `SUPABASE_URL` | ✅ | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | ✅ | Supabase anonymous key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `DATABASE_URL` | ✅ | PostgreSQL connection string | `postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres` |

### AI Integration

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `OPENROUTER_API_KEY` | ✅ | OpenRouter API key for AI models | `sk-or-v1-xxx` |

### Slack Integration

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `SLACK_CLIENT_ID` | ⚠️ | Slack app client ID | `123456789.123456789` |
| `SLACK_CLIENT_SECRET` | ⚠️ | Slack app client secret | `abcdef123456789` |

### Monitoring & Analytics

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `SENTRY_DSN` | ⚠️ | Sentry error tracking DSN | `https://xxx@xxx.ingest.sentry.io/xxx` |
| `NEXT_PUBLIC_POSTHOG_KEY` | ⚠️ | PostHog analytics key | `phc_xxx` |
| `NEXT_PUBLIC_POSTHOG_HOST` | ⚠️ | PostHog host URL | `https://app.posthog.com` |

**Legend:**
- ✅ Required for basic functionality
- ⚠️ Optional but recommended for full features

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
