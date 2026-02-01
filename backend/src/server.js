import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cron from 'node-cron';

import authRoutes from './routes/authRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import userRoutes from './routes/userRoutes.js';
import analyticsRouter from './routes/analyticsRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import { cleanupExpiredBookings, markCompletedBookings } from './controllers/bookingController.js';

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'DB_HOST', 'DB_USER', 'DB_NAME'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.error('⚠️  Please check your .env file');
  if (process.env.NODE_ENV !== 'test') {
    process.exit(1);
  }
}

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Background Jobs with node-cron
// Clean up expired pending bookings every 1 minute
cron.schedule('* * * * *', () => {
  console.log('🔄 Running cleanup job for expired bookings...');
  cleanupExpiredBookings();
});

// Mark completed bookings every 15 minutes
cron.schedule('*/15 * * * *', () => {
  console.log('🔄 Running job to mark completed bookings...');
  markCompletedBookings();
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    message: 'Something went wrong',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║  🏀 Basketball Booking System        ║
  ║  Server running on port ${PORT}        ║
  ║  Environment: ${process.env.NODE_ENV || 'development'}           ║
  ║  Background jobs: Active              ║
  ╚═══════════════════════════════════════╝
  `);
});

export default app;