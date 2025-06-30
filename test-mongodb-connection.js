#!/usr/bin/env node

/**
 * MongoDB Connection Test Script
 * 
 * This script tests the MongoDB connection using the same configuration
 * as our unified analytics system.
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

async function testMongoDBConnection() {
  console.log('Testing MongoDB Connection...\n');
  
  // Check environment variables
  const mongoUri = process.env.MONGODB_URI;
  const mongoDb = process.env.MONGODB_DB || 'taskbreakdown-analytics';
  
  console.log('Configuration:');
  console.log(`- MONGODB_URI: ${mongoUri ? 'Set ✓' : 'Not set ✗'}`);
  console.log(`- MONGODB_DB: ${mongoDb}`);
  console.log(`- NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log();
  
  if (!mongoUri) {
    console.error('❌ MONGODB_URI is not set in environment variables');
    console.log('Please check your .env file and ensure MONGODB_URI is configured.');
    process.exit(1);
  }
  
  let client;
  
  try {
    console.log('Connecting to MongoDB...');
    client = new MongoClient(mongoUri);
    await client.connect();
    console.log('✅ Successfully connected to MongoDB');
    
    // Test database access
    const db = client.db(mongoDb);
    console.log(`✅ Database "${mongoDb}" is accessible`);
    
    // Test collections
    const collections = await db.listCollections().toArray();
    console.log(`✅ Database has ${collections.length} collections:`);
    collections.forEach(col => console.log(`   - ${col.name}`));
    
    // Test analytics collection
    const analyticsCollection = db.collection('analytics');
    const analyticsCount = await analyticsCollection.countDocuments();
    console.log(`✅ Analytics collection has ${analyticsCount} documents`);
    
    // Test user_attempts collection
    const attemptsCollection = db.collection('user_attempts');
    const attemptsCount = await attemptsCollection.countDocuments();
    console.log(`✅ User attempts collection has ${attemptsCount} documents`);
    
    console.log('\n🎉 MongoDB connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:');
    console.error(error.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('📤 MongoDB connection closed');
    }
  }
}

// Run the test
testMongoDBConnection().catch(console.error);
