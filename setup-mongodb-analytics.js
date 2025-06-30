#!/usr/bin/env node

/**
 * MongoDB Analytics Test & Setup Script
 * 
 * This script tests MongoDB connectivity and creates initial analytics data
 * to help debug the production zero-values issue.
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

async function testAndSetupMongoDB() {
  console.log('🧪 MongoDB Analytics Test & Setup');
  console.log('================================\n');
  
  // Check environment variables
  const mongoUri = process.env.MONGODB_URI;
  const mongoDb = process.env.MONGODB_DB || 'taskbreakdown-analytics';
  
  console.log('📋 Configuration:');
  console.log(`- MONGODB_URI: ${mongoUri ? 'Set ✓' : 'Not set ✗'}`);
  console.log(`- MONGODB_DB: ${mongoDb}`);
  console.log(`- NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log();
  
  if (!mongoUri) {
    console.error('❌ MONGODB_URI is not set in environment variables');
    process.exit(1);
  }
  
  let client;
  
  try {
    // 1. Test Connection
    console.log('🔗 Testing MongoDB connection...');
    client = new MongoClient(mongoUri);
    await client.connect();
    console.log('✅ Successfully connected to MongoDB');
    
    // 2. Access Database
    const db = client.db(mongoDb);
    console.log(`✅ Database "${mongoDb}" is accessible`);
    
    // 3. Test Collections
    const analyticsCollection = db.collection('analytics');
    const userAttemptsCollection = db.collection('user_attempts');
    
    // 4. Check existing data
    console.log('\n📊 Checking existing data...');
    const existingMetrics = await analyticsCollection.findOne({ _id: 'global' });
    console.log('Current metrics:', existingMetrics || 'None found');
    
    const eventCount = await userAttemptsCollection.countDocuments();
    console.log(`User attempts count: ${eventCount}`);
    
    // 5. Create/Update initial metrics if none exist
    if (!existingMetrics) {
      console.log('\n📝 Creating initial metrics document...');
      const initialMetrics = {
        _id: 'global',
        taskBreakdownsGenerated: 5,
        emailsSent: 2,
        downloadsCompleted: 3,
        lastUpdated: new Date().toISOString(),
        recentTasks: [
          'Sample task: Learn TypeScript',
          'Sample task: Build a React app',
          'Sample task: Deploy to Vercel'
        ]
      };
      
      await analyticsCollection.replaceOne(
        { _id: 'global' },
        initialMetrics,
        { upsert: true }
      );
      console.log('✅ Initial metrics created');
    } else {
      console.log('ℹ️  Metrics document already exists');
    }
    
    // 6. Add some sample events
    const sampleEvents = [
      {
        type: 'task_breakdown',
        timestamp: new Date().toISOString(),
        data: { taskDescription: 'Test task breakdown' }
      },
      {
        type: 'download',
        timestamp: new Date().toISOString(),
        data: { downloadType: 'pdf' }
      },
      {
        type: 'email_sent',
        timestamp: new Date().toISOString(),
        data: {}
      }
    ];
    
    console.log('\n📥 Adding sample events...');
    for (const event of sampleEvents) {
      await userAttemptsCollection.insertOne(event);
      console.log(`✅ Added ${event.type} event`);
    }
    
    // 7. Verify final state
    console.log('\n🎯 Final verification...');
    const finalMetrics = await analyticsCollection.findOne({ _id: 'global' });
    const finalEventCount = await userAttemptsCollection.countDocuments();
    
    console.log('Final metrics:', JSON.stringify(finalMetrics, null, 2));
    console.log(`Total events: ${finalEventCount}`);
    
    // 8. Test indexes
    console.log('\n📊 Creating indexes...');
    await userAttemptsCollection.createIndex({ timestamp: -1 });
    await userAttemptsCollection.createIndex({ type: 1 });
    console.log('✅ Indexes created');
    
    console.log('\n🎉 MongoDB setup completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('1. Deploy this change to production');
    console.log('2. Test /api/analytics endpoint');
    console.log('3. Verify analytics data appears');
    
  } catch (error) {
    console.error('\n❌ MongoDB test failed:');
    console.error(error.message);
    
    if (error.message.includes('bad auth')) {
      console.error('\n🔐 Authentication Issue:');
      console.error('- Check username/password in MONGODB_URI');
      console.error('- Verify MongoDB Atlas user has correct permissions');
      console.error('- Ensure password special characters are URL-encoded');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('\n🌐 Connection Issue:');
      console.error('- Check cluster hostname in MONGODB_URI');
      console.error('- Verify network access (IP whitelist)');
      console.error('- Ensure cluster is running');
    }
    
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('📤 MongoDB connection closed');
    }
  }
}

// Run the test
testAndSetupMongoDB().catch(console.error);
