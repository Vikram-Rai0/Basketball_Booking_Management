import express from 'express';
import {
  createBooking,
  confirmBooking,
  getAvailableSlots,
  getUserBookings,
  getAllBookings,
  cancelBooking,
  getBookingStats
} from '../controllers/bookingController.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/available-slots/:service_id', getAvailableSlots);

// Protected user routes
router.post('/create', authMiddleware, createBooking);
router.post('/confirm/:booking_id', authMiddleware, confirmBooking);
router.get('/my-bookings', authMiddleware, getUserBookings);
router.patch('/cancel/:booking_id', authMiddleware, cancelBooking);

// Admin routes
router.get('/all', authMiddleware, adminMiddleware, getAllBookings);
router.get('/stats', authMiddleware, adminMiddleware, getBookingStats);

export default router;