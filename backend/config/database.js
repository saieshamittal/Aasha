const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const RedZone = require('../models/RedZone');
const SurvivorStory = require('../models/SurvivorStory');

let mongoMemoryServer;

const demoRedZones = [
  {
    name: 'Kamathipura',
    location: 'Mumbai, Maharashtra',
    riskLevel: 'high',
    lastReport: '2 hours ago',
    activeCases: 12,
    description: 'Known red-light area with multiple reports of trafficking activity.',
    coordinates: { lat: 18.9679, lng: 72.8258 }
  },
  {
    name: 'GB Road',
    location: 'Delhi',
    riskLevel: 'high',
    lastReport: '1 day ago',
    activeCases: 8,
    description: 'Frequent reports of suspicious and illegal activities.',
    coordinates: { lat: 28.648, lng: 77.2245 }
  },
  {
    name: 'Howrah Station Area',
    location: 'Kolkata, West Bengal',
    riskLevel: 'medium',
    lastReport: '3 days ago',
    activeCases: 5,
    description: 'Transit hub with vulnerable population at risk.',
    coordinates: { lat: 22.5832, lng: 88.342 }
  }
];

const demoSurvivorStories = [
  {
    rescueDate: new Date('2024-05-15'),
    location: 'Mumbai, Maharashtra',
    exploitationType: 'sex',
    duration: '6 months',
    currentStatus: 'Under rehabilitation and attending counseling sessions',
    aspirations: 'Return to school and start vocational training',
    livingConditions: 'Lives in a shelter with access to medical support',
    age: 18,
    gender: 'Female',
    source: 'Local NGO referral',
    createdBy: new mongoose.Types.ObjectId(),
    isActive: true
  },
  {
    rescueDate: new Date('2024-03-02'),
    location: 'Delhi',
    exploitationType: 'labor',
    duration: '1 year',
    currentStatus: 'Receiving legal aid and has temporary housing',
    aspirations: 'Find stable employment and reunite with family',
    livingConditions: 'Temporary shelter with regular caseworker visits',
    age: 24,
    gender: 'Male',
    source: 'Community outreach program',
    createdBy: new mongoose.Types.ObjectId(),
    isActive: true
  }
];

const setupMongoListeners = () => {
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected');
  });

  process.on('SIGINT', async () => {
    await mongoose.connection.close();

    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
    }

    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  });
};

const seedFallbackDemoData = async () => {
  const [zoneCount, storyCount] = await Promise.all([
    RedZone.countDocuments(),
    SurvivorStory.countDocuments()
  ]);

  if (zoneCount === 0) {
    const redZoneDocs = await RedZone.insertMany(demoRedZones);
    console.log(`Seeded ${redZoneDocs.length} demo red zones in the local database`);
  }

  if (storyCount === 0) {
    const storyDocs = await SurvivorStory.insertMany(demoSurvivorStories);
    console.log(`Seeded ${storyDocs.length} demo survivor stories in the local database`);
  }
};

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('Attempting to connect to MongoDB...');
    console.log('MongoDB URI:', process.env.MONGODB_URI.substring(0, 20) + '...');

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      family: 4,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    setupMongoListeners();
    await seedFallbackDemoData();
    return conn;
  } catch (error) {
    if (process.env.NODE_ENV === 'development' || process.env.USE_MEMORY_MONGO === 'true') {
      console.warn('Primary MongoDB connection failed, falling back to local in-memory MongoDB...');

      try {
        mongoMemoryServer = mongoMemoryServer || (await MongoMemoryServer.create());
        const conn = await mongoose.connect(mongoMemoryServer.getUri(), {
          serverSelectionTimeoutMS: 10000,
          family: 4,
        });

        console.log(`MongoDB Connected via local memory server: ${conn.connection.host}`);
        setupMongoListeners();
        await seedFallbackDemoData();
        return conn;
      } catch (memoryError) {
        console.error('Local memory MongoDB connection failed:', memoryError.message);
        console.error('Full error:', memoryError);
        process.exit(1);
      }
    }

    console.error('Error connecting to MongoDB:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
};

module.exports = connectDB; 