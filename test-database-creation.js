#!/usr/bin/env node

/**
 * MongoDB Database Creation Test
 * 
 * This script tests if we can create the database and collections
 * and verifies the automatic creation behavior.
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

async function testDatabaseCreation() {
  console.log('🧪 MongoDB Database Creation Test');
  console.log('==================================\n');
  
  const mongoUri = process.env.MONGODB_URI;
  const mongoDb = process.env.MONGODB_DB || 'taskbreakdown-analytics';
  
  if (!mongoUri) {
    console.error('❌ MONGODB_URI not set');
    process.exit(1);
  }
  
  console.log(`📋 Testing database: ${mongoDb}`);
  console.log(`🔗 Connection string: ${mongoUri.replace(/:[^@]*@/, ':****@')}\n`);
  
  let client;
  
  try {
    // 1. Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    client = new MongoClient(mongoUri);
    await client.connect();
    console.log('✅ Connected successfully');
    
    // 2. List databases BEFORE creating our database
    console.log('\n📊 Existing databases:');
    const adminDb = client.db().admin();
    const dbList = await adminDb.listDatabases();
    dbList.databases.forEach(db => {
      console.log(`  - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    
    const dbExists = dbList.databases.some(db => db.name === mongoDb);
    console.log(`\n🔍 Database "${mongoDb}" exists: ${dbExists ? '✅ YES' : '❌ NO'}`);
    
    // 3. Access our database (this doesn't create it yet)
    console.log(`\n📁 Accessing database "${mongoDb}"...`);
    const db = client.db(mongoDb);
    
    // 4. Try to list collections (database still doesn't exist)
    console.log('📝 Listing collections (before creation):');
    const collectionsBefore = await db.listCollections().toArray();
    console.log(`Collections found: ${collectionsBefore.length}`);
    
    // 5. NOW create the database by inserting data
    console.log('\n🎯 Creating database by inserting test data...');
    const analyticsCollection = db.collection('analytics');
    
    const testMetrics = {
      _id: 'global',
      taskBreakdownsGenerated: 1,
      emailsSent: 1,
      downloadsCompleted: 1,
      lastUpdated: new Date().toISOString(),
      recentTasks: ['Test task: Database creation test']
    };
    
    await analyticsCollection.replaceOne(
      { _id: 'global' },
      testMetrics,
      { upsert: true }
    );
    console.log('✅ Inserted test metrics data');
    
    // 6. Insert a test event
    const userAttemptsCollection = db.collection('user_attempts');
    const testEvent = {
      type: 'task_breakdown',
      timestamp: new Date().toISOString(),
      data: { taskDescription: 'Database creation test' }
    };
    
    await userAttemptsCollection.insertOne(testEvent);
    console.log('✅ Inserted test event data');
    
    // 7. Create indexes
    console.log('\n📊 Creating indexes...');
    await userAttemptsCollection.createIndex({ timestamp: -1 });
    await userAttemptsCollection.createIndex({ type: 1 });
    console.log('✅ Indexes created');
    
    // 8. List databases AFTER creating our database
    console.log('\n📊 Databases after creation:');
    const dbListAfter = await adminDb.listDatabases();
    dbListAfter.databases.forEach(db => {
      const isNew = !dbList.databases.some(oldDb => oldDb.name === db.name);
      console.log(`  ${isNew ? '🆕' : '  '} ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    
    // 9. List collections in our database
    console.log(`\n📝 Collections in "${mongoDb}":`);;
    const collectionsAfter = await db.listCollections().toArray();
    collectionsAfter.forEach(col => {
      console.log(`  - ${col.name}`);
    });
    
    // 10. Verify data was inserted
    console.log('\n🔍 Verifying inserted data:');
    const retrievedMetrics = await analyticsCollection.findOne({ _id: 'global' });
    console.log('Metrics:', JSON.stringify(retrievedMetrics, null, 2));
    
    const eventCount = await userAttemptsCollection.countDocuments();
    console.log(`Events count: ${eventCount}`);
    
    console.log('\n🎉 Database creation test completed successfully!');
    console.log(`\n💡 The database "${mongoDb}" was created automatically when we inserted data.`);
    
  } catch (error) {
    console.error('\n❌ Database creation test failed:');
    console.error(error.message);
    
    if (error.message.includes('bad auth')) {
      console.error('\n🔐 Fix this by:');
      console.error('1. Checking your MongoDB Atlas username/password');
      console.error('2. Ensuring the database user has read/write permissions'); 
      console.error('3. Verifying the password doesn\'t contain special characters needing encoding');
    }
    
  } finally {
    if (client) {
      await client.close();
      console.log('\n📤 Connection closed');
    }
  }
}

testDatabaseCreation().catch(console.error);
