const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Load environment variables from config.env
require('dotenv').config({ path: path.join(__dirname, 'config.env') });

// Import database connection
const connectDB = require('./config/database');

// Import routes
const survivorStoriesRoutes = require('./routes/survivorStories');
const redZoneRoutes = require('./routes/redZones');
const therapistsRoutes = require('./routes/therapists');
const ngoRoutes = require('./routes/ngos');
const reportRoutes = require('./routes/reports');
const victimRoutes = require('./routes/victims');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

// Initialize express app
const app = express();

// Security middleware
app.use(helmet());

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;

  return allowedOrigins.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1):(517[3-9]|5180)\/?$/.test(origin);
};

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    mongoUri: process.env.MONGODB_URI ? 'Configured' : 'Not configured'
  });
});

// API routes
app.use('/api/survivor-stories', survivorStoriesRoutes);
app.use('/api/red-zones', redZoneRoutes);
app.use('/api/therapists', therapistsRoutes);
app.use('/api/ngos', ngoRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/victims', victimRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Trafficking Prevention Platform API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      survivorStories: '/api/survivor-stories',
      redZones: '/api/red-zones',
      survivorStoriesStats: '/api/survivor-stories/stats',
      survivorStoriesSearch: '/api/survivor-stories/search'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

const startServer = async () => {
  await connectDB();

  const PORT = process.env.PORT || 5005;
  const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`API Documentation: http://localhost:${PORT}/`);
    console.log(`MongoDB URI: ${process.env.MONGODB_URI ? 'Configured' : 'Not configured'}`);
  });

  process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    server.close(() => process.exit(1));
  });

  process.on('uncaughtException', (err) => {
    console.log(`Error: ${err.message}`);
    console.log('Shutting down the server due to uncaught exception');
    process.exit(1);
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

module.exports = app;
