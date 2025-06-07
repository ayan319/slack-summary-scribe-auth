
# Slack Summarizer - Lovable Project

A React-based Slack integration application built with Lovable that provides AI-powered conversation summaries.

## Features

- 🔐 Slack OAuth Integration
- 📊 Dashboard with workspace management
- 🧪 Connection testing interface
- ⚙️ Settings and user management
- 🎨 Modern UI with Tailwind CSS and shadcn/ui

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (Database, Authentication, Edge Functions)
- **State Management**: TanStack Query
- **Routing**: React Router DOM
- **Icons**: Lucide React

## Project Structure

```
lovable/
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/              # Page components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   ├── integrations/       # External service integrations
│   └── main.tsx           # Application entry point
├── public/                 # Static assets
└── package.json           # Dependencies and scripts
```

## Environment Variables

The following environment variables are configured in Supabase:

- `SLACK_CLIENT_ID` - Slack app client ID
- `SLACK_CLIENT_SECRET` - Slack app client secret  
- `SLACK_REDIRECT_URL` - OAuth callback URL
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Pages

- `/` - Landing page with Slack OAuth
- `/dashboard` - Main dashboard with workspace management
- `/slack-test` - Test Slack API connections
- `/settings` - User settings and preferences
- `/auth/success` - OAuth success confirmation

## Supabase Integration

This project uses Supabase for:
- Database storage (slack_tokens table)
- Edge Functions for OAuth flow
- Secure environment variable management

## Deployment

This project is configured for deployment on Lovable's platform with automatic Supabase integration.
