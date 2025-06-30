#!/usr/bin/env node

/**
 * Analytics Test Script
 * 
 * This script tests the analytics endpoints to populate data
 * and verify the unified analytics system is working.
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:9002';
const isLocal = BASE_URL.includes('localhost');

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Analytics-Test-Script'
      }
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = {
            status: res.statusCode,
            headers: res.headers,
            body: res.headers['content-type']?.includes('application/json') 
              ? JSON.parse(body) 
              : body
          };
          resolve(result);
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testAnalytics() {
  console.log('🧪 Testing Analytics System');
  console.log(`📍 Target: ${BASE_URL}`);
  console.log(`🏠 Environment: ${isLocal ? 'Local Development' : 'Production'}`);
  console.log();

  try {
    // 1. Get initial analytics
    console.log('📊 Getting initial analytics...');
    const initialResponse = await makeRequest('/api/analytics');
    console.log(`Status: ${initialResponse.status}`);
    if (initialResponse.status === 200) {
      console.log('✅ Initial metrics:', JSON.stringify(initialResponse.body, null, 2));
    } else {
      console.log('❌ Failed to get initial analytics:', initialResponse.body);
      return;
    }

    console.log();

    // 2. Test download tracking
    console.log('📥 Testing download tracking...');
    const downloadTests = [
      { downloadType: 'pdf' },
      { downloadType: 'text' },
      { downloadType: 'pdf' }
    ];

    for (const test of downloadTests) {
      const response = await makeRequest('/api/track-download', 'POST', test);
      console.log(`Download ${test.downloadType}: ${response.status === 200 ? '✅' : '❌'} ${response.body?.message || response.body}`);
    }

    console.log();

    // 3. Test task breakdown (if we can simulate it)
    console.log('🎯 Testing task breakdown analytics...');
    // Note: We can't directly test task breakdown without going through the full flow
    console.log('ℹ️  Task breakdown analytics are triggered through the main task breakdown flow');

    console.log();

    // 4. Test email tracking (if we can simulate it) 
    console.log('📧 Testing email analytics...');
    const emailTest = {
      to: 'test@example.com',
      content: 'Test analytics tracking',
      format: 'pdf'
    };
    
    const emailResponse = await makeRequest('/api/send-email', 'POST', emailTest);
    console.log(`Email test: ${emailResponse.status} - ${emailResponse.body?.message || emailResponse.body?.error || 'Check response'}`);

    console.log();

    // 5. Get updated analytics
    console.log('📈 Getting updated analytics...');
    const finalResponse = await makeRequest('/api/analytics');
    if (finalResponse.status === 200) {
      console.log('✅ Final metrics:', JSON.stringify(finalResponse.body, null, 2));
      
      const initial = initialResponse.body.metrics;
      const final = finalResponse.body.metrics;
      
      console.log();
      console.log('📊 Changes:');
      console.log(`- Downloads: ${initial.downloadsCompleted} → ${final.downloadsCompleted} (+${final.downloadsCompleted - initial.downloadsCompleted})`);
      console.log(`- Emails: ${initial.emailsSent} → ${final.emailsSent} (+${final.emailsSent - initial.emailsSent})`);
      console.log(`- Tasks: ${initial.taskBreakdownsGenerated} → ${final.taskBreakdownsGenerated} (+${final.taskBreakdownsGenerated - initial.taskBreakdownsGenerated})`);
      console.log(`- Storage: ${final.storage || 'Unknown'}`);
    } else {
      console.log('❌ Failed to get final analytics:', finalResponse.body);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
console.log('🚀 Starting Analytics Test\n');
testAnalytics().then(() => {
  console.log('\n✅ Analytics test completed');
}).catch(error => {
  console.error('\n❌ Analytics test failed:', error);
  process.exit(1);
});
