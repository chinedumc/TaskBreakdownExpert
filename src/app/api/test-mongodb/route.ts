import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export async function GET(request: NextRequest) {
  const mongoUri = process.env.MONGODB_URI;
  const mongoDb = process.env.MONGODB_DB;

  if (!mongoUri) {
    return NextResponse.json({ 
      error: 'MONGODB_URI environment variable is not set',
      env: process.env.NODE_ENV 
    }, { status: 500 });
  }

  if (!mongoDb) {
    return NextResponse.json({ 
      error: 'MONGODB_DB environment variable is not set',
      env: process.env.NODE_ENV 
    }, { status: 500 });
  }

  let client: MongoClient | null = null;

  try {
    console.log('Testing MongoDB connection...');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('MONGODB_URI exists:', !!mongoUri);
    console.log('MONGODB_DB:', mongoDb);

    client = new MongoClient(mongoUri);
    await client.connect();
    console.log('Connected to MongoDB successfully');

    const db = client.db(mongoDb);
    const collections = await db.collections();
    console.log('Collections found:', collections.map(c => c.collectionName));

    // Test writing a document
    const analytics = db.collection('analytics');
    const testDoc = {
      test: true,
      timestamp: new Date(),
      testMessage: 'MongoDB connection test'
    };
    
    const insertResult = await analytics.insertOne(testDoc);
    console.log('Test document inserted with ID:', insertResult.insertedId);

    // Test reading documents
    const count = await analytics.countDocuments();
    console.log('Total documents in analytics collection:', count);

    return NextResponse.json({
      success: true,
      message: 'MongoDB connection successful',
      environment: process.env.NODE_ENV,
      database: mongoDb,
      collections: collections.map(c => c.collectionName),
      testDocumentId: insertResult.insertedId,
      totalDocuments: count
    });

  } catch (error) {
    console.error('MongoDB connection error:', error);
    return NextResponse.json({ 
      error: 'MongoDB connection failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      environment: process.env.NODE_ENV,
      mongoUri: mongoUri ? '***SET***' : 'NOT_SET',
      mongoDb: mongoDb || 'NOT_SET'
    }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}
