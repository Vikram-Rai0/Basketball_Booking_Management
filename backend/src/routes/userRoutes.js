// User Routes
import express from 'express';
import {
  getAllUsers,
  getUserById,
  getUserBookings,
  updateUser,
  deleteUser,
  getUserStats
} from '../controllers/userController.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and admin privileges
router.use(authMiddleware);
router.use(adminMiddleware);

// User management routes
router.get('/', getAllUsers);
router.get('/:user_id', getUserById);
router.get('/:user_id/bookings', getUserBookings);
router.get('/:user_id/stats', getUserStats);
router.put('/:user_id', updateUser);
router.delete('/:user_id', deleteUser);

export default router;