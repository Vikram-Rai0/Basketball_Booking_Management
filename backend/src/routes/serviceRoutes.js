// Service Routes
import express from 'express';
import {
  getAllServices,
  getActiveServices,
  createService,
  updateService,
  deleteService,
  getTimeSlots,
  createTimeSlot,
  updateTimeSlotStatus,
  deleteTimeSlot
} from '../controllers/serviceController.js';
import { getBookingSlots } from '../controllers/serviceController.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/active', getActiveServices);
router.get('/:service_id/slots/available', getBookingSlots);

// Protected routes (require authentication)
router.use(authMiddleware);

// Admin-only service routes
router.get('/all', adminMiddleware, getAllServices);
router.post('/', adminMiddleware, createService);
router.put('/:service_id', adminMiddleware, updateService);
router.delete('/:service_id', adminMiddleware, deleteService);

// Time slot routes
router.get('/:service_id/slots', getTimeSlots);
router.post('/slots', adminMiddleware, createTimeSlot);
router.put('/slots/:slot_id/status', adminMiddleware, updateTimeSlotStatus);
router.delete('/slots/:slot_id', adminMiddleware, deleteTimeSlot);

export default router;