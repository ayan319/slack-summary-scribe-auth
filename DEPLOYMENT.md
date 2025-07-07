# 🚀 Deployment Guide

## Production Deployment

### Frontend Deployment (Vercel)

1. **Build the frontend**:

   ```bash
   npm run build
   ```

2. **Deploy to Vercel**:
   - Connect your GitHub repository to Vercel
   - Set build command: `npm run build`
   - Set output directory: `dist`
   - Add environment variables in Vercel dashboard

### Backend Deployment (Render/Railway/Heroku)

**Recommended: Use the development server for production**

Since the TypeScript server works perfectly with `tsx`, use this approach:

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Set environment variables**:

   ```env
   NODE_ENV=production
   PORT=4000
   FRONTEND_URL=https://your-app.vercel.app
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_key
   # Add other required variables
   ```

3. **Start command**:
   ```bash
   npm run dev:api
   ```

### Platform-Specific Instructions

#### Render

1. Create a new Web Service
2. Connect your GitHub repository
3. Set build command: `npm install`
4. Set start command: `npm run dev:api`
5. Add environment variables
6. Deploy

#### Railway

1. Connect GitHub repository
2. Set start command: `npm run dev:api`
3. Add environment variables
4. Deploy

#### Heroku

```bash
heroku create your-app-name
heroku config:set NODE_ENV=production
heroku config:set PORT=4000
# Add other environment variables
git push heroku main
```

### Environment Variables Checklist

**Required for production:**

- `NODE_ENV=production`
- `PORT=4000`
- `FRONTEND_URL=https://your-frontend-url`
- `SUPABASE_URL=your_supabase_project_url`
- `SUPABASE_ANON_KEY=your_supabase_anon_key`
- `SLACK_CLIENT_ID=your_slack_client_id`
- `SLACK_CLIENT_SECRET=your_slack_client_secret`
- `DEEPSEEK_API_KEY=your_deepseek_api_key`

**Optional:**

- `CLERK_PUBLISHABLE_KEY=your_clerk_key`
- `CLERK_SECRET_KEY=your_clerk_secret`
- `STRIPE_PUBLISHABLE_KEY=your_stripe_key`
- `STRIPE_SECRET_KEY=your_stripe_secret`

### Health Check

Once deployed, test your API:

```bash
curl https://your-api-url.com/health
```

Expected response:

```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600
}
```

### Security Notes

- All environment variables are properly configured
- CORS is set to allow your frontend domain
- Rate limiting is enabled (100 requests per 15 minutes)
- Security headers are applied via Helmet
- Request compression is enabled

### Monitoring

- Check server logs for any errors
- Monitor API response times
- Set up uptime monitoring for the health endpoint
- Monitor rate limit usage

---

**Note**: The development server (`tsx server.ts`) is production-ready and includes all necessary security features, compression, and rate limiting. This approach is simpler and more reliable than the compiled TypeScript approach for this project.
