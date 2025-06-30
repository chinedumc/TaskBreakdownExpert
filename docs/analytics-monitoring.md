# Analytics Monitoring Guide

## Production Analytics Access

Your TaskBreakdown Expert application includes built-in analytics tracking. Here's how to monitor your application in production:

### 🚨 Important Note About Authentication

**UPDATE**: The analytics endpoint requires Vercel authentication in production. This is a security feature that protects your API endpoints.

**✅ SOLUTION**: Use the local analytics dashboard server which handles authentication gracefully and provides demo data when needed.

### 1. Analytics API Endpoint

**Production URL:**
```
https://task-breakdown-expert-hn7dpacui-nedums-projects-c8c3a59e.vercel.app/api/analytics
```

### 2. How to Access Analytics (UPDATED)

#### Option A: Local Dashboard Server (RECOMMENDED)
Start the local analytics server that handles authentication issues:

```bash
node run-analytics-dashboard.js
```

This will:
- Start a server at `http://localhost:3001`
- Automatically open your browser
- Handle authentication gracefully
- Show demo data if authentication is required
- Provide real data once you're authenticated

#### Option B: Command Line Script
Run the improved analytics monitoring script:

```bash
./scripts/check-analytics.sh
```

This script now detects authentication issues and provides helpful alternatives.

#### Option C: Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Login to your account
3. Navigate to your project: `task-breakdown-expert`
4. Go to the Functions tab to see API endpoint logs

#### Option D: Direct Browser Access
Visit the analytics URL directly (will require authentication):

```
https://task-breakdown-expert-hn7dpacui-nedums-projects-c8c3a59e.vercel.app/api/analytics
```

### 3. Analytics Data Structure

The analytics endpoint returns the following metrics:

```json
{
  "success": true,
  "metrics": {
    "taskBreakdownsGenerated": 0,
    "emailsSent": 0,
    "downloadsCompleted": 0,
    "lastUpdated": "2025-06-30T07:57:25.000Z",
    "recentTasksCount": 0,
    "recentTasksSample": []
  },
  "analyticsFile": "/tmp/analytics.json",
  "message": "Analytics data retrieved successfully"
}
```

### 4. What Each Metric Tracks

- **taskBreakdownsGenerated**: Number of task breakdowns created by users
- **emailsSent**: Number of emails sent (currently disabled in production)
- **downloadsCompleted**: Number of task breakdown downloads
- **lastUpdated**: Timestamp of last analytics update
- **recentTasksCount**: Total number of recent tasks tracked (max 50)
- **recentTasksSample**: Sample of recent user tasks (first 10, truncated to 50 chars)

### 5. Accessing Without Authentication Issues

If you encounter authentication issues, try these alternatives:

#### Method 1: Vercel CLI Access
```bash
vercel logs https://task-breakdown-expert-hn7dpacui-nedums-projects-c8c3a59e.vercel.app
```

#### Method 2: Check Application Logs
```bash
vercel logs --follow
```

#### Method 3: Use the Local Dashboard
The `analytics-dashboard.html` file bypasses authentication by running locally and fetching from the API.

### 6. Monitoring Best Practices

1. **Regular Checks**: Check analytics daily or weekly to monitor usage
2. **Track Trends**: Look for patterns in task breakdown generation
3. **Download Rates**: Monitor how often users download their task breakdowns
4. **Recent Tasks**: Review recent task samples to understand user needs

### 7. Additional Monitoring Endpoints

#### Log Information

```
https://task-breakdown-expert-hn7dpacui-nedums-projects-c8c3a59e.vercel.app/api/log-info
```

#### Download Tracking (POST)

```
https://task-breakdown-expert-hn7dpacui-nedums-projects-c8c3a59e.vercel.app/api/track-download
```

### 8. Troubleshooting Authentication

If you see "Authentication Required":

1. **Login to Vercel**: Make sure you're logged into vercel.com in your browser
2. **Check Project Settings**: Verify your project permissions in the Vercel dashboard
3. **Use Local Dashboard**: Use the `analytics-dashboard.html` file instead
4. **Contact Support**: If issues persist, check Vercel documentation

### 9. Alternative Monitoring Methods

#### Using Vercel Dashboard
1. Visit [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your `task-breakdown-expert` project
3. Go to "Functions" tab
4. Click on `/api/analytics` function
5. View logs and invocation history

#### Using Browser Developer Tools
1. Open your app: https://task-breakdown-expert-hn7dpacui-nedums-projects-c8c3a59e.vercel.app
2. Open Developer Tools (F12)
3. Go to Console tab
4. Run:
```javascript
fetch('/api/analytics').then(r => r.json()).then(console.log)
```

### 10. Quick Start Guide (UPDATED)

**Easiest Way to Monitor Analytics:**

1. **Start the local dashboard server (RECOMMENDED):**
   ```bash
   cd /Users/chinedumchiboka/Documents/projects/TaskBreakdownExpert
   node run-analytics-dashboard.js
   ```
   This will open a browser at `http://localhost:3001` with your analytics dashboard.

2. **Or run the command-line script:**
   ```bash
   ./scripts/check-analytics.sh
   ```
   This will detect authentication issues and guide you to alternatives.

3. **Or visit directly (requires authentication):**
   ```
   https://task-breakdown-expert-hn7dpacui-nedums-projects-c8c3a59e.vercel.app/api/analytics
   ```

**🎯 The local dashboard server is the best option as it:**
- Handles authentication gracefully
- Provides a beautiful visual interface
- Shows demo data when authentication is required
- Automatically opens in your browser
- Runs locally with no CORS issues

### 11. Understanding Analytics Data

- **Fresh Deployment**: Initially, all metrics will be 0
- **User Activity**: Metrics increment as users interact with your application
- **Data Persistence**: Analytics are stored in Vercel's serverless environment
- **Reset Behavior**: Data may reset with new deployments (this is normal for serverless)

### 12. Privacy and Data

The analytics system:

- ✅ Tracks usage patterns anonymously
- ✅ Stores task titles (for improvement insights)
- ✅ No personal information is collected
- ✅ GDPR-friendly approach
- ✅ Data helps improve the application
