#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 3001;
const ANALYTICS_URL = 'https://task-breakdown-expert-hn7dpacui-nedums-projects-c8c3a59e.vercel.app/api/analytics';

// Create a simple HTTP server
const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/' || req.url === '/analytics-dashboard.html') {
    // Serve the dashboard HTML
    const htmlPath = path.join(__dirname, 'analytics-dashboard.html');
    fs.readFile(htmlPath, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading dashboard');
        return;
      }
      
      // Update the API URL to use our proxy
      const updatedHtml = data.replace(
        'const API_URL = \'https://task-breakdown-expert-hn7dpacui-nedums-projects-c8c3a59e.vercel.app/api/analytics\';',
        `const API_URL = 'http://localhost:${PORT}/api/analytics';`
      );
      
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(updatedHtml);
    });
  } else if (req.url === '/api/analytics') {
    // Proxy the analytics API
    console.log('🔍 Fetching analytics from production...');
    
    const https = require('https');
    const request = https.get(ANALYTICS_URL, (apiRes) => {
      let data = '';
      
      apiRes.on('data', (chunk) => {
        data += chunk;
      });
      
      apiRes.on('end', () => {
        try {
          // Try to parse as JSON
          const jsonData = JSON.parse(data);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(jsonData));
          console.log('✅ Analytics data fetched successfully');
        } catch (error) {
          // If it's HTML (authentication page), return mock data
          console.log('⚠️  Authentication required - returning demo data');
          const mockData = {
            success: true,
            metrics: {
              taskBreakdownsGenerated: 0,
              emailsSent: 0,
              downloadsCompleted: 0,
              lastUpdated: new Date().toISOString(),
              recentTasksCount: 0,
              recentTasksSample: []
            },
            analyticsFile: "/tmp/analytics.json",
            message: "Demo data - Authentication required for production analytics"
          };
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(mockData));
        }
      });
    });
    
    request.on('error', (error) => {
      console.error('❌ Error fetching analytics:', error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Failed to fetch analytics: ' + error.message
      }));
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`
🎯 TaskBreakdown Expert Analytics Dashboard
==========================================

✅ Dashboard server running at: http://localhost:${PORT}

📊 Analytics Options:
• Local Dashboard: http://localhost:${PORT}
• Production API: ${ANALYTICS_URL}

🔗 Opening dashboard in browser...
`);
  
  // Open browser automatically
  const open = process.platform === 'darwin' ? 'open' : 
                process.platform === 'win32' ? 'start' : 'xdg-open';
  
  exec(`${open} http://localhost:${PORT}`, (error) => {
    if (error) {
      console.log('Please manually open: http://localhost:' + PORT);
    }
  });
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down analytics dashboard server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
