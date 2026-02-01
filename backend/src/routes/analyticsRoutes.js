// routes/analyticsRoutes.js
import express from 'express';
import { getRevenueAnalytics, getBookingHistory } from '../controllers/analyticsController.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const analyticsRouter = express.Router();

analyticsRouter.get('/revenue', authMiddleware, adminMiddleware, getRevenueAnalytics);
analyticsRouter.get('/history', authMiddleware, adminMiddleware, getBookingHistory);

export default analyticsRouter;