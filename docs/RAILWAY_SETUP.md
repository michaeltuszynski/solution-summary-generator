# Railway Deployment Guide

## Prerequisites
- Railway account (created with GitHub authentication)
- Anthropic API Key

## Setup Steps

### 1. Connect Your Repository
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select `solution-summary-generator` repository
4. Railway will auto-detect the monorepo structure

### 2. Deploy Backend Service
1. Click "New" → "GitHub Repo" → Select your repo
2. In the service settings, set:
   - **Root Directory**: `/backend`
   - Railway will auto-detect the build configuration from railway.json

### 3. Configure Backend Environment Variables
Add these in the Railway backend service settings:
```
ANTHROPIC_API_KEY=your_claude_api_key_here
NODE_ENV=production
PORT=${{PORT}}
FRONTEND_URL=https://your-frontend-domain.up.railway.app
```

### 4. Deploy Frontend Service
1. Click "New" → "GitHub Repo" → Select your repo again
2. In the service settings, set:
   - **Root Directory**: `/frontend`
   - Railway will auto-detect the build configuration from railway.json

### 5. Configure Frontend Environment Variables
Add these in the Railway frontend service settings:
```
REACT_APP_API_URL=https://your-backend-domain.up.railway.app/api
```

### 6. Set Up Custom Domains (Optional)
1. Go to each service's Settings → Domains
2. Either use Railway's generated domain or add custom domain
3. Update environment variables with correct domains

## File Structure for Railway

```
solution-summary-generator/
├── railway.json              # Root config (optional)
├── package.json             # Root package with scripts
├── backend/
│   ├── railway.json         # Backend-specific config
│   ├── package.json         # Backend dependencies
│   └── src/
└── frontend/
    ├── railway.json         # Frontend-specific config
    ├── package.json         # Frontend dependencies
    └── src/
```

## Deployment Commands

Railway will automatically deploy when you push to GitHub. You can also deploy manually:

```bash
# Install Railway CLI (optional)
npm install -g @railway/cli

# Login
railway login

# Deploy from local
railway up
```

## Monitoring

- Backend health check: `https://your-backend.railway.app/api/health`
- Frontend: `https://your-frontend.railway.app`
- Logs: Available in Railway dashboard for each service

## Common Issues

1. **Build Failures**: Check Node version (requires 18+)
2. **API Connection**: Ensure CORS settings match frontend URL
3. **File Uploads**: May need to adjust Railway's request size limits
4. **Environment Variables**: Double-check all required vars are set

## Cost Optimization

- Railway offers $5 free credits monthly
- Consider using sleep/wake features for dev environments
- Monitor usage in Railway dashboard

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- GitHub Issues: Your repository's issues page